/**
 * Endpoint para reenviar notificación de inspección
 * ✅ VERSIÓN UNIFICADA: Usa la misma arquitectura que los contratos
 * - Envío en background (Promise.resolve)
 * - PDF generator unificado
 * - Email utils compartidos
 * - Responde inmediatamente al frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendInspectionNotification } from '@/lib/inspection-email-notifier';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. ✅ Validar sesión (igual que contratos)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const inspectionId = parseInt(params.id);
    
    console.log(`📧 [API Reenvío] Solicitado reenvío de notificación para inspección ${inspectionId}...`);
    
    // 2. ✅ Obtener datos de la inspección
    const inspection = await prisma.vehicleInspections.findUnique({
      where: { id: inspectionId },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: {
              include: {
                car: true
              }
            }
          }
        },
        vehicle: true
      }
    });

    if (!inspection) {
      console.error(`❌ [API Reenvío] Inspección ${inspectionId} no encontrada`);
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      );
    }

    if (!inspection.booking) {
      console.error(`❌ [API Reenvío] Reserva no encontrada para inspección ${inspectionId}`);
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    const booking = inspection.booking;
    const customer = booking.customer;
    const vehicle = inspection.vehicle || booking.vehicles[0]?.car;

    if (!customer || !vehicle) {
      console.error(`❌ [API Reenvío] Datos incompletos para inspección ${inspectionId}`);
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // 3. ✅ ENVIAR EMAIL EN BACKGROUND CON LOGS DETALLADOS
    // Esto permite que la API responda inmediatamente sin esperar el email
    Promise.resolve().then(async () => {
      try {
        console.log(`\n📧 ============ INICIO ENVÍO BACKGROUND ============`);
        console.log(`📧 [API Reenvío] Iniciando envío en background para inspección ${inspectionId}...`);
        console.log(`📧 [API Reenvío] Datos:`, {
          inspectionId: inspection.id,
          bookingNumber: booking.booking_number,
          customerEmail: customer.email,
          customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          vehicleInfo: `${vehicle.make} ${vehicle.model} - ${vehicle.registration_number}`,
          inspectionType: inspection.inspection_type,
        });
        
        const result = await sendInspectionNotification({
          inspectionId: inspection.id,
          bookingNumber: booking.booking_number || `Reserva ${booking.id}`,
          customerEmail: customer.email || '',
          customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          vehicleInfo: `${vehicle.make} ${vehicle.model} - ${vehicle.registration_number}`,
          inspectionType: inspection.inspection_type || 'delivery',
          inspectionDate: inspection.inspection_date || new Date(),
          pickupDate: booking.pickup_date || undefined,
          returnDate: booking.return_date || undefined
        });

        if (result.success) {
          console.log(`✅ [API Reenvío] ========== EMAIL ENVIADO EXITOSAMENTE ==========`);
          console.log(`✅ [API Reenvío] Inspección ${inspectionId} procesada correctamente`);
        } else {
          console.error(`❌ [API Reenvío] ========== ERROR ENVIANDO EMAIL ==========`);
          console.error(`❌ [API Reenvío] Inspección ${inspectionId} - Error:`, result.error);
        }
      } catch (error: any) {
        console.error(`❌ [API Reenvío] ========== ERROR EN BACKGROUND TASK ==========`);
        console.error(`❌ [API Reenvío] Inspección ${inspectionId}`);
        console.error(`❌ [API Reenvío] Tipo:`, error.constructor?.name || 'Unknown');
        console.error(`❌ [API Reenvío] Mensaje:`, error.message);
        console.error(`❌ [API Reenvío] Stack:`, error.stack);
        console.error(`❌ [API Reenvío] ================================================`);
      }
    });

    // 4. ✅ Responder inmediatamente (igual que contratos)
    console.log(`✅ [API Reenvío] Respuesta enviada, email se procesará en background`);
    
    return NextResponse.json({
      success: true,
      message: 'Notificación programada para envío'
    });
  } catch (error: any) {
    console.error('❌ [API Reenvío] ========== ERROR COMPLETO ==========');
    console.error('❌ [API Reenvío] Mensaje:', error.message);
    console.error('❌ [API Reenvío] Stack:', error.stack);
    console.error('❌ [API Reenvío] ======================================');
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}
