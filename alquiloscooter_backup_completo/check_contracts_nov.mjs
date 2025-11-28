import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function check() {
  const contracts = await prisma.carRentalContracts.findMany({
    where: {
      contract_number: {
        contains: '202511'
      }
    },
    include: {
      booking: {
        select: {
          booking_number: true,
          pickup_date: true,
          customer_name: true
        }
      }
    },
    orderBy: {
      contract_number: 'desc'
    },
    take: 10
  });
  
  console.log('📋 Contratos de noviembre 2025:');
  contracts.forEach(c => {
    console.log(`  ${c.contract_number} - ${c.booking.customer_name} - Pickup: ${c.booking.pickup_date?.toISOString().split('T')[0]} - Signed: ${c.signed_at ? '✅' : '❌'}`);
  });
  
  // Verificar la reserva de THIES MONSHOUWER específicamente
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
  
  if (thiesBooking) {
    console.log('\n🔍 Reserva de THIES MONSHOUWER:');
    console.log(`  Booking: ${thiesBooking.booking_number}`);
    console.log(`  Pickup: ${thiesBooking.pickup_date?.toISOString().split('T')[0]}`);
    console.log(`  Contract: ${thiesBooking.contract?.contract_number || 'No contract'}`);
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
