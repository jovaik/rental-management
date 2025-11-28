require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarComisiones() {
  try {
    console.log('\n🔍 DIAGNÓSTICO: Sistema de Comisiones\n');
    console.log('='.repeat(70));
    
    // 1. Vehículos marcados como "commission"
    const vehiculosComision = await prisma.carRentalCars.findMany({
      where: {
        ownership_type: 'commission'
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        commission_percentage: true,
        monthly_fixed_costs: true,
        owner_name: true,
        owner_user_id: true,
        status: true
      }
    });
    
    console.log('\n📊 VEHÍCULOS MARCADOS COMO "COMISIÓN":');
    console.log(`Total: ${vehiculosComision.length}\n`);
    
    if (vehiculosComision.length === 0) {
      console.log('❌ No hay vehículos marcados como "commission"');
      console.log('   Por eso no aparecen datos en el menú de comisiones.\n');
    } else {
      vehiculosComision.forEach((v, i) => {
        console.log(`${i + 1}. ${v.make} ${v.model} (${v.registration_number})`);
        console.log(`   - ID: ${v.id}`);
        console.log(`   - Estado: ${v.status}`);
        console.log(`   - Propietario: ${v.owner_name || 'Sin propietario'} (ID: ${v.owner_user_id || 'N/A'})`);
        console.log(`   - Comisión: ${v.commission_percentage || 0}%`);
        console.log(`   - Costos Fijos: ${v.monthly_fixed_costs || 0}€/mes`);
        console.log('');
      });
    }
    
    // 2. Reservas de estos vehículos
    if (vehiculosComision.length > 0) {
      console.log('\n📅 RESERVAS DE VEHÍCULOS EN COMISIÓN:\n');
      
      const vehicleIds = vehiculosComision.map(v => v.id);
      const reservas = await prisma.carRentalBooking.findMany({
        where: {
          vehicle_id: { in: vehicleIds },
          status: { in: ['confirmed', 'completed'] }
        },
        select: {
          id: true,
          vehicle_id: true,
          pickup_date: true,
          return_date: true,
          total_price: true,
          status: true,
          vehicle: {
            select: {
              registration_number: true,
              make: true,
              model: true
            }
          }
        },
        orderBy: {
          pickup_date: 'desc'
        },
        take: 20
      });
      
      console.log(`Total de reservas confirmadas/completadas: ${reservas.length}\n`);
      
      if (reservas.length === 0) {
        console.log('❌ No hay reservas para estos vehículos');
        console.log('   Por eso los importes aparecen en 0€\n');
      } else {
        reservas.forEach((r, i) => {
          console.log(`${i + 1}. Reserva #${r.id}`);
          console.log(`   - Vehículo: ${r.vehicle?.make} ${r.vehicle?.model} (${r.vehicle?.registration_number})`);
          console.log(`   - Fechas: ${r.pickup_date?.toISOString().split('T')[0]} → ${r.return_date?.toISOString().split('T')[0]}`);
          console.log(`   - Precio: ${r.total_price || 0}€`);
          console.log(`   - Estado: ${r.status}`);
          console.log('');
        });
      }
    }
    
    // 3. Todos los tipos de ownership en el sistema
    console.log('\n📋 DISTRIBUCIÓN DE VEHÍCULOS POR TIPO:\n');
    const distribucion = await prisma.carRentalCars.groupBy({
      by: ['ownership_type'],
      _count: true
    });
    
    distribucion.forEach(d => {
      console.log(`   - ${d.ownership_type || 'Sin tipo'}: ${d._count} vehículo(s)`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n💡 CONCLUSIÓN:\n');
    
    if (vehiculosComision.length === 0) {
      console.log('❌ NO hay vehículos configurados como "commission"');
      console.log('   Los importes que ves podrían ser:');
      console.log('   - Datos de prueba/semilla del sistema');
      console.log('   - Cachés antiguos que no se han actualizado');
      console.log('\n✅ SOLUCIÓN: Necesitas marcar vehículos como "commission" y');
      console.log('   configurar su % de comisión y costos fijos en la página de Vehículos.');
    } else {
      console.log('✅ Hay vehículos en comisión configurados');
      console.log('   Los importes mostrados son REALES basados en las reservas de estos vehículos.');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarComisiones();
