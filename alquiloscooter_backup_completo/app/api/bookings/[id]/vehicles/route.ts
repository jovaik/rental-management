
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST: Añadir vehículos adicionales a una reserva
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
    const { vehicles, applyExtrasUpgrades = true } = body;

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un vehículo' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe y cargar extras/upgrades existentes
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        vehicles: true,
        extras: {
          include: {
            extra: true
          }
        },
        upgrades: {
          include: {
            upgrade: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que los vehículos existen y están disponibles
    for (const vehicle of vehicles) {
      const car = await prisma.carRentalCars.findUnique({
        where: { id: vehicle.car_id }
      });

      if (!car) {
        return NextResponse.json(
          { error: `Vehículo con ID ${vehicle.car_id} no encontrado` },
          { status: 404 }
        );
      }

      if (car.status !== 'T') {
        return NextResponse.json(
          { error: `Vehículo ${car.registration_number} no está disponible` },
          { status: 400 }
        );
      }

      // Verificar que no está ya en la reserva
      const existingVehicle = booking.vehicles?.find(v => v.car_id === vehicle.car_id);
      if (existingVehicle) {
        return NextResponse.json(
          { error: `Vehículo ${car.registration_number} ya está en esta reserva` },
          { status: 400 }
        );
      }
    }

    // Añadir los vehículos a la reserva
    const addedVehicles = await Promise.all(
      vehicles.map(vehicle =>
        prisma.bookingVehicles.create({
          data: {
            booking_id: bookingId,
            car_id: vehicle.car_id,
            vehicle_price: vehicle.vehicle_price || 0
          },
          include: {
            car: true
          }
        })
      )
    );

    let additionalPrice = vehicles.reduce((sum, v) => sum + (v.vehicle_price || 0), 0);
    let extrasApplied = false;
    let upgradesApplied = false;

    // Si hay extras o upgrades en la reserva, aplicarlos a los nuevos vehículos
    if (applyExtrasUpgrades) {
      const numberOfNewVehicles = vehicles.length;

      // Aplicar extras existentes a los nuevos vehículos
      if (booking.extras && booking.extras.length > 0) {
        for (const existingExtra of booking.extras) {
          // Incrementar la cantidad del extra existente
          const newQuantity = (existingExtra.quantity || 1) + numberOfNewVehicles;
          const newTotalPrice = Number(existingExtra.unit_price) * newQuantity;

          await prisma.bookingExtras.update({
            where: { id: existingExtra.id },
            data: {
              quantity: newQuantity,
              total_price: newTotalPrice
            }
          });

          const extraAdditionalCost = Number(existingExtra.unit_price) * numberOfNewVehicles;
          additionalPrice += extraAdditionalCost;
          extrasApplied = true;
        }
      }

      // Aplicar upgrades existentes a los nuevos vehículos
      if (booking.upgrades && booking.upgrades.length > 0) {
        for (const existingUpgrade of booking.upgrades) {
          // Los upgrades se aplican por día, necesitamos calcular el precio adicional
          const daysForUpgrade = existingUpgrade.days || 1;
          const unitPricePerDay = Number(existingUpgrade.unit_price_per_day);
          const additionalUpgradeCost = unitPricePerDay * daysForUpgrade * numberOfNewVehicles;

          // Actualizar el upgrade existente para reflejar el costo adicional
          const newTotalPrice = Number(existingUpgrade.total_price) + additionalUpgradeCost;
          
          await prisma.bookingUpgrades.update({
            where: { id: existingUpgrade.id },
            data: {
              total_price: newTotalPrice
            }
          });

          additionalPrice += additionalUpgradeCost;
          upgradesApplied = true;
        }
      }
    }

    // Actualizar el precio total de la reserva
    await prisma.carRentalBookings.update({
      where: { id: bookingId },
      data: {
        total_price: {
          increment: additionalPrice
        }
      }
    });

    return NextResponse.json({
      message: 'Vehículos añadidos exitosamente',
      vehicles: addedVehicles,
      additionalPrice,
      extrasApplied,
      upgradesApplied
    });

  } catch (error) {
    console.error('Error añadiendo vehículos a la reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
