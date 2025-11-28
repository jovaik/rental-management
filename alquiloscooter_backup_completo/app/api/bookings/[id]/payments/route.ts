
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncToGSControl } from '@/lib/gscontrol-connector';

// GET /api/bookings/[id]/payments - Obtener pagos de una reserva
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);

    const payments = await prisma.bookingPayments.findMany({
      where: { booking_id: bookingId },
      orderBy: { fecha_pago: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookings/[id]/payments - Crear un nuevo pago
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await request.json();

    // Obtener datos de la reserva para GSControl (incluye factura si existe)
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        factura: true // Verificar si tiene factura asociada
      }
    });

    // Crear el pago
    const payment = await prisma.bookingPayments.create({
      data: {
        booking_id: bookingId,
        concepto: body.concepto,
        monto: parseFloat(body.monto),
        metodo_pago: body.metodo_pago,
        fecha_pago: body.fecha_pago ? new Date(body.fecha_pago) : new Date(),
        notas: body.notas || null
      }
    });

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL
    // ⚠️  ACTUALIZADO: Incluye documentType, invoiceNumber, clientName, clientDni según PDF
    if (booking) {
      // Determinar el tipo de documento
      let documentType: 'FACTURA' | 'TICKET' | undefined = undefined;
      let invoiceNumber: string | undefined = undefined;

      if (booking.factura) {
        // Hay factura asociada
        documentType = booking.factura.tipo === 'FACTURA' ? 'FACTURA' : 'TICKET';
        invoiceNumber = booking.factura.tipo === 'FACTURA' ? booking.factura.numero : undefined;
      } else {
        // Sin factura → TICKET por defecto
        documentType = 'TICKET';
      }

      const gscontrolId = syncToGSControl({
        type: 'income',
        amount: Number(payment.monto),
        description: `${payment.concepto} - Reserva #${booking.booking_number}`,
        date: payment.fecha_pago,
        paymentMethod: payment.metodo_pago,
        bookingId: booking.id,
        customerId: booking.customer_id || undefined,
        customerName: booking.customer?.first_name ? `${booking.customer.first_name} ${booking.customer.last_name || ''}`.trim() : booking.customer_name || undefined,
        customerDni: booking.customer?.dni_nie || undefined,
        documentType: documentType,
        invoiceNumber: invoiceNumber
      });

      // Actualizar con el ID de GSControl
      if (gscontrolId) {
        await prisma.bookingPayments.update({
          where: { id: payment.id },
          data: { gscontrol_id: gscontrolId }
        });
        console.log(`✅ Pago ${payment.id} sincronizado con GSControl (tipo: ${documentType}, cliente: ${booking.customer?.first_name || booking.customer_name})`);
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creando pago:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
