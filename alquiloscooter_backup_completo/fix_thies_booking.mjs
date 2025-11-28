import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fix() {
  // Buscar la reserva de THIES
  const thiesBooking = await prisma.carRentalBookings.findFirst({
    where: {
      customer_name: {
        contains: 'THIES',
        mode: 'insensitive'
      },
      pickup_date: {
        gte: new Date('2025-11-01'),
        lt: new Date('2025-11-02')
      }
    },
    include: {
      contract: true
    }
  });
  
  if (!thiesBooking) {
    console.log('❌ No se encontró la reserva de THIES');
    return;
  }
  
  console.log('📋 Reserva actual:');
  console.log(`  ID: ${thiesBooking.id}`);
  console.log(`  Booking Number: ${thiesBooking.booking_number}`);
  console.log(`  Contract Number: ${thiesBooking.contract?.contract_number || 'No contract'}`);
  console.log(`  Pickup Date: ${thiesBooking.pickup_date?.toISOString().split('T')[0]}`);
  
  // Verificar si ya existe 202511010001
  const existing = await prisma.carRentalBookings.findFirst({
    where: {
      booking_number: '202511010001'
    }
  });
  
  if (existing && existing.id !== thiesBooking.id) {
    console.log('⚠️  El número 202511010001 ya está en uso por otra reserva');
    console.log(`    Reserva existente: ${existing.customer_name}`);
    return;
  }
  
  // Actualizar booking number
  console.log('\n🔄 Actualizando booking_number a 202511010001...');
  await prisma.carRentalBookings.update({
    where: { id: thiesBooking.id },
    data: {
      booking_number: '202511010001'
    }
  });
  
  // Actualizar contract number si existe
  if (thiesBooking.contract) {
    console.log('🔄 Actualizando contract_number a 202511010001...');
    await prisma.carRentalContracts.update({
      where: { id: thiesBooking.contract.id },
      data: {
        contract_number: '202511010001'
      }
    });
  }
  
  console.log('✅ Actualización completada');
  
  // Verificar
  const updated = await prisma.carRentalBookings.findFirst({
    where: { id: thiesBooking.id },
    include: { contract: true }
  });
  
  console.log('\n✅ Reserva actualizada:');
  console.log(`  Booking Number: ${updated?.booking_number}`);
  console.log(`  Contract Number: ${updated?.contract?.contract_number || 'No contract'}`);
  
  await prisma.$disconnect();
}

fix().catch(console.error);
