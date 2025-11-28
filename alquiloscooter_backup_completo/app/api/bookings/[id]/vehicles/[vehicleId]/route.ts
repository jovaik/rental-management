
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT: Cambiar un vehículo específico de una reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: bookingIdParam, vehicleId: vehicleIdParam } = await params;
    const bookingId = parseInt(bookingIdParam);
    const vehicleId = parseInt(vehicleIdParam);
    
    const body = await request.json();
    const { car_id, change_reason } = body;

    if (!car_id) {
      return NextResponse.json(
        { error: 'Debe proporcionar el ID del nuevo vehículo (car_id)' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        vehicles: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el vehículo en booking_vehicles existe
    const bookingVehicle = await prisma.bookingVehicles.findUnique({
      where: { id: vehicleId },
      include: {
        car: true
      }
    });

    if (!bookingVehicle || bookingVehicle.booking_id !== bookingId) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado en esta reserva' },
        { status: 404 }
      );
    }

    // Verificar que el nuevo vehículo existe y está disponible
    const newCar = await prisma.carRentalCars.findUnique({
      where: { id: car_id }
    });

    if (!newCar) {
      return NextResponse.json(
        { error: 'Nuevo vehículo no encontrado' },
        { status: 404 }
      );
    }

    if (newCar.status !== 'T') {
      return NextResponse.json(
        { error: `Vehículo ${newCar.registration_number} no está disponible` },
        { status: 400 }
      );
    }

    // Verificar que el nuevo vehículo no esté ya en la reserva
    const existingVehicle = booking.vehicles?.find(v => v.car_id === car_id);
    if (existingVehicle) {
      return NextResponse.json(
        { error: `Vehículo ${newCar.registration_number} ya está en esta reserva` },
        { status: 400 }
      );
    }

    // Actualizar el vehículo en BookingVehicles
    const updatedVehicle = await prisma.bookingVehicles.update({
      where: { id: vehicleId },
      data: {
        car_id: car_id,
        notes: change_reason 
          ? `[CAMBIO DE VEHÍCULO]\nVehículo original: ${bookingVehicle.car.registration_number}\nMotivo: ${change_reason}\n${bookingVehicle.notes || ''}`
          : bookingVehicle.notes
      },
      include: {
        car: true
      }
    });

    return NextResponse.json({
      message: 'Vehículo cambiado exitosamente',
      vehicle: updatedVehicle
    });

  } catch (error) {
    console.error('Error cambiando vehículo en la reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
