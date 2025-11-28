

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBookingWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';
import { generateBookingNumber } from '@/lib/booking-number';
import { syncToGSControl } from '@/lib/gscontrol-connector';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const statusFilter = searchParams.get('status');

    // Obtener filtros basados en el rol del usuario
    const roleBasedWhere = getBookingWhereClause({ userId, userRole });
    
    const whereClause: any = {
      ...roleBasedWhere
    };

    // Filtrar por status si se especifica
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (start && end) {
      whereClause.OR = [
        {
          pickup_date: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        {
          return_date: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        {
          AND: [
            { pickup_date: { lte: new Date(start) } },
            { return_date: { gte: new Date(end) } }
          ]
        }
      ];
    }

    // Get all bookings with car and customer details
    // IMPORTANTE: Mostramos TODAS las reservas (pasadas, presentes, futuras)
    // No filtramos por status para que siempre estén visibles
    const bookings = await prisma.carRentalBookings.findMany({
      where: whereClause,
      include: {
        car: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true,
            status: true
          }
        },
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
        drivers: true,
        extras: {
          include: {
            extra: true
          }
        },
        upgrades: {
          include: {
            upgrade: true
          }
        },
        experiences: {
          include: {
            experience: true
          }
        }
      },
      orderBy: { pickup_date: 'desc' }
    });

    return NextResponse.json(bookings);

  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Soportar tanto single vehicle (legacy) como múltiples vehículos (nuevo)
    const vehicleIds: { id: number; price?: number }[] = body.vehicle_ids || (body.car_id ? [{ id: parseInt(body.car_id), price: body.total_price || 0 }] : []);
    
    // Validate required fields
    if (vehicleIds.length === 0 || !body.pickup_date || !body.return_date) {
      return NextResponse.json({ error: 'Faltan campos requeridos. Debe especificar al menos un vehículo, fecha de recogida y fecha de devolución' }, { status: 400 });
    }

    const pickupDate = new Date(body.pickup_date);
    const returnDate = new Date(body.return_date);

    // VALIDACIÓN CRÍTICA: Verificar si ALGUNO de los vehículos ya está reservado en esas fechas
    const allCarIds = vehicleIds.map(v => v.id);
    
    // Fórmula estándar de solapamiento de rangos:
    // Dos rangos se solapan si: pickup_nueva < return_existente AND return_nueva > pickup_existente
    const overlappingBookings = await prisma.carRentalBookings.findMany({
      where: {
        status: { in: ['confirmed', 'pending', 'active'] },
        // IMPORTANTE: Excluimos 'completed', 'cancelled', 'request' ya que no bloquean disponibilidad
        OR: [
          // Buscar en reservas legacy (car_id directo)
          {
            car_id: { in: allCarIds },
            AND: [
              { pickup_date: { lt: returnDate } },  // inicio_existente < fin_nueva
              { return_date: { gt: pickupDate } }   // fin_existente > inicio_nueva
            ]
          },
          // Buscar en reservas nuevas (booking_vehicles)
          {
            vehicles: {
              some: {
                car_id: { in: allCarIds }
              }
            },
            AND: [
              { pickup_date: { lt: returnDate } },  // inicio_existente < fin_nueva
              { return_date: { gt: pickupDate } }   // fin_existente > inicio_nueva
            ]
          }
        ]
      },
      include: {
        car: {
          select: {
            registration_number: true,
            make: true,
            model: true
          }
        },
        vehicles: {
          include: {
            car: {
              select: {
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      }
    });

    if (overlappingBookings.length > 0) {
      const conflictingBooking = overlappingBookings[0];
      const conflictedVehicle = conflictingBooking.car || conflictingBooking.vehicles[0]?.car;
      return NextResponse.json(
        { 
          error: 'VEHÍCULO NO DISPONIBLE',
          message: `El vehículo ${conflictedVehicle?.registration_number} ya está reservado del ${new Date(conflictingBooking.pickup_date!).toLocaleDateString('es-ES')} al ${new Date(conflictingBooking.return_date!).toLocaleDateString('es-ES')}`,
          conflictingBooking: {
            id: conflictingBooking.id,
            customer_name: conflictingBooking.customer_name,
            pickup_date: conflictingBooking.pickup_date,
            return_date: conflictingBooking.return_date,
            vehicle: conflictedVehicle?.registration_number
          }
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Obtener información del cliente
    let customerId: number | null = null;
    let customerName = 'Cliente Nuevo';
    let customerEmail = '';
    let customerPhone = '';

    if (body.customer_id) {
      // Cliente existente - verificar que exista
      customerId = parseInt(body.customer_id);
      const customer = await prisma.carRentalCustomers.findUnique({
        where: { id: customerId }
      });
      if (customer) {
        customerName = `${customer.first_name} ${customer.last_name}`;
        customerEmail = customer.email || '';
        customerPhone = customer.phone || '';
      }
    } else if (body.customer_name && body.customer_phone) {
      // Cliente nuevo - crear en CarRentalCustomers con datos mínimos
      const nameParts = body.customer_name.split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Nuevo';
      
      // Verificar si ya existe cliente con mismo teléfono
      const existingCustomer = await prisma.carRentalCustomers.findFirst({
        where: { phone: body.customer_phone }
      });
      
      if (existingCustomer) {
        // Usar cliente existente
        customerId = existingCustomer.id;
        customerName = `${existingCustomer.first_name} ${existingCustomer.last_name}`;
        customerEmail = existingCustomer.email || body.customer_email || '';
        customerPhone = existingCustomer.phone;
      } else {
        // Crear nuevo cliente - determinar status según campos obligatorios
        const hasAllRequired = firstName && lastName && body.customer_email && body.customer_phone;
        const newCustomer = await prisma.carRentalCustomers.create({
          data: {
            first_name: firstName,
            last_name: lastName,
            email: body.customer_email || null,
            phone: body.customer_phone,
            status: hasAllRequired ? 'active' : 'incomplete',
            notes: hasAllRequired ? 'Cliente creado desde reserva rápida.' : 'Cliente creado desde reserva rápida. Faltan campos obligatorios (nombre, apellido, email o teléfono).'
          }
        });
        customerId = newCustomer.id;
        customerName = body.customer_name;
        customerEmail = body.customer_email || '';
        customerPhone = body.customer_phone;
      }
    } else {
      customerName = body.customer_name || 'Cliente Nuevo';
      customerEmail = body.customer_email || '';
      customerPhone = body.customer_phone || '';
    }

    // Usar precio total enviado desde el frontend (incluye descuentos)
    // Si no se envía, calcular desde vehículos individuales
    const totalPrice = body.total_price !== undefined ? parseFloat(body.total_price) : vehicleIds.reduce((sum, v) => sum + (v.price || 0), 0);

    // Generar número de expediente automáticamente usando la fecha de pickup
    const bookingNumber = await generateBookingNumber(pickupDate);

    // Crear la reserva con múltiples vehículos
    const booking = await prisma.carRentalBookings.create({
      data: {
        booking_number: bookingNumber,
        // Mantener car_id para compatibilidad (usar el primer vehículo)
        car_id: vehicleIds.length > 0 ? vehicleIds[0].id : null,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        pickup_date: pickupDate,
        return_date: returnDate,
        total_price: totalPrice,
        status: body.status || 'confirmed',
        // ✅ Ubicaciones de recogida y devolución
        pickup_location_id: body.pickup_location_id ? parseInt(body.pickup_location_id) : null,
        return_location_id: body.return_location_id ? parseInt(body.return_location_id) : null,
        // Crear relaciones con vehículos
        vehicles: {
          create: vehicleIds.map(vehicle => ({
            car_id: vehicle.id,
            vehicle_price: vehicle.price || 0
          }))
        },
        // Crear conductores adicionales si se proporcionan
        drivers: body.additional_drivers ? {
          create: body.additional_drivers.map((driver: any) => ({
            full_name: driver.full_name,
            dni_nie: driver.dni_nie,
            driver_license: driver.driver_license,
            license_expiry: driver.license_expiry ? new Date(driver.license_expiry) : null,
            phone: driver.phone,
            email: driver.email,
            date_of_birth: driver.date_of_birth ? new Date(driver.date_of_birth) : null,
            assigned_vehicle_id: driver.assigned_vehicle_id ? parseInt(driver.assigned_vehicle_id) : null,
            notes: driver.notes
          }))
        } : undefined,
        // Crear extras si se proporcionan
        extras: body.extras && Array.isArray(body.extras) && body.extras.length > 0 ? {
          create: body.extras.map((extra: any) => ({
            extra_id: parseInt(extra.extra_id),
            quantity: parseInt(extra.quantity) || 1,
            unit_price: parseFloat(extra.unit_price),
            total_price: parseFloat(extra.total_price)
          }))
        } : undefined,
        // Crear upgrades si se proporcionan
        upgrades: body.upgrades && Array.isArray(body.upgrades) && body.upgrades.length > 0 ? {
          create: body.upgrades.map((upgrade: any) => ({
            upgrade_id: parseInt(upgrade.upgrade_id),
            days: parseInt(upgrade.days),
            unit_price_per_day: parseFloat(upgrade.unit_price_per_day),
            total_price: parseFloat(upgrade.total_price)
          }))
        } : undefined,
        // Crear experiencias si se proporcionan
        experiences: body.experiences && Array.isArray(body.experiences) && body.experiences.length > 0 ? {
          create: body.experiences.map((experience: any) => ({
            experience_id: parseInt(experience.experience_id),
            quantity: parseInt(experience.quantity) || 1,
            unit_price: parseFloat(experience.unit_price),
            total_price: parseFloat(experience.total_price)
          }))
        } : undefined
      },
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
        drivers: true,
        extras: {
          include: {
            extra: true
          }
        },
        upgrades: {
          include: {
            upgrade: true
          }
        },
        experiences: {
          include: {
            experience: true
          }
        }
      }
    });

    // 📁 INTEGRACIÓN AUTOMÁTICA CON GOOGLE DRIVE
    // Crear carpeta y copiar documentos del cliente automáticamente
    // IMPORTANTE: Este bloque NO debe bloquear la creación de la reserva
    Promise.resolve().then(async () => {
      try {
        console.log(`📁 [Google Drive Auto-Sync] Creando carpeta para reserva #${booking.id}...`);
        
        const { createBookingFolder, copyCustomerDocumentsToBooking } = await import('@/lib/google-drive');
        
        // Crear carpeta en Google Drive
        const folderResult = await createBookingFolder(
          booking.booking_number || `RES-${booking.id}`,
          customerName,
          customerId || 0
        );

        if (folderResult.success && folderResult.folderId) {
          console.log(`✅ [Google Drive] Carpeta creada: ${folderResult.folderUrl}`);
          
          // Guardar folder ID y URL en la base de datos
          await prisma.carRentalBookings.update({
            where: { id: booking.id },
            data: {
              google_drive_folder_id: folderResult.folderId,
              google_drive_folder_url: folderResult.folderUrl
            }
          });

          // Si hay customer_id, copiar sus documentos
          if (customerId) {
            console.log(`📄 [Google Drive] Copiando documentos del cliente #${customerId}...`);
            const docsResult = await copyCustomerDocumentsToBooking(
              booking.booking_number || `RES-${booking.id}`,
              customerId
            );
            
            if (docsResult.success) {
              console.log(`✅ [Google Drive] ${docsResult.uploadedCount || 0} documentos copiados`);
            }
          }
        } else {
          console.warn(`⚠️ [Google Drive] No se pudo crear carpeta: ${folderResult.error}`);
        }
      } catch (driveError) {
        // No fallar la creación de la reserva si falla Google Drive
        console.error('❌ [Google Drive Auto-Sync] Error:', driveError);
        console.warn('⚠️ La reserva se creó correctamente pero no se pudo sincronizar con Google Drive');
      }
    }).catch(() => {
      // Silenciar cualquier error en el background
    });

    // 🔥 SINCRONIZACIÓN AUTOMÁTICA A GSCONTROL (como Servyauto)
    // Solo sincronizar si la reserva está confirmada o completada
    // IMPORTANTE: Este bloque NO debe bloquear la creación de la reserva
    if (booking.status === 'confirmed' || booking.status === 'completed') {
      Promise.resolve().then(async () => {
        try {
          console.log(`🔄 [GSControl Auto-Sync] Sincronizando reserva #${booking.id} automáticamente...`);
          
          // Obtener información del cliente para GSControl
          let customerDni = '';
          if (booking.customer) {
            customerDni = booking.customer.dni_nie || '';
          }

          // Obtener matrícula del vehículo principal
          const vehicleRegistration = booking.car?.registration_number || 'Sin vehículo';

          // Sincronizar a GSControl
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
            console.log(`✅ [GSControl Auto-Sync] Reserva #${booking.id} sincronizada exitosamente. ExternalId: ${gsExternalId}`);
            
            // 💾 GUARDAR el gscontrol_external_id en la base de datos
            await prisma.carRentalBookings.update({
              where: { id: booking.id },
              data: { gscontrol_external_id: gsExternalId }
            });
            
            console.log(`✅ [GSControl Auto-Sync] ExternalId guardado en DB: ${gsExternalId}`);
          } else {
            console.warn(`⚠️ [GSControl Auto-Sync] No se pudo sincronizar la reserva #${booking.id}. Esto no afecta la creación de la reserva.`);
          }
        } catch (syncError) {
          // No fallar la creación de la reserva si falla la sincronización
          console.error('❌ [GSControl Auto-Sync] Error en sincronización automática:', syncError);
          console.warn('⚠️ La reserva se creó correctamente pero no se pudo sincronizar con GSControl');
        }
      }).catch(() => {
        // Silenciar cualquier error en el background
      });
    }

    return NextResponse.json(booking);

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

