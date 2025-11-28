
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST: Añadir conductores adicionales a una reserva
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const bookingId = parseInt((await params).id);
    const body = await request.json();
    const { driver_ids } = body;

    if (!driver_ids || !Array.isArray(driver_ids) || driver_ids.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un conductor' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        drivers: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Añadir los conductores a la reserva
    // BookingDrivers almacena una COPIA de los datos del conductor
    // para que no dependan de cambios posteriores en el cliente
    const addedDrivers = await Promise.all(
      driver_ids.map(async (driverId: number) => {
        const customer = await prisma.carRentalCustomers.findUnique({
          where: { id: driverId }
        });

        if (!customer) {
          throw new Error(`Cliente/Conductor con ID ${driverId} no encontrado`);
        }

        if (customer.status !== 'active') {
          throw new Error(`Cliente ${customer.first_name} ${customer.last_name} no está activo`);
        }

        // Verificar que no está ya en la reserva (por DNI/NIE)
        const existingDriver = booking.drivers?.find(d => d.dni_nie === customer.dni_nie);
        if (existingDriver) {
          throw new Error(`${customer.first_name} ${customer.last_name} ya es conductor en esta reserva`);
        }

        // Verificar que no es el cliente titular (comparar por DNI/NIE si existe)
        if (booking.customer_id === driverId) {
          throw new Error(`${customer.first_name} ${customer.last_name} ya es el conductor principal (cliente titular)`);
        }

        // Crear el registro de conductor con copia de datos del cliente
        return prisma.bookingDrivers.create({
          data: {
            booking_id: bookingId,
            full_name: `${customer.first_name} ${customer.last_name}`.trim(),
            dni_nie: customer.dni_nie || '',
            driver_license: customer.driver_license || '',
            license_expiry: customer.license_expiry,
            phone: customer.phone,
            email: customer.email,
            date_of_birth: customer.date_of_birth,
            driver_license_front: customer.driver_license_front,
            driver_license_back: customer.driver_license_back,
            id_document_front: customer.id_document_front,
            id_document_back: customer.id_document_back
          }
        });
      })
    );

    return NextResponse.json({
      message: 'Conductores añadidos exitosamente',
      drivers: addedDrivers
    });

  } catch (error: any) {
    console.error('Error añadiendo conductores a la reserva:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
