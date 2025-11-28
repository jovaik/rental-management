
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncToGSControl } from '@/lib/gscontrol-connector';

// GET - Obtener gastos de un mantenimiento
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    const expenses = await prisma.carRentalMaintenanceExpenses.findMany({
      where: {
        maintenance_id: parseInt(params.id)
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Convertir los campos Decimal a números para evitar problemas en el frontend
    const normalizedExpenses = expenses.map(expense => ({
      ...expense,
      quantity: Number(expense.quantity) || 0,
      unit_price: Number(expense.unit_price) || 0,
      total_price: Number(expense.total_price) || 0,
      tax_rate: Number(expense.tax_rate) || 0,
      tax_amount: Number(expense.tax_amount) || 0,
      warranty_months: expense.warranty_months ? Number(expense.warranty_months) : null,
      paid_by: expense.paid_by
    }));

    // Calcular totales separados
    const totalGeneral = normalizedExpenses.reduce((sum, exp) => sum + Number(exp.total_price), 0);
    const totalOwner = normalizedExpenses
      .filter(exp => exp.paid_by === 'OWNER')
      .reduce((sum, exp) => sum + Number(exp.total_price), 0);
    const totalWorkshop = normalizedExpenses
      .filter(exp => exp.paid_by === 'WORKSHOP')
      .reduce((sum, exp) => sum + Number(exp.total_price), 0);
    const totalThirdParty = normalizedExpenses
      .filter(exp => exp.paid_by === 'THIRD_PARTY')
      .reduce((sum, exp) => sum + Number(exp.total_price), 0);

    return NextResponse.json({
      expenses: normalizedExpenses,
      totals: {
        general: totalGeneral,
        owner: totalOwner,
        workshop: totalWorkshop,
        thirdParty: totalThirdParty
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance expenses:', error);
    return NextResponse.json(
      { error: 'Error al cargar gastos' },
      { status: 500 }
    );
  }
}

// POST - Agregar gasto a un mantenimiento
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    
    const body = await request.json();
    
    // Validar permisos: talleres solo pueden añadir gastos de tipo WORKSHOP
    const paidBy = body.paid_by || 'WORKSHOP';
    if (userRole === 'workshop' && paidBy !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Los talleres solo pueden añadir gastos propios' },
        { status: 403 }
      );
    }
    
    const quantity = parseFloat(body.quantity) || 1;
    const unitPrice = parseFloat(body.unit_price) || 0;
    const taxRate = parseFloat(body.tax_rate) || 0;
    
    const totalPrice = quantity * unitPrice;
    const taxAmount = totalPrice * (taxRate / 100);
    
    const expense = await prisma.carRentalMaintenanceExpenses.create({
      data: {
        maintenance_id: parseInt(params.id),
        expense_category: body.expense_category,
        item_name: body.item_name,
        description: body.description,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        supplier: body.supplier,
        invoice_number: body.invoice_number,
        purchase_date: body.purchase_date ? new Date(body.purchase_date) : null,
        warranty_months: body.warranty_months,
        warranty_expires: body.warranty_expires ? new Date(body.warranty_expires) : null,
        is_billable_to_customer: body.is_billable_to_customer ? 'Y' : 'N',
        tax_rate: taxRate,
        tax_amount: taxAmount,
        notes: body.notes,
        receipt_path: body.receipt_path,
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

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL
    try {
      const maintenance = await prisma.carRentalVehicleMaintenance.findUnique({
        where: { id: parseInt(params.id) },
        include: {
          car: true
        }
      });

      if (maintenance && maintenance.car) {
        const gscontrolId = syncToGSControl({
          type: 'expense',
          amount: Number(expense.total_price),
          description: `${body.expense_category} - ${body.item_name} - ${maintenance.car.registration_number}`,
          date: expense.purchase_date || new Date(),
          paymentMethod: 'TRANSFERENCIA',
          vehicleId: maintenance.car_id,
          category: body.expense_category,
          documentType: expense.invoice_number ? 'FACTURA' : 'NO APLICA'
        });

        // Actualizar con el ID de GSControl
        if (gscontrolId) {
          await prisma.carRentalMaintenanceExpenses.update({
            where: { id: expense.id },
            data: { gscontrol_id: gscontrolId }
          });
          console.log(`✅ Gasto ${expense.id} sincronizado con GSControl: ${gscontrolId}`);
        }
      }
    } catch (gsError) {
      console.error('❌ Error sincronizando con GSControl:', gsError);
      // No bloquear la creación del gasto
    }

    return NextResponse.json(normalizedExpense);
  } catch (error) {
    console.error('Error creating maintenance expense:', error);
    return NextResponse.json(
      { error: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}
