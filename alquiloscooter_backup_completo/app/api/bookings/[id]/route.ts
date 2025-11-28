
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { regenerateContractIfNotSigned } from '@/lib/contract-regeneration';
import { sendGoogleReviewRequest } from '@/lib/email';
import { syncToGSControl } from '@/lib/gscontrol-connector';

// GET /api/bookings/[id] - Obtener información de una reserva
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const booking = await prisma.carRentalBookings.findUnique({
      where: { id },
      include: {
        car: true,
        customer: true,
        vehicles: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true,
                status: true
              }
            }
          }
        },
        drivers: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    return NextResponse.json(booking);

  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    // Prepare update data
    const updateData: any = {
      car_id: body.car_id ? parseInt(body.car_id) : undefined,
      pickup_date: body.pickup_date ? new Date(body.pickup_date) : undefined,
      return_date: body.return_date ? new Date(body.return_date) : undefined,
      total_price: body.total_price !== undefined && body.total_price !== null ? parseFloat(body.total_price) : undefined,
      status: body.status
    };

    // If customer_id is provided, use it and update legacy fields from customer data
    if (body.customer_id) {
      updateData.customer_id = parseInt(body.customer_id);
      
      const customer = await prisma.carRentalCustomers.findUnique({
        where: { id: updateData.customer_id }
      });
      
      if (customer) {
        updateData.customer_name = `${customer.first_name} ${customer.last_name}`;
        updateData.customer_email = customer.email || '';
        updateData.customer_phone = customer.phone || '';
      }
    } else {
      // Use legacy fields for backward compatibility
      updateData.customer_name = body.customer_name;
      updateData.customer_email = body.customer_email;
      updateData.customer_phone = body.customer_phone;
    }

    // Obtener estado anterior para detectar cambios
    const previousBooking = await prisma.carRentalBookings.findUnique({
      where: { id },
      include: { customer: true }
    });

    const booking = await prisma.carRentalBookings.update({
      where: { id },
      data: updateData,
      include: {
        car: true,
        customer: true
      }
    });

    // Regenerar contrato si no está firmado
    try {
      await regenerateContractIfNotSigned(
        id, 
        'Modificación de reserva',
        session.user.email || 'system'
      );
    } catch (contractError) {
      console.error('Error regenerando contrato:', contractError);
      // No bloquear la actualización de la reserva si falla la regeneración del contrato
    }

    // 🔥 SINCRONIZACIÓN AUTOMÁTICA A GSCONTROL cuando se confirma o completa una reserva
    // IMPORTANTE: Como AlquiloScooter, las reservas se consideran "pagadas" cuando están CONFIRMED (cliente se lleva el vehículo)
    if ((updateData.status === 'confirmed' && previousBooking?.status !== 'confirmed') ||
        (updateData.status === 'completed' && previousBooking?.status !== 'completed' && previousBooking?.status !== 'confirmed')) {
      try {
        const statusLabel = updateData.status === 'confirmed' ? 'confirmada' : 'completada';
        console.log(`🔄 [GSControl Auto-Sync] Sincronizando reserva #${booking.id} (${statusLabel}) automáticamente...`);
        
        // Obtener información del cliente para GSControl
        const customerName = booking.customer?.first_name 
          ? `${booking.customer.first_name} ${booking.customer.last_name || ''}`.trim()
          : booking.customer_name || 'Cliente';
        
        const customerDni = booking.customer?.dni_nie || '';
        const vehicleRegistration = booking.car?.registration_number || 'Sin vehículo';

        // 🚀 Sincronizar a GSControl (FIRE-AND-FORGET - instantáneo)
        const gsExternalId = syncToGSControl({
          type: 'income',
          amount: parseFloat(String(booking.total_price || 0)),
          description: `Reserva #${booking.booking_number} - ${customerName} - ${vehicleRegistration}`,
          date: booking.pickup_date!,
          bookingId: booking.id,
          customerId: booking.customer_id || undefined,
          customerName: customerName,
          customerDni: customerDni || undefined,
          vehicleId: booking.car_id || undefined,
          documentType: 'NO APLICA',
          ivaRate: 21,
        });

        if (gsExternalId) {
          console.log(`✅ [GSControl Auto-Sync] ExternalId generado: ${gsExternalId}`);
          
          // 💾 GUARDAR el gscontrol_external_id en la base de datos
          await prisma.carRentalBookings.update({
            where: { id: booking.id },
            data: { gscontrol_external_id: gsExternalId }
          });
          
          console.log(`✅ [GSControl Auto-Sync] ExternalId guardado en DB: ${gsExternalId}`);
        } else {
          console.warn(`⚠️ [GSControl Auto-Sync] No se pudo generar ExternalId para la reserva #${booking.id}.`);
        }
      } catch (syncError) {
        console.error('❌ [GSControl Auto-Sync] Error en sincronización automática:', syncError);
      }
    }

    // Si la reserva acaba de completarse, enviar solicitud de reseña
    if (
      updateData.status === 'completed' && 
      previousBooking?.status !== 'completed' &&
      booking.customer &&
      booking.booking_number
    ) {
      try {
        const customerName = booking.customer.first_name 
          ? `${booking.customer.first_name} ${booking.customer.last_name || ''}`.trim()
          : booking.customer_name || 'Cliente';

        console.log('🎉 Reserva completada. Enviando solicitud de reseña por email...');
        
        // Capturar customer para el closure async
        const customer = booking.customer;
        const bookingNumber = booking.booking_number;
        
        // Enviar email de forma asíncrona (no esperar para no bloquear la respuesta)
        // El WhatsApp se gestiona manualmente desde el frontend con enlace wa.me
        (async () => {
          if (customer?.email && bookingNumber) {
            try {
              console.log('📧 Enviando email de solicitud de reseña...');
              await sendGoogleReviewRequest(
                customer.email,
                customerName,
                bookingNumber,
                customer.country || null
              );
              console.log('✅ Solicitud de reseña enviada por email correctamente');
            } catch (emailError) {
              console.error('❌ Error enviando por email:', emailError);
            }
          } else {
            console.log('⚠️ Cliente sin email. No se enviará email de reseña.');
          }
        })().catch(error => {
          console.error('❌ Error en el proceso de solicitud de reseña:', error);
          // No bloquear el completado de la reserva
        });

      } catch (reviewError) {
        console.error('❌ Error al procesar solicitud de reseña:', reviewError);
        // No bloquear el completado de la reserva
      }

      // 💰 Sincronizar con GSControl (consolidación económica)
      try {
        console.log('💰 Sincronizando ingreso con GSControl...');
        
        // Obtener información completa de la reserva para sincronización
        const bookingWithDetails = await prisma.carRentalBookings.findUnique({
          where: { id },
          include: {
            customer: true,
            factura: true,
            vehicles: {
              include: {
                car: {
                  select: {
                    registration_number: true
                  }
                }
              }
            }
          }
        });

        if (bookingWithDetails && bookingWithDetails.customer) {
          const syncData = {
            id: bookingWithDetails.id,
            bookingNumber: bookingWithDetails.booking_number || `RES-${bookingWithDetails.id}`,
            totalAmount: parseFloat(bookingWithDetails.total_price?.toString() || '0'),
            startDate: bookingWithDetails.pickup_date || new Date(),
            customer: {
              name: bookingWithDetails.customer.first_name 
                ? `${bookingWithDetails.customer.first_name} ${bookingWithDetails.customer.last_name || ''}`.trim()
                : bookingWithDetails.customer_name || 'Cliente',
              email: bookingWithDetails.customer.email || bookingWithDetails.customer_email || '',
              documentNumber: bookingWithDetails.customer.dni_nie || null,
            },
            invoiceNumber: bookingWithDetails.factura?.numero || null,
            ivaRate: 21,
            vehicles: bookingWithDetails.vehicles
              ?.filter(v => v.car.registration_number)
              .map(v => ({
                licensePlate: v.car.registration_number!
              })) || []
          };

          // Sincronización con GSControl manejada automáticamente por los pagos individuales
        }
      } catch (gsError) {
        console.error('❌ Error sincronizando con GSControl:', gsError);
        // No bloquear el completado de la reserva
      }
    }

    return NextResponse.json(booking);

  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    // 🔍 PASO 1: Obtener la reserva y sus pagos ANTES de eliminarla
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id },
      select: { gscontrol_external_id: true }
    });

    const payments = await prisma.bookingPayments.findMany({
      where: { booking_id: id },
      select: { gscontrol_id: true }
    });

    // 🗑️  PASO 2: Eliminar la reserva (esto eliminará en cascada los pagos debido a la FK)
    await prisma.carRentalBookings.delete({
      where: { id }
    });

    // 🔄 PASO 3: SINCRONIZACIÓN BIDIRECCIONAL CON GSCONTROL
    // Recopilar TODOS los IDs de GSControl (reserva + pagos)
    const allGSControlIds: string[] = [];
    
    // Añadir ID de la reserva principal
    if (booking?.gscontrol_external_id) {
      allGSControlIds.push(booking.gscontrol_external_id);
      console.log(`🔍 Encontrado gscontrol_external_id de reserva: ${booking.gscontrol_external_id}`);
    }
    
    // Añadir IDs de los pagos
    payments.forEach(p => {
      if (p.gscontrol_id) {
        allGSControlIds.push(p.gscontrol_id);
        console.log(`🔍 Encontrado gscontrol_id de pago: ${p.gscontrol_id}`);
      }
    });

    // 🚀 Eliminar de GSControl si hay transacciones sincronizadas (FIRE-AND-FORGET)
    if (allGSControlIds.length > 0) {
      const { deleteGSControlTransaction } = await import('@/lib/gscontrol-connector');
      const success = deleteGSControlTransaction(allGSControlIds);
      if (success) {
        console.log(`🚀 Reserva ${id} eliminada. GSControl: Eliminación de ${allGSControlIds.length} transacción(es) enviada`);
      } else {
        console.warn(`⚠️  No se pudo enviar eliminación de GSControl para reserva ${id}`);
      }
    } else {
      console.log(`ℹ️  Reserva ${id} eliminada sin transacciones en GSControl`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Booking deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
