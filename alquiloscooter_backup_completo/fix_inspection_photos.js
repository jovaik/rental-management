
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInspectionPhotos() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 CORRIGIENDO RUTAS DE FOTOS DE INSPECCIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Inspección ID 36 (vehículo 95)
  const insp36 = await prisma.vehicleInspections.update({
    where: { id: 36 },
    data: {
      front_photo: '5155/expedientes/202511070001/inspecciones/front-1762595891628-119447.jpg',
      left_photo: '5155/expedientes/202511070001/inspecciones/left-1762595891718-119448.jpg',
      rear_photo: '5155/expedientes/202511070001/inspecciones/rear-1762595891852-119449.jpg',
      right_photo: '5155/expedientes/202511070001/inspecciones/right-1762595891999-119450.jpg',
      odometer_photo: '5155/expedientes/202511070001/inspecciones/odometer-1762595892134-119446.jpg'
    }
  });
  console.log('✅ Inspección #36 (vehículo 95) actualizada');
  
  // Inspección ID 37 (vehículo 97)
  const insp37 = await prisma.vehicleInspections.update({
    where: { id: 37 },
    data: {
      front_photo: '5155/expedientes/202511070001/inspecciones/front-1762595893693-119677.jpg',
      left_photo: '5155/expedientes/202511070001/inspecciones/left-1762595893728-119675.jpg',
      rear_photo: '5155/expedientes/202511070001/inspecciones/rear-1762595893815-119681.jpg',
      right_photo: '5155/expedientes/202511070001/inspecciones/right-1762595893847-119679.jpg',
      odometer_photo: '5155/expedientes/202511070001/inspecciones/odometer-1762595893918-119684.jpg'
    }
  });
  console.log('✅ Inspección #37 (vehículo 97) actualizada');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CORRECCIÓN COMPLETADA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await prisma.$disconnect();
}

fixInspectionPhotos();
