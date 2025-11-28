import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function findClient() {
  try {
    console.log('🔍 Buscando cliente "Darel"...\n');
    
    const customers = await prisma.carRentalCustomers.findMany({
      where: {
        OR: [
          { first_name: { contains: 'Darel', mode: 'insensitive' } },
          { last_name: { contains: 'Darel', mode: 'insensitive' } },
          { first_name: { contains: 'Rivero', mode: 'insensitive' } },
          { last_name: { contains: 'Rivero', mode: 'insensitive' } }
        ]
      },
      include: {
        bookings: {
          include: {
            vehicles: {
              include: {
                car: true
              }
            }
          },
          orderBy: { id: 'desc' },
          take: 1
        }
      }
    });
    
    console.log(`Clientes encontrados: ${customers.length}\n`);
    
    customers.forEach(customer => {
      console.log(`Cliente ID: ${customer.id}`);
      console.log(`Nombre: ${customer.first_name} ${customer.last_name}`);
      console.log(`Email: ${customer.email || 'N/A'}`);
      console.log(`DNI: ${customer.dni || 'N/A'}`);
      console.log(`Reservas: ${customer.bookings?.length || 0}`);
      if (customer.bookings?.length > 0) {
        const booking = customer.bookings[0];
        console.log(`  - Última reserva: #${booking.id} - ${booking.booking_number}`);
        console.log(`    Vehículos: ${booking.vehicles?.length || 0}`);
        booking.vehicles?.forEach(v => {
          console.log(`      * ${v.car.registration_number}`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findClient();
