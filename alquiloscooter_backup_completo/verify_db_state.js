const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n📊 VERIFICACIÓN COMPLETA DE BASE DE DATOS\n');
    console.log('='.repeat(70));

    // 1. Total de reservas
    const totalReservas = await prisma.carRentalBookings.count();
    console.log(`\n✅ Total reservas: ${totalReservas}`);

    // 2. Reservas por mes
    const reservasPorMes = await prisma.carRentalBookings.groupBy({
      by: ['pickup_date'],
      _count: true,
      orderBy: {
        pickup_date: 'asc'
      }
    });

    console.log('\n📅 RESERVAS POR MES:');
    const mesesMap = new Map();
    
    reservasPorMes.forEach(r => {
      const fecha = new Date(r.pickup_date);
      const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      mesesMap.set(mesAno, (mesesMap.get(mesAno) || 0) + r._count);
    });

    [...mesesMap.entries()].sort().forEach(([mes, count]) => {
      console.log(`  ${mes}: ${count} reservas`);
    });

    // 3. Verificar duplicados potenciales (mismo cliente, mismas fechas, mismo vehículo)
    const todasReservas = await prisma.carRentalBookings.findMany({
      include: {
        vehicles: {
          include: {
            car: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log('\n🔍 ANÁLISIS DE DUPLICADOS POTENCIALES:');
    const grupos = new Map();
    
    todasReservas.forEach(r => {
      const carId = r.vehicles?.[0]?.car_id || 'sin-vehiculo';
      const key = `${r.customer_name}-${r.pickup_date}-${r.return_date}-${carId}`;
      
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key).push(r);
    });

    const duplicados = [...grupos.entries()].filter(([_, reservas]) => reservas.length > 1);
    
    if (duplicados.length > 0) {
      console.log(`  ⚠️  Encontrados ${duplicados.length} grupos de posibles duplicados:\n`);
      
      duplicados.forEach(([key, reservas]) => {
        console.log(`  📍 Grupo (${reservas.length} reservas):`);
        reservas.forEach(r => {
          const vehicle = r.vehicles?.[0]?.car;
          const vehicleInfo = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Sin vehículo';
          console.log(`    ID ${r.id}: ${r.booking_number} | ${r.customer_name} | ${vehicleInfo}`);
        });
        console.log('');
      });
    } else {
      console.log('  ✅ No se encontraron duplicados potenciales');
    }

    // 4. Verificar campos críticos
    console.log('\n🔧 VERIFICACIÓN DE CAMPOS CRÍTICOS:');
    const sinNombre = await prisma.carRentalBookings.count({ where: { customer_name: null } });
    const sinEmail = await prisma.carRentalBookings.count({ where: { customer_email: null } });
    const sinTelefono = await prisma.carRentalBookings.count({ where: { customer_phone: null } });
    const sinCarId = await prisma.carRentalBookings.count({ where: { car_id: null } });
    const sinCustomerId = await prisma.carRentalBookings.count({ where: { customer_id: null } });

    console.log(`  customer_name NULL: ${sinNombre}`);
    console.log(`  customer_email NULL: ${sinEmail}`);
    console.log(`  customer_phone NULL: ${sinTelefono}`);
    console.log(`  car_id NULL: ${sinCarId}`);
    console.log(`  customer_id NULL: ${sinCustomerId}`);

    // 5. Reservas importadas vs manuales
    console.log('\n📥 ORIGEN DE RESERVAS:');
    const importadas = await prisma.carRentalBookings.count({
      where: { customer_email: { contains: '@imported.com' } }
    });
    const manuales = totalReservas - importadas;
    console.log(`  Importadas (Rodeeo): ${importadas}`);
    console.log(`  Manuales: ${manuales}`);

    // 6. Reservas sin vehículo asignado
    const sinVehiculo = await prisma.carRentalBookings.findMany({
      where: {
        vehicles: {
          none: {}
        }
      },
      select: {
        id: true,
        booking_number: true,
        customer_name: true,
        pickup_date: true
      }
    });

    console.log(`\n🚗 RESERVAS SIN VEHÍCULO: ${sinVehiculo.length}`);
    if (sinVehiculo.length > 0) {
      console.log('  IDs:', sinVehiculo.map(r => r.id).join(', '));
    }

    // 7. Totales financieros
    const totales = await prisma.carRentalBookings.aggregate({
      _sum: {
        total_price: true
      }
    });

    console.log(`\n💰 TOTAL FINANCIERO: €${totales._sum.total_price?.toFixed(2) || '0.00'}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ VERIFICACIÓN COMPLETADA\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
