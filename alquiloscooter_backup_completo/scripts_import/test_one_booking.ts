import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    // Buscar DREW GARRET
    const cliente = await prisma.carRentalCustomers.findFirst({
      where: {
        AND: [
          { first_name: { contains: 'DREW', mode: 'insensitive' } },
          { last_name: { contains: 'GARRET', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log('Cliente encontrado:', cliente);
    
    if (cliente) {
      console.log('\nIntentando crear reserva...');
      
      const booking = await prisma.carRentalBookings.create({
        data: {
          customer: { connect: { id: cliente.id } },
          customer_name: `${cliente.first_name} ${cliente.last_name}`,
          customer_email: cliente.email || null,
          customer_phone: cliente.phone || null,
          pickup_date: new Date('2025-01-02T10:58:00Z'),
          return_date: new Date('2025-01-05T10:58:00Z'),
          total_price: 180,
          status: 'completed',
          payment_status: 'paid'
        }
      });
      
      console.log('✅ Reserva creada:', booking.booking_number);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR COMPLETO:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
