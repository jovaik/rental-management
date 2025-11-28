require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarVane() {
  try {
    console.log('🔍 Buscando reservas de Vane Cua...\n');
    
    const reservas = await prisma.carRentalBookings.findMany({
      where: {
        OR: [
          { customer_name: { contains: 'Vane', mode: 'insensitive' } },
          { customer_name: { contains: 'Cua', mode: 'insensitive' } },
          { customer: { 
            OR: [
              { first_name: { contains: 'Vane', mode: 'insensitive' } },
              { last_name: { contains: 'Cua', mode: 'insensitive' } }
            ]
          }}
        ]
      },
      include: {
        customer: true
      },
      orderBy: { id: 'desc' },
      take: 5
    });

    console.log(`Encontradas ${reservas.length} reservas:\n`);
    
    reservas.forEach(r => {
      const nombre = r.customer 
        ? `${r.customer.first_name} ${r.customer.last_name}`
        : r.customer_name;
      
      console.log(`ID: ${r.id}`);
      console.log(`Cliente: ${nombre}`);
      console.log(`Número: ${r.booking_number}`);
      console.log(`Total: €${r.total_price}`);
      console.log(`Estado: ${r.status}`);
      console.log(`GSControl External ID: ${r.gscontrol_external_id || 'NO SINCRONIZADA'}`);
      console.log(`Fechas: ${r.pickup_date?.toISOString().split('T')[0]} → ${r.return_date?.toISOString().split('T')[0]}`);
      console.log('─'.repeat(60));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarVane();
