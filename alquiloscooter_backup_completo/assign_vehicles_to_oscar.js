require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignVehiclesToOscar() {
  try {
    console.log('🔧 Asignando vehículos al Taller Oscar...\n');
    
    // ID de la ubicación de negocio "TALLER OSCAR"
    const tallerOscarLocationId = 3;
    
    // Buscar vehículos que están físicamente en ubicaciones que podrían ser el taller de Oscar
    // Busquemos vehículos que NO tengan current_business_location_id asignado
    // y que estén en estado de mantenimiento o taller
    const vehiclesToAssign = await prisma.carRentalCars.findMany({
      where: {
        OR: [
          { current_location: { contains: 'TALLER' } },
          { status: 'F' } // Vehículos inactivos
        ],
        current_business_location_id: null
      },
      take: 3,
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        current_location: true,
        status: true
      }
    });
    
    console.log(`📋 Vehículos encontrados para asignar: ${vehiclesToAssign.length}`);
    
    if (vehiclesToAssign.length === 0) {
      console.log('❌ No se encontraron vehículos disponibles para asignar');
      
      // Intentemos con otros criterios - cualquier vehículo sin ubicación asignada
      const anyVehicles = await prisma.carRentalCars.findMany({
        where: {
          current_business_location_id: null,
          status: 'T' // Activos
        },
        take: 3,
        select: {
          id: true,
          registration_number: true,
          make: true,
          model: true,
          current_location: true,
          status: true
        }
      });
      
      console.log(`\n📋 Vehículos activos sin ubicación: ${anyVehicles.length}`);
      
      if (anyVehicles.length > 0) {
        console.log('Asignando estos vehículos al Taller Oscar:\n');
        for (const vehicle of anyVehicles) {
          console.log(`  - ${vehicle.registration_number} (${vehicle.make} ${vehicle.model})`);
          await prisma.carRentalCars.update({
            where: { id: vehicle.id },
            data: {
              current_business_location_id: tallerOscarLocationId,
              location_since: new Date(),
              location_reason: 'Asignación al taller de Oscar'
            }
          });
        }
        
        console.log(`\n✅ ${anyVehicles.length} vehículos asignados exitosamente al Taller Oscar`);
      }
    } else {
      console.log('Asignando estos vehículos al Taller Oscar:\n');
      for (const vehicle of vehiclesToAssign) {
        console.log(`  - ${vehicle.registration_number} (${vehicle.make} ${vehicle.model}) - ${vehicle.current_location}`);
        await prisma.carRentalCars.update({
          where: { id: vehicle.id },
          data: {
            current_business_location_id: tallerOscarLocationId,
            location_since: new Date(),
            location_reason: 'Asignación al taller de Oscar'
          }
        });
      }
      
      console.log(`\n✅ ${vehiclesToAssign.length} vehículos asignados exitosamente al Taller Oscar`);
    }
    
    // Verificar cuántos vehículos tiene ahora el taller
    const totalVehicles = await prisma.carRentalCars.count({
      where: {
        current_business_location_id: tallerOscarLocationId
      }
    });
    
    console.log(`\n🚗 Total de vehículos en Taller Oscar: ${totalVehicles}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignVehiclesToOscar();
