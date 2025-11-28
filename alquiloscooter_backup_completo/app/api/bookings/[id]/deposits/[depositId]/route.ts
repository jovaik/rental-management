

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/bookings/[id]/deposits/[depositId] - Actualizar un depósito específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depositId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { depositId } = await params;
    const body = await request.json();

    const existingDeposit = await prisma.bookingDeposits.findUnique({
      where: { id: parseInt(depositId) }
    });

    if (!existingDeposit) {
      return NextResponse.json({ error: 'Depósito no encontrado' }, { status: 404 });
    }

    // Función auxiliar para validar y parsear valores numéricos
    const parseSafeFloat = (value: any, fallback: any): number => {
      if (value === null || value === undefined || value === '') {
        // Si fallback es un Decimal de Prisma, convertirlo a number
        return typeof fallback?.toNumber === 'function' ? fallback.toNumber() : parseFloat(fallback) || 0;
      }
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        return typeof fallback?.toNumber === 'function' ? fallback.toNumber() : parseFloat(fallback) || 0;
      }
      return parsed;
    };

    // Si el estado cambia a DEVUELTO o PARCIALMENTE_DEVUELTO y no hay fecha_devolucion previa, registrarla automáticamente
    const isChangingToReturned = (body.estado === 'DEVUELTO' || body.estado === 'PARCIALMENTE_DEVUELTO') && 
                                  existingDeposit.estado === 'RETENIDO' && 
                                  !existingDeposit.fecha_devolucion;
    
    const fechaDevolucionFinal = body.fecha_devolucion 
      ? new Date(body.fecha_devolucion)
      : isChangingToReturned 
        ? new Date()  // Registrar automáticamente fecha/hora actual
        : existingDeposit.fecha_devolucion;

    const deposit = await prisma.bookingDeposits.update({
      where: { id: parseInt(depositId) },
      data: {
        monto_deposito: body.monto_deposito !== undefined 
          ? parseSafeFloat(body.monto_deposito, existingDeposit.monto_deposito) 
          : existingDeposit.monto_deposito,
        metodo_pago_deposito: body.metodo_pago_deposito || existingDeposit.metodo_pago_deposito,
        fecha_deposito: body.fecha_deposito ? new Date(body.fecha_deposito) : existingDeposit.fecha_deposito,
        estado: body.estado || existingDeposit.estado,
        monto_devuelto: parseSafeFloat(body.monto_devuelto, existingDeposit.monto_devuelto),
        monto_descontado: parseSafeFloat(body.monto_descontado, existingDeposit.monto_descontado),
        fecha_devolucion: fechaDevolucionFinal,
        metodo_devolucion: body.metodo_devolucion || existingDeposit.metodo_devolucion,
        descuento_danos: parseSafeFloat(body.descuento_danos, existingDeposit.descuento_danos),
        descuento_multas: parseSafeFloat(body.descuento_multas, existingDeposit.descuento_multas),
        descuento_extensiones: parseSafeFloat(body.descuento_extensiones, existingDeposit.descuento_extensiones),
        descuento_otros: parseSafeFloat(body.descuento_otros, existingDeposit.descuento_otros),
        notas: body.notas !== undefined ? body.notas : existingDeposit.notas
      }
    });

    // 📄 Generar y subir justificante de devolución de fianza si el estado es DEVUELTO
    if (deposit.estado === 'DEVUELTO' && existingDeposit.estado !== 'DEVUELTO') {
      try {
        console.log(`📄 [Google Drive] Generando justificante de devolución de fianza...`);
        const { generateAndUploadDepositReturnReceipt } = await import('@/lib/google-drive');
        
        const receiptResult = await generateAndUploadDepositReturnReceipt(existingDeposit.booking_id);

        if (receiptResult.success) {
          console.log(`✅ [Google Drive] Justificante de devolución subido: ${receiptResult.fileUrl}`);
        }
      } catch (receiptError) {
        console.error('❌ [Google Drive] Error generando/subiendo justificante:', receiptError);
      }
    }

    return NextResponse.json(deposit);
  } catch (error) {
    console.error('Error actualizando depósito:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]/deposits/[depositId] - Eliminar un depósito específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depositId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { depositId } = await params;

    await prisma.bookingDeposits.delete({
      where: { id: parseInt(depositId) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando depósito:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
