import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando clientes sin documentos completos...\n');
  
  // Buscar reservas activas
  const activeBookings = await prisma.carRentalBookings.findMany({
    where: {
      status: { in: ['confirmed', 'pending'] }
    },
    include: {
      customer: true
    },
    orderBy: { id: 'desc' },
    take: 20
  });

  console.log(`📊 Total reservas activas: ${activeBookings.length}\n`);

  const incompleteCustomers = [];

  for (const booking of activeBookings) {
    if (!booking.customer) {
      console.log(`❌ Reserva #${booking.id} (${booking.booking_number}) - NO TIENE CUSTOMER`);
      continue;
    }

    const customer = booking.customer;
    const missingDocs = [];

    if (!customer.driver_license_front) missingDocs.push('Carnet frente');
    if (!customer.driver_license_back) missingDocs.push('Carnet trasero');
    if (!customer.id_document_front) missingDocs.push('DNI/NIE frente');
    if (!customer.id_document_back) missingDocs.push('DNI/NIE trasero');

    if (missingDocs.length > 0) {
      incompleteCustomers.push({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_email: customer.email,
        missing: missingDocs
      });
    }
  }

  if (incompleteCustomers.length === 0) {
    console.log('✅ TODOS los clientes de reservas activas tienen documentos completos');
  } else {
    console.log(`❌ ${incompleteCustomers.length} reservas con clientes SIN documentos completos:\n`);
    incompleteCustomers.forEach(item => {
      console.log(`  📋 Reserva #${item.booking_id} (${item.booking_number})`);
      console.log(`     Cliente: ${item.customer_name}`);
      console.log(`     Email: ${item.customer_email || 'Sin email'}`);
      console.log(`     Faltan: ${item.missing.join(', ')}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
