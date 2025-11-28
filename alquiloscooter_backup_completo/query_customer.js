require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Buscando cliente RICCO WHOFFMANN...\n');
    
    const customer = await prisma.car_rental_customers.findFirst({
      where: {
        OR: [
          { full_name: { contains: 'RICCO', mode: 'insensitive' } },
          { full_name: { contains: 'WHOFFMANN', mode: 'insensitive' } }
        ]
      },
      include: {
        bookings: {
          orderBy: { id: 'desc' },
          take: 5
        }
      }
    });

    if (!customer) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('📋 DATOS DEL CLIENTE:');
    console.log('=======================');
    console.log('ID:', customer.id);
    console.log('Nombre:', customer.full_name);
    console.log('Email:', customer.email || '❌ FALTA');
    console.log('Teléfono:', customer.phone || '❌ FALTA');
    console.log('Dirección:', customer.address || '❌ FALTA');
    console.log('Ciudad:', customer.city || '❌ FALTA');
    console.log('País:', customer.country || '❌ FALTA');
    console.log('Código Postal:', customer.zip_code || '❌ FALTA');
    console.log('Tipo Documento:', customer.id_document_type || '❌ FALTA');
    console.log('Número Documento:', customer.id_document_number || '❌ FALTA');
    console.log('Estado:', customer.status || '❌ FALTA');
    console.log('Fecha Nacimiento:', customer.birth_date || '❌ FALTA');
    console.log('\n📅 RESERVAS:');
    console.log('=======================');
    if (customer.bookings && customer.bookings.length > 0) {
      customer.bookings.forEach(b => {
        console.log(`  - Reserva #${b.id}: ${b.status} (Pickup: ${b.pickup_date?.toISOString().split('T')[0]})`);
      });
    } else {
      console.log('  - Sin reservas');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
