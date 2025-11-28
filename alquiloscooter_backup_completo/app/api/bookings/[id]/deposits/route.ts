
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/bookings/[id]/deposits - Obtener todos los depósitos de una reserva
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

    const deposits = await prisma.bookingDeposits.findMany({
      where: { booking_id: bookingId },
      orderBy: { fecha_deposito: 'desc' }
    });

    return NextResponse.json(deposits);
  } catch (error) {
    console.error('Error obteniendo depósitos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookings/[id]/deposits - Crear nuevo depósito
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

    // Validar y limpiar todos los valores numéricos
    const parseSafeFloat = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Validar que el monto del depósito sea válido
    const montoDeposito = parseSafeFloat(body.monto_deposito);
    if (montoDeposito <= 0) {
      return NextResponse.json(
        { error: 'El monto del depósito debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Log de valores antes de crear el depósito
    const dataToCreate = {
      booking_id: bookingId,
      monto_deposito: montoDeposito,
      metodo_pago_deposito: body.metodo_pago_deposito || 'EFECTIVO',
      fecha_deposito: body.fecha_deposito ? new Date(body.fecha_deposito) : new Date(),
      estado: body.estado || 'RETENIDO',
      monto_devuelto: parseSafeFloat(body.monto_devuelto),
      monto_descontado: parseSafeFloat(body.monto_descontado),
      fecha_devolucion: body.fecha_devolucion ? new Date(body.fecha_devolucion) : null,
      metodo_devolucion: body.metodo_devolucion || null,
      descuento_danos: parseSafeFloat(body.descuento_danos),
      descuento_multas: parseSafeFloat(body.descuento_multas),
      descuento_extensiones: parseSafeFloat(body.descuento_extensiones),
      descuento_otros: parseSafeFloat(body.descuento_otros),
      notas: body.notas || null
    };
    
    console.log('[DEBUG] Creando depósito con datos:', JSON.stringify(dataToCreate, null, 2));
    
    // Crear nuevo depósito con valores validados
    let deposit;
    try {
      deposit = await prisma.bookingDeposits.create({
        data: dataToCreate
      });
    } catch (prismaError: any) {
      console.error('[PRISMA ERROR] Error detallado:', prismaError);
      console.error('[PRISMA ERROR] Code:', prismaError.code);
      console.error('[PRISMA ERROR] Meta:', JSON.stringify(prismaError.meta, null, 2));
      throw prismaError;
    }

    // 📄 Generar y subir justificante de devolución de fianza si el estado es DEVUELTO
    if (deposit.estado === 'DEVUELTO') {
      try {
        console.log(`📄 [Google Drive] Generando justificante de devolución de fianza...`);
        const { generateAndUploadDepositReturnReceipt } = await import('@/lib/google-drive');
        
        const receiptResult = await generateAndUploadDepositReturnReceipt(bookingId);

        if (receiptResult.success) {
          console.log(`✅ [Google Drive] Justificante de devolución subido: ${receiptResult.fileUrl}`);
        }
      } catch (receiptError) {
        console.error('❌ [Google Drive] Error generando/subiendo justificante:', receiptError);
      }
    }

    console.log('[DEBUG] Depósito creado exitosamente:', deposit.id);
    return NextResponse.json(deposit);
  } catch (error) {
    console.error('[ERROR] Error creando depósito:', error);
    console.error('[ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[ERROR] Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}


