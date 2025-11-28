
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateGSControlTransaction, deleteGSControlTransaction } from '@/lib/gscontrol-connector';

// PUT /api/bookings/[id]/payments/[paymentId] - Actualizar un pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await params;
    const id = parseInt(paymentId);
    const body = await request.json();

    // Obtener el pago actual para ver si tiene gscontrol_id
    const currentPayment = await prisma.bookingPayments.findUnique({
      where: { id }
    });

    // Actualizar el pago
    const payment = await prisma.bookingPayments.update({
      where: { id },
      data: {
        concepto: body.concepto,
        monto: body.monto !== undefined ? parseFloat(body.monto) : undefined,
        metodo_pago: body.metodo_pago,
        fecha_pago: body.fecha_pago ? new Date(body.fecha_pago) : undefined,
        notas: body.notas
      }
    });

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL (UPDATE)
    if (currentPayment?.gscontrol_id) {
      updateGSControlTransaction(currentPayment.gscontrol_id, {
        amount: body.monto !== undefined ? parseFloat(body.monto) : undefined,
        description: body.concepto,
        date: body.fecha_pago ? new Date(body.fecha_pago) : undefined,
        paymentMethod: body.metodo_pago
      });
      console.log(`✅ Pago ${id} actualizado en GSControl`);
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error actualizando pago:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]/payments/[paymentId] - Eliminar un pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await params;
    const id = parseInt(paymentId);

    // Obtener el pago antes de eliminarlo para obtener gscontrol_id
    const payment = await prisma.bookingPayments.findUnique({
      where: { id }
    });

    // Eliminar de la base de datos local
    await prisma.bookingPayments.delete({
      where: { id }
    });

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL (DELETE)
    if (payment?.gscontrol_id) {
      deleteGSControlTransaction(payment.gscontrol_id);
      console.log(`✅ Pago ${id} eliminado de GSControl`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando pago:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
