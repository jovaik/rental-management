
import { prisma } from './lib/db';

async function checkInspections() {
  // Buscar la reserva 202510260001
  const booking = await prisma.carRentalBookings.findFirst({
    where: { booking_number: '202510260001' },
    include: {
      vehicles: {
        include: {
          car: true
        }
      }
    }
  });

  if (!booking) {
    console.log('❌ No se encontró la reserva 202510260001');
    return;
  }

  console.log('✅ Reserva encontrada:', booking.booking_number);
  console.log('📋 Vehículos:', booking.vehicles.length);
  booking.vehicles.forEach((v) => {
    console.log('  - Vehículo ID:', v.car_id, '|', v.car?.registration_number, v.car?.make, v.car?.model);
  });

  // Buscar inspecciones
  const inspections = await prisma.vehicleInspections.findMany({
    where: { booking_id: booking.id },
    orderBy: { inspection_date: 'asc' }
  });

  console.log('\n📸 Inspecciones encontradas:', inspections.length);
  inspections.forEach((insp) => {
    console.log('\n  - ID:', insp.id, '| Tipo:', insp.inspection_type, '| Vehículo:', insp.vehicle_id);
    console.log('    Fotos presentes:', {
      front: !!insp.front_photo,
      left: !!insp.left_photo,
      rear: !!insp.rear_photo,
      right: !!insp.right_photo,
      odometer: !!insp.odometer_photo
    });
    if (insp.front_photo) {
      console.log('    📁 Tipo de URL frontal:', 
        insp.front_photo.startsWith('http') ? 'HTTP' :
        insp.front_photo.startsWith('uploads/') ? 'S3 Key' : 
        'Desconocido'
      );
      console.log('    📍 Ruta completa:', insp.front_photo);
    }
  });

  await prisma.$disconnect();
}

checkInspections().catch(console.error);
