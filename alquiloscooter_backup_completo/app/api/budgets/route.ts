export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/budgets - Obtener presupuestos con líneas detalladas
// Query params: year (opcional), month (opcional), detailed (opcional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const detailed = searchParams.get('detailed') === 'true';

    const whereClause: any = {};
    if (year) {
      whereClause.year = parseInt(year);
    }
    if (month) {
      whereClause.month = parseInt(month);
    }

    const budgets = await prisma.financialBudget.findMany({
      where: whereClause,
      include: detailed ? {
        lineItems: {
          orderBy: [
            { type: 'asc' },
            { category: 'asc' }
          ]
        }
      } : undefined,
      orderBy: [
        { year: 'desc' },
        { month: 'asc' }
      ]
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Crear o actualizar presupuesto con líneas detalladas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo admin y super_admin pueden gestionar presupuestos
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { year, month, income_lines, expense_lines, notes } = body;

    // Validar datos requeridos
    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    // Validar que el mes esté entre 1 y 12
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Calcular totales
    const budgeted_income = (income_lines || []).reduce((sum: number, line: any) => 
      sum + parseFloat(line.amount || 0), 0
    );
    const budgeted_expenses = (expense_lines || []).reduce((sum: number, line: any) => 
      sum + parseFloat(line.amount || 0), 0
    );

    // Usar transacción para crear/actualizar presupuesto y líneas
    const result = await prisma.$transaction(async (tx) => {
      // Crear o actualizar presupuesto principal
      const budget = await tx.financialBudget.upsert({
        where: {
          year_month: {
            year: parseInt(year),
            month: parseInt(month)
          }
        },
        update: {
          budgeted_income,
          budgeted_expenses,
          notes: notes || null,
          updated_at: new Date()
        },
        create: {
          year: parseInt(year),
          month: parseInt(month),
          budgeted_income,
          budgeted_expenses,
          notes: notes || null,
          created_by: parseInt(session.user.id)
        }
      });

      // Eliminar líneas existentes
      await tx.budgetLineItem.deleteMany({
        where: { budget_id: budget.id }
      });

      // Crear nuevas líneas de ingreso
      if (income_lines && income_lines.length > 0) {
        await tx.budgetLineItem.createMany({
          data: income_lines.map((line: any) => ({
            budget_id: budget.id,
            type: 'income',
            category: line.category,
            subcategory: line.subcategory || null,
            budgeted_amount: parseFloat(line.amount || 0),
            notes: line.notes || null
          }))
        });
      }

      // Crear nuevas líneas de gasto
      if (expense_lines && expense_lines.length > 0) {
        await tx.budgetLineItem.createMany({
          data: expense_lines.map((line: any) => ({
            budget_id: budget.id,
            type: 'expense',
            category: line.category,
            subcategory: line.subcategory || null,
            budgeted_amount: parseFloat(line.amount || 0),
            notes: line.notes || null
          }))
        });
      }

      // Retornar presupuesto con líneas incluidas
      return await tx.financialBudget.findUnique({
        where: { id: budget.id },
        include: {
          lineItems: {
            orderBy: [
              { type: 'asc' },
              { category: 'asc' }
            ]
          }
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets - Eliminar presupuesto
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo admin y super_admin pueden eliminar presupuestos
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    await prisma.financialBudget.delete({
      where: {
        year_month: {
          year: parseInt(year),
          month: parseInt(month)
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
