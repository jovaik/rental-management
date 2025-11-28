require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyOscarVehicles() {
  try {
    console.log('🔍 Analizando vehículos para Taller Oscar...\n');
    
    const tallerOscarLocationId = 3;
    
    // Los vehículos que aparecen en la imagen del usuario
    const vehiclesInImage = ['N 40 1230JTS', 'N 06 C2436BSR', 'N 39 1088JTS'];
    
    // Obtener información de estos vehículos
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        registration_number: {
          in: vehiclesInImage
        }
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        current_business_location_id: true
      }
    });
    
    console.log('🚗 Vehículos que aparecen en la imagen:');
    vehicles.forEach(v => {
      const isAssigned = v.current_business_location_id === tallerOscarLocationId;
      const status = isAssigned ? '✅' : '❌';
      console.log(`  ${status} ${v.registration_number} - Business Location ID: ${v.current_business_location_id || 'null'}`);
    });
    
    // Contar vehículos actualmente asignados a Taller Oscar
    const assignedCount = await prisma.carRentalCars.count({
      where: {
        current_business_location_id: tallerOscarLocationId
      }
    });
    
    console.log(`\n📊 Resumen:`);
    console.log(`  - Vehículos asignados a TALLER OSCAR (location_id=3): ${assignedCount}`);
    console.log(`  - Vehículos en imagen (deberían estar asignados): ${vehicles.length}`);
    
    // Determinar qué vehículos necesitan ser asignados
    const vehiclesToAssign = vehicles.filter(v => v.current_business_location_id !== tallerOscarLocationId);
    
    if (vehiclesToAssign.length > 0) {
      console.log(`\n⚠️  ${vehiclesToAssign.length} vehículos necesitan ser asignados al Taller Oscar:`);
      vehiclesToAssign.forEach(v => {
        console.log(`  - ID: ${v.id}, Matrícula: ${v.registration_number}`);
      });
      
      console.log(`\n🔄 Asignando vehículos al Taller Oscar...`);
      for (const vehicle of vehiclesToAssign) {
        await prisma.carRentalCars.update({
          where: { id: vehicle.id },
          data: {
            current_business_location_id: tallerOscarLocationId,
            location_since: new Date(),
            location_reason: 'Asignación al taller de Oscar - trabajos de mantenimiento'
          }
        });
        console.log(`  ✅ ${vehicle.registration_number} asignado`);
      }
      
      // Verificar el nuevo total
      const newCount = await prisma.carRentalCars.count({
        where: {
          current_business_location_id: tallerOscarLocationId
        }
      });
      
      console.log(`\n✅ Total de vehículos ahora en TALLER OSCAR: ${newCount}`);
    } else {
      console.log(`\n✅ Todos los vehículos de la imagen ya están correctamente asignados`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyOscarVehicles();
