import { PrismaClient } from '@prisma/client';
import dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando reservas sin customer_id...\n');
  
  const bookingsWithoutCustomer = await prisma.carRentalBookings.findMany({
    where: {
      customer_id: null,
      status: { in: ['confirmed', 'pending'] }
    },
    select: {
      id: true,
      booking_number: true,
      customer_name: true,
      customer_email: true,
      customer_phone: true,
      status: true,
      total_price: true
    },
    orderBy: { id: 'desc' },
    take: 10
  });

  if (bookingsWithoutCustomer.length === 0) {
    console.log('✅ Todas las reservas activas tienen customer_id');
  } else {
    console.log(`❌ Encontradas ${bookingsWithoutCustomer.length} reservas SIN customer_id:\n`);
    bookingsWithoutCustomer.forEach(b => {
      console.log(`  - Reserva #${b.id} (${b.booking_number})`);
      console.log(`    Cliente: ${b.customer_name}`);
      console.log(`    Email: ${b.customer_email || 'No tiene'}`);
      console.log(`    Teléfono: ${b.customer_phone || 'No tiene'}`);
      console.log(`    Estado: ${b.status}`);
      console.log(`    Total: €${b.total_price}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
