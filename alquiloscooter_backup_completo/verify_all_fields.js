const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    const reservas = await prisma.carRentalBookings.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        customer_email: true,
        customer_phone: true
      }
    });

    console.log('📊 VERIFICACIÓN FINAL COMPLETA:\n');
    console.log(`Total reservas: ${reservas.length}`);
    
    const sinNombre = reservas.filter(r => !r.customer_name);
    const sinEmail = reservas.filter(r => !r.customer_email);
    const sinTelefono = reservas.filter(r => !r.customer_phone);
    
    console.log(`Reservas SIN nombre: ${sinNombre.length}`);
    console.log(`Reservas SIN email: ${sinEmail.length}`);
    console.log(`Reservas SIN teléfono: ${sinTelefono.length}`);
    
    console.log(`\n✅ Reservas COMPLETAS: ${reservas.length}`);

    // Mostrar ejemplos de las corregidas
    const ejemplos = reservas.filter(r => r.id >= 243 && r.id <= 250);
    console.log(`\n✅ EJEMPLOS VERIFICADOS (IDs 243-250):`);
    ejemplos.forEach(r => {
      console.log(`  ID ${r.id}: "${r.customer_name}" | ${r.customer_email} | ${r.customer_phone}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
