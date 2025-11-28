// Script para verificar el estado de los vehículos y sus reservas
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVehicleStatus() {
  try {
    const now = new Date();
    console.log('Fecha actual:', now.toISOString());
    console.log('\n=== Consultando vehículos ===\n');
    
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        registration_number: { contains: '07' }  // Buscar el vehículo 07
      },
      include: {
        bookingVehicles: {
          include: {
            booking: {
              select: {
                id: true,
                customer_name: true,
                pickup_date: true,
                return_date: true,
                status: true
              }
            }
          }
        }
      }
    });

    for (const vehicle of vehicles) {
      console.log(`\n🚗 Vehículo: ${vehicle.registration_number}`);
      console.log(`   Estado en DB: ${vehicle.status}`);
      console.log(`   Reservas asociadas: ${vehicle.bookingVehicles.length}`);
      
      if (vehicle.bookingVehicles.length > 0) {
        console.log('\n   Todas las reservas:');
        for (const bv of vehicle.bookingVehicles) {
          const booking = bv.booking;
          console.log(`   - ID: ${booking.id}`);
          console.log(`     Cliente: ${booking.customer_name}`);
          console.log(`     Estado: ${booking.status}`);
          console.log(`     Recogida: ${booking.pickup_date.toISOString()}`);
          console.log(`     Devolución: ${booking.return_date.toISOString()}`);
          
          const isActive = 
            ['confirmed', 'pending'].includes(booking.status) &&
            booking.pickup_date <= now &&
            booking.return_date >= now;
          console.log(`     ¿Activa ahora? ${isActive ? 'SÍ' : 'NO'}`);
        }
      }
    }
    
    // Verificar también todas las reservas activas
    console.log('\n\n=== Reservas activas en el sistema ===\n');
    const activeBookings = await prisma.carRentalBooking.findMany({
      where: {
        status: { in: ['confirmed', 'pending'] },
        pickup_date: { lte: now },
        return_date: { gte: now }
      },
      include: {
        bookingVehicles: {
          include: {
            vehicle: {
              select: {
                id: true,
                registration_number: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Total de reservas activas: ${activeBookings.length}`);
    for (const booking of activeBookings) {
      console.log(`\n📋 Reserva #${booking.id}`);
      console.log(`   Cliente: ${booking.customer_name}`);
      console.log(`   Estado: ${booking.status}`);
      console.log(`   Recogida: ${booking.pickup_date.toISOString()}`);
      console.log(`   Devolución: ${booking.return_date.toISOString()}`);
      console.log(`   Vehículos en esta reserva:`);
      for (const bv of booking.bookingVehicles) {
        console.log(`   - ${bv.vehicle.registration_number} (ID: ${bv.vehicle.id})`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVehicleStatus();
