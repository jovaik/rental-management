import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkStructure() {
  try {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 124 },
      include: {
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });
    
    console.log('📋 Estructura de bookingVehicles:\n');
    booking.vehicles.forEach((bv, idx) => {
      console.log(`Vehículo ${idx + 1}:`);
      console.log(`  - bookingVehicles.id: ${bv.id} ⚠️ (ID de la relación)`);
      console.log(`  - bookingVehicles.car_id: ${bv.car_id} ✅ (ID del vehículo real)`);
      console.log(`  - car.registration_number: ${bv.car.registration_number}`);
      console.log(`  - car.make: ${bv.car.make}`);
      console.log('');
    });
    
    console.log('🚨 BUG ENCONTRADO:');
    console.log('  El componente usa: bookingVehicles[0].id');
    console.log('  Debería usar: bookingVehicles[0].car_id\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();
