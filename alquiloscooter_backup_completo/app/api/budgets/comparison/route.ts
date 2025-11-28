export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBookingWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

// GET /api/budgets/comparison - Obtener comparación presupuesto vs realidad
// Query params: year (requerido), month (opcional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam) {
      return NextResponse.json(
        { error: 'Year is required' },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);
    const month = monthParam ? parseInt(monthParam) : null;

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);
    const bookingWhere = getBookingWhereClause({ userId, userRole });

    // Si se especifica mes, obtener datos para ese mes
    if (month) {
      // Obtener presupuesto para el mes
      const budget = await prisma.financialBudget.findUnique({
        where: {
          year_month: {
            year,
            month
          }
        }
      });

      // Calcular ingresos reales (reservas confirmadas/completadas)
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const bookings = await prisma.carRentalBookings.findMany({
        where: {
          ...bookingWhere,
          status: { in: ['confirmed', 'completed'] },
          pickup_date: {
            gte: startDate,
            lt: endDate
          }
        },
        select: { total_price: true }
      });

      const actualIncome = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);

      // Calcular gastos reales (de la tabla car_rental_gastos)
      const expenses = await prisma.carRentalGastos.findMany({
        where: {
          fecha: {
            gte: startDate,
            lt: endDate
          }
        },
        select: { total: true }
      });

      const actualExpenses = expenses.reduce((sum, e) => sum + Number(e.total), 0);

      // Calcular desviaciones
      const budgetedIncome = budget ? Number(budget.budgeted_income) : 0;
      const budgetedExpenses = budget ? Number(budget.budgeted_expenses) : 0;

      const incomeDeviation = actualIncome - budgetedIncome;
      const expensesDeviation = actualExpenses - budgetedExpenses;

      const incomeDeviationPercent = budgetedIncome > 0 
        ? ((incomeDeviation / budgetedIncome) * 100)
        : 0;

      const expensesDeviationPercent = budgetedExpenses > 0
        ? ((expensesDeviation / budgetedExpenses) * 100)
        : 0;

      return NextResponse.json({
        period: 'monthly',
        year,
        month,
        budget: {
          income: budgetedIncome,
          expenses: budgetedExpenses,
          balance: budgetedIncome - budgetedExpenses
        },
        actual: {
          income: actualIncome,
          expenses: actualExpenses,
          balance: actualIncome - actualExpenses
        },
        deviation: {
          income: incomeDeviation,
          expenses: expensesDeviation,
          balance: (actualIncome - actualExpenses) - (budgetedIncome - budgetedExpenses),
          incomePercent: incomeDeviationPercent,
          expensesPercent: expensesDeviationPercent
        }
      });
    }

    // Si no se especifica mes, obtener datos para todo el año
    const budgets = await prisma.financialBudget.findMany({
      where: { year },
      orderBy: { month: 'asc' }
    });

    // Calcular totales presupuestados
    const totalBudgetedIncome = budgets.reduce((sum, b) => sum + Number(b.budgeted_income), 0);
    const totalBudgetedExpenses = budgets.reduce((sum, b) => sum + Number(b.budgeted_expenses), 0);

    // Calcular ingresos reales del año
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const yearBookings = await prisma.carRentalBookings.findMany({
      where: {
        ...bookingWhere,
        status: { in: ['confirmed', 'completed'] },
        pickup_date: {
          gte: startDate,
          lt: endDate
        }
      },
      select: { total_price: true }
    });

    const actualIncome = yearBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

    // Calcular gastos reales del año (de la tabla car_rental_gastos)
    const yearExpenses = await prisma.carRentalGastos.findMany({
      where: {
        fecha: {
          gte: startDate,
          lt: endDate
        }
      },
      select: { total: true }
    });

    const actualExpenses = yearExpenses.reduce((sum, e) => sum + Number(e.total), 0);

    // Calcular desviaciones
    const incomeDeviation = actualIncome - totalBudgetedIncome;
    const expensesDeviation = actualExpenses - totalBudgetedExpenses;

    const incomeDeviationPercent = totalBudgetedIncome > 0
      ? ((incomeDeviation / totalBudgetedIncome) * 100)
      : 0;

    const expensesDeviationPercent = totalBudgetedExpenses > 0
      ? ((expensesDeviation / totalBudgetedExpenses) * 100)
      : 0;

    // Calcular comparación mes por mes
    const monthlyComparison = [];
    for (let m = 1; m <= 12; m++) {
      const monthBudget = budgets.find(b => b.month === m);
      const monthStart = new Date(year, m - 1, 1);
      const monthEnd = new Date(year, m, 1);

      const monthBookings = await prisma.carRentalBookings.findMany({
        where: {
          ...bookingWhere,
          status: { in: ['confirmed', 'completed'] },
          pickup_date: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        select: { total_price: true }
      });

      const monthActualIncome = monthBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

      const monthExpenses = await prisma.carRentalGastos.findMany({
        where: {
          fecha: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        select: { total: true }
      });

      const monthActualExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.total), 0);

      const monthBudgetedIncome = monthBudget ? Number(monthBudget.budgeted_income) : 0;
      const monthBudgetedExpenses = monthBudget ? Number(monthBudget.budgeted_expenses) : 0;

      monthlyComparison.push({
        month: m,
        budget: {
          income: monthBudgetedIncome,
          expenses: monthBudgetedExpenses
        },
        actual: {
          income: monthActualIncome,
          expenses: monthActualExpenses
        },
        deviation: {
          income: monthActualIncome - monthBudgetedIncome,
          expenses: monthActualExpenses - monthBudgetedExpenses
        }
      });
    }

    return NextResponse.json({
      period: 'yearly',
      year,
      budget: {
        income: totalBudgetedIncome,
        expenses: totalBudgetedExpenses,
        balance: totalBudgetedIncome - totalBudgetedExpenses
      },
      actual: {
        income: actualIncome,
        expenses: actualExpenses,
        balance: actualIncome - actualExpenses
      },
      deviation: {
        income: incomeDeviation,
        expenses: expensesDeviation,
        balance: (actualIncome - actualExpenses) - (totalBudgetedIncome - totalBudgetedExpenses),
        incomePercent: incomeDeviationPercent,
        expensesPercent: expensesDeviationPercent
      },
      monthlyComparison
    });

  } catch (error) {
    console.error('Budget comparison API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
