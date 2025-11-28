import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Obtener líneas de presupuesto para un mes específico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId es requerido' },
        { status: 400 }
      );
    }

    const lineItems = await prisma.budgetLineItem.findMany({
      where: { budget_id: parseInt(budgetId) },
      orderBy: [
        { type: 'asc' },
        { category: 'asc' },
        { subcategory: 'asc' },
      ],
    });

    return NextResponse.json(lineItems);
  } catch (error) {
    console.error('Error fetching budget line items:', error);
    return NextResponse.json(
      { error: 'Error al obtener las líneas de presupuesto' },
      { status: 500 }
    );
  }
}

// POST: Crear/actualizar múltiples líneas de presupuesto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear presupuestos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { budgetId, lineItems } = body;

    if (!budgetId || !lineItems || !Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: 'budgetId y lineItems son requeridos' },
        { status: 400 }
      );
    }

    // Eliminar líneas existentes y crear nuevas (transacción atómica)
    await prisma.$transaction(async (tx) => {
      // Eliminar líneas existentes
      await tx.budgetLineItem.deleteMany({
        where: { budget_id: parseInt(budgetId) },
      });

      // Crear nuevas líneas (filtrar las que tengan amount > 0)
      const validLineItems = lineItems.filter(
        (item: any) => parseFloat(item.budgeted_amount) > 0
      );

      if (validLineItems.length > 0) {
        await tx.budgetLineItem.createMany({
          data: validLineItems.map((item: any) => ({
            budget_id: parseInt(budgetId),
            type: item.type,
            category: item.category,
            subcategory: item.subcategory || null,
            budgeted_amount: parseFloat(item.budgeted_amount),
            notes: item.notes || null,
          })),
        });
      }

      // Actualizar totales en el presupuesto principal
      const incomeTotal = validLineItems
        .filter((item: any) => item.type === 'income')
        .reduce((sum: number, item: any) => sum + parseFloat(item.budgeted_amount), 0);

      const expenseTotal = validLineItems
        .filter((item: any) => item.type === 'expense')
        .reduce((sum: number, item: any) => sum + parseFloat(item.budgeted_amount), 0);

      await tx.financialBudget.update({
        where: { id: parseInt(budgetId) },
        data: {
          budgeted_income: incomeTotal,
          budgeted_expenses: expenseTotal,
        },
      });
    });

    // Obtener líneas actualizadas
    const updatedLineItems = await prisma.budgetLineItem.findMany({
      where: { budget_id: parseInt(budgetId) },
      orderBy: [
        { type: 'asc' },
        { category: 'asc' },
        { subcategory: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      lineItems: updatedLineItems,
    });
  } catch (error) {
    console.error('Error saving budget line items:', error);
    return NextResponse.json(
      { error: 'Error al guardar las líneas de presupuesto' },
      { status: 500 }
    );
  }
}
