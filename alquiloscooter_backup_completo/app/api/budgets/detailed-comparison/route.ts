export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBookingWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

// GET /api/budgets/detailed-comparison - Comparación detallada por categorías
// Query params: year (requerido), month (requerido)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    const yearInt = parseInt(year);
    const monthInt = parseInt(month);

    // Obtener presupuesto con líneas detalladas
    const budget = await prisma.financialBudget.findUnique({
      where: {
        year_month: {
          year: yearInt,
          month: monthInt
        }
      },
      include: {
        lineItems: {
          orderBy: [
            { type: 'asc' },
            { category: 'asc' }
          ]
        }
      }
    });

    // Calcular fechas del período
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);

    // Filtro de rol para bookings
    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);
    const bookingWhereClause = getBookingWhereClause({ userId, userRole });

    // ========== CALCULAR INGRESOS REALES POR GRUPO TARIFARIO ==========
    
    // Obtener grupos tarifarios
    const pricingGroups = await prisma.carRentalPricingGroups.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });

    // Obtener ingresos por reservas confirmadas/completadas
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        ...bookingWhereClause,
        status: { in: ['confirmed', 'completed'] },
        pickup_date: { gte: startDate, lte: endDate }
      },
      include: {
        vehicles: {
          include: {
            car: {
              include: {
                pricingGroup: true
              }
            }
          }
        }
      }
    });

    // Función para extraer el número de grupo del nombre
    const extractGroupNumber = (groupName: string | null | undefined): string => {
      if (!groupName) return '6'; // Sin grupo -> Grupo 6 (Residual)
      
      const match = groupName.match(/Grupo\s+(\d+)/i);
      if (match) {
        return match[1]; // Retorna "1", "2", "3", etc.
      }
      return '6'; // Si no hay match, va a grupo 6 (residual)
    };

    // Agrupar ingresos por grupo tarifario
    const incomeByGroup: Record<string, number> = {};
    let extrasIncome = 0;

    bookings.forEach((booking: any) => {
      const totalPrice = parseFloat(booking.total_price?.toString() || '0');
      
      if (booking.vehicles && booking.vehicles.length > 0) {
        booking.vehicles.forEach((bv: any) => {
          const groupName = bv.car?.pricingGroup?.name;
          const groupNumber = extractGroupNumber(groupName);
          const vehiclePrice = parseFloat(bv.vehicle_price?.toString() || '0');
          
          if (!incomeByGroup[groupNumber]) {
            incomeByGroup[groupNumber] = 0;
          }
          incomeByGroup[groupNumber] += vehiclePrice;
        });
        
        // Los extras son la diferencia entre total y suma de vehículos
        const vehiclesTotal = booking.vehicles.reduce((sum: number, bv: any) => 
          sum + parseFloat(bv.vehicle_price?.toString() || '0'), 0
        );
        extrasIncome += totalPrice - vehiclesTotal;
      } else {
        // Si no hay vehículos asignados, contarlo como Grupo 6 (Residual)
        if (!incomeByGroup['6']) {
          incomeByGroup['6'] = 0;
        }
        incomeByGroup['6'] += totalPrice;
      }
    });

    // Agregar categoría "Extras"
    if (extrasIncome > 0) {
      incomeByGroup['Extras'] = extrasIncome;
    }

    // ========== CALCULAR GASTOS REALES POR CATEGORÍA ==========
    
    const expenses = await prisma.carRentalGastos.findMany({
      where: {
        fecha: { gte: startDate, lte: endDate }
      },
      select: {
        categoria: true,
        total: true
      }
    });

    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.categoria || 'Otros';
      const amount = parseFloat(expense.total?.toString() || '0');
      
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += amount;
    });

    // ========== CALCULAR COMISIONES REALES ==========
    
    // Obtener vehículos en comisión con sus reservas del período
    const commissionVehicles = await prisma.carRentalCars.findMany({
      where: {
        ownership_type: 'commission',
        status: 'T',
        bookings: {
          some: {
            pickup_date: { gte: startDate, lte: endDate },
            status: { in: ['confirmed', 'completed'] }
          }
        }
      },
      include: {
        bookings: {
          where: {
            pickup_date: { gte: startDate, lte: endDate },
            status: { in: ['confirmed', 'completed'] }
          }
        }
      }
    });

    // Calcular total de comisiones
    let totalCommissions = 0;
    commissionVehicles.forEach((vehicle: any) => {
      const totalRevenue = vehicle.bookings.reduce((sum: number, booking: any) => {
        return sum + (booking.total_price ? parseFloat(booking.total_price.toString()) : 0);
      }, 0);

      const fixedCosts = vehicle.monthly_fixed_costs ? parseFloat(vehicle.monthly_fixed_costs.toString()) : 0;
      const netIncome = totalRevenue - fixedCosts;
      
      if (vehicle.commission_percentage && netIncome > 0) {
        const commissionAmount = (netIncome * parseFloat(vehicle.commission_percentage.toString())) / 100;
        totalCommissions += commissionAmount;
      }
    });

    // Agregar comisiones a las categorías de gastos
    if (totalCommissions > 0) {
      expensesByCategory['Comisiones'] = totalCommissions;
    }

    // ========== CONSTRUIR RESPUESTA DETALLADA ==========
    
    // Líneas de ingreso
    let incomeLines: any[] = [];
    
    if (budget?.lineItems && budget.lineItems.length > 0) {
      // Si hay lineItems, usarlas
      incomeLines = budget.lineItems
        .filter(line => line.type === 'income')
        .map(line => {
          const budgeted = parseFloat(line.budgeted_amount?.toString() || '0');
          const actual = incomeByGroup[line.category] || 0;
          const deviation = actual - budgeted;
          const deviationPercent = budgeted > 0 ? (deviation / budgeted) * 100 : 0;
          
          return {
            category: line.category,
            budgeted,
            actual,
            deviation,
            deviationPercent
          };
        });
    } else {
      // Si no hay lineItems, crear líneas con todas las categorías que tienen datos reales
      incomeLines = Object.keys(incomeByGroup).map(category => {
        const actual = incomeByGroup[category] || 0;
        return {
          category,
          budgeted: 0,
          actual,
          deviation: actual,
          deviationPercent: 0
        };
      });
    }

    // Líneas de gasto
    let expenseLines: any[] = [];
    
    if (budget?.lineItems && budget.lineItems.length > 0) {
      // Si hay lineItems, usarlas
      expenseLines = budget.lineItems
        .filter(line => line.type === 'expense')
        .map(line => {
          const budgeted = parseFloat(line.budgeted_amount?.toString() || '0');
          // Si es una subcuenta, no comparar con actual (no hay desglose en gastos reales)
          const actual = line.subcategory ? 0 : (expensesByCategory[line.category] || 0);
          const deviation = actual - budgeted;
          const deviationPercent = budgeted > 0 ? (deviation / budgeted) * 100 : 0;
          
          return {
            category: line.category,
            subcategory: line.subcategory,
            budgeted,
            actual,
            deviation,
            deviationPercent
          };
        });
    } else {
      // Si no hay lineItems, crear líneas con todas las categorías que tienen datos reales
      expenseLines = Object.keys(expensesByCategory).map(category => {
        const actual = expensesByCategory[category] || 0;
        return {
          category,
          budgeted: 0,
          actual,
          deviation: actual,
          deviationPercent: 0
        };
      });
    }

    // Calcular totales
    const budgetedIncome = incomeLines.reduce((sum, line) => sum + line.budgeted, 0);
    const actualIncome = incomeLines.reduce((sum, line) => sum + line.actual, 0);
    const incomeDeviation = actualIncome - budgetedIncome;
    const incomeDeviationPercent = budgetedIncome > 0 ? (incomeDeviation / budgetedIncome) * 100 : 0;

    const budgetedExpenses = expenseLines.reduce((sum, line) => sum + line.budgeted, 0);
    const actualExpenses = expenseLines.reduce((sum, line) => sum + line.actual, 0);
    const expenseDeviation = actualExpenses - budgetedExpenses;
    const expenseDeviationPercent = budgetedExpenses > 0 ? (expenseDeviation / budgetedExpenses) * 100 : 0;

    const budgetedBalance = budgetedIncome - budgetedExpenses;
    const actualBalance = actualIncome - actualExpenses;
    const balanceDeviation = actualBalance - budgetedBalance;
    const balanceDeviationPercent = budgetedBalance !== 0 ? (balanceDeviation / Math.abs(budgetedBalance)) * 100 : 0;

    return NextResponse.json({
      year: yearInt,
      month: monthInt,
      hasBudget: !!budget,
      incomeLines,
      expenseLines,
      totals: {
        budgetedIncome,
        actualIncome,
        incomeDeviation,
        incomeDeviationPercent,
        budgetedExpenses,
        actualExpenses,
        expenseDeviation,
        expenseDeviationPercent,
        budgetedBalance,
        actualBalance,
        balanceDeviation,
        balanceDeviationPercent
      }
    });
  } catch (error) {
    console.error('Error calculating detailed comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
