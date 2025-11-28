
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateGSControlTransaction, deleteGSControlTransaction } from '@/lib/gscontrol-connector';

// PUT - Actualizar gasto
export async function PUT(
  request: Request,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    
    const body = await request.json();
    
    // Obtener el gasto actual para verificar permisos
    const currentExpense = await prisma.carRentalMaintenanceExpenses.findUnique({
      where: { id: parseInt(params.expenseId) }
    });
    
    if (!currentExpense) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      );
    }
    
    // Validar permisos: talleres solo pueden editar gastos de tipo WORKSHOP
    if (userRole === 'workshop' && currentExpense.paid_by !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este gasto' },
        { status: 403 }
      );
    }
    
    const paidBy = body.paid_by || currentExpense.paid_by;
    
    // Talleres no pueden cambiar el tipo de pago
    if (userRole === 'workshop' && paidBy !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Los talleres solo pueden gestionar gastos propios' },
        { status: 403 }
      );
    }
    
    console.log('Updating expense with data:', body);
    
    const quantity = parseFloat(body.quantity) || 1;
    const unitPrice = parseFloat(body.unit_price) || 0;
    const taxRate = parseFloat(body.tax_rate) || 0;
    
    const totalPrice = quantity * unitPrice;
    const taxAmount = totalPrice * (taxRate / 100);
    
    const expense = await prisma.carRentalMaintenanceExpenses.update({
      where: {
        id: parseInt(params.expenseId)
      },
      data: {
        expense_category: body.expense_category || 'other',
        item_name: body.item_name?.trim() || '',
        description: body.description?.trim() || null,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        supplier: body.supplier?.trim() || null,
        invoice_number: body.invoice_number?.trim() || null,
        purchase_date: body.purchase_date ? new Date(body.purchase_date) : null,
        warranty_months: parseInt(body.warranty_months) || null,
        warranty_expires: body.warranty_expires ? new Date(body.warranty_expires) : null,
        is_billable_to_customer: body.is_billable_to_customer ? 'Y' : 'N',
        tax_rate: taxRate,
        tax_amount: taxAmount,
        notes: body.notes?.trim() || null,
        receipt_path: body.receipt_path || null,
        paid_by: paidBy
      }
    });

    // Convertir los campos Decimal a números para evitar problemas en el frontend
    const normalizedExpense = {
      ...expense,
      quantity: Number(expense.quantity) || 0,
      unit_price: Number(expense.unit_price) || 0,
      total_price: Number(expense.total_price) || 0,
      tax_rate: Number(expense.tax_rate) || 0,
      tax_amount: Number(expense.tax_amount) || 0,
      warranty_months: expense.warranty_months ? Number(expense.warranty_months) : null,
      paid_by: expense.paid_by
    };

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL (UPDATE)
    if (currentExpense.gscontrol_id) {
      try {
        updateGSControlTransaction(currentExpense.gscontrol_id, {
          amount: totalPrice,
          description: body.description || `${body.expense_category} - ${body.item_name}`,
          date: body.purchase_date ? new Date(body.purchase_date) : undefined,
          paymentMethod: 'TRANSFERENCIA'
        });
        console.log(`✅ Gasto ${expense.id} actualizado en GSControl`);
      } catch (gsError) {
        console.error('❌ Error actualizando en GSControl:', gsError);
      }
    }

    console.log('Expense updated successfully:', expense.id);
    return NextResponse.json(normalizedExpense);
  } catch (error: any) {
    console.error('Error updating maintenance expense:', error);
    return NextResponse.json(
      { error: `Error al actualizar gasto: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    
    // Obtener el gasto actual para verificar permisos
    const currentExpense = await prisma.carRentalMaintenanceExpenses.findUnique({
      where: { id: parseInt(params.expenseId) }
    });
    
    if (!currentExpense) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      );
    }
    
    // Validar permisos: talleres solo pueden eliminar gastos de tipo WORKSHOP
    if (userRole === 'workshop' && currentExpense.paid_by !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este gasto' },
        { status: 403 }
      );
    }
    
    // Eliminar de la base de datos local
    await prisma.carRentalMaintenanceExpenses.delete({
      where: {
        id: parseInt(params.expenseId)
      }
    });

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL (DELETE)
    if (currentExpense.gscontrol_id) {
      try {
        deleteGSControlTransaction(currentExpense.gscontrol_id);
        console.log(`✅ Gasto ${params.expenseId} eliminado de GSControl`);
      } catch (gsError) {
        console.error('❌ Error eliminando de GSControl:', gsError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance expense:', error);
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}
