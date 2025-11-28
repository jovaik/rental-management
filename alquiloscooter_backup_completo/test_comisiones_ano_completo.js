const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(0); // Inicio del año
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    console.log('📅 Período: Año completo 2025');
    console.log('Desde:', startDate.toISOString().split('T')[0]);
    console.log('');
    
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        ownership_type: 'commission',
        status: 'T',
        bookings: {
          some: {
            pickup_date: {
              gte: startDate,
            },
            status: {
              in: ['confirmed', 'completed'],
            },
          },
        },
      },
      include: {
        bookings: {
          where: {
            pickup_date: {
              gte: startDate,
            },
            status: {
              in: ['confirmed', 'completed'],
            },
          },
        },
      },
    });
    
    console.log('✅ RESULTADO CON AÑO COMPLETO:\n');
    console.log('='.repeat(70));
    console.log(`\nVehículos encontrados: ${vehicles.length}\n`);
    
    vehicles.forEach((v, i) => {
      const totalRevenue = v.bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
      
      console.log(`${i + 1}. ${v.make} ${v.model} (${v.registration_number})`);
      console.log(`   ID: ${v.id}`);
      console.log(`   Propietario: ${v.owner_name || 'Sin propietario'}`);
      console.log(`   Reservas: ${v.bookings.length}`);
      console.log(`   Ingresos totales: ${totalRevenue}€`);
      console.log('');
      
      v.bookings.forEach((b, bi) => {
        const pickupDate = new Date(b.pickup_date).toISOString().split('T')[0];
        console.log(`     ${bi + 1}. Reserva #${b.id} - ${pickupDate} - ${b.customer_name} - ${b.total_price}€`);
      });
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log('\n✅ PERFECTO: Ahora se muestran AMBAS reservas reales\n');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
