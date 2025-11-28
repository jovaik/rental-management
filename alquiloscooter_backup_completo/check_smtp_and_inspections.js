const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('=== Verificando Configuración SMTP ===');
  const emailConfig = await prisma.carRentalEmailConfig.findFirst();
  if (emailConfig) {
    console.log('Configuración SMTP encontrada:');
    console.log('- Host:', emailConfig.smtp_host);
    console.log('- Puerto:', emailConfig.smtp_port);
    console.log('- Usuario:', emailConfig.smtp_user);
    console.log('- Configurado:', emailConfig.smtp_password ? 'Sí' : 'No');
  } else {
    console.log('No se encontró configuración SMTP en la base de datos');
  }
  
  console.log('\n=== Verificando Inspecciones de Reserva 202511110003 ===');
  const booking = await prisma.carRentalBookings.findFirst({
    where: { booking_number: '202511110003' },
    include: {
      vehicles: {
        include: {
          vehicle: true
        }
      }
    }
  });
  
  if (!booking) {
    console.log('Reserva no encontrada');
    return;
  }
  
  console.log('Reserva encontrada:', booking.booking_number);
  console.log('Vehículos:', booking.vehicles.length);
  
  for (const bv of booking.vehicles) {
    console.log(`\n--- Vehículo: ${bv.vehicle.make} ${bv.vehicle.model} (${bv.vehicle.registration}) ---`);
    
    // Buscar inspecciones de este vehículo
    const inspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: booking.id,
        vehicle_id: bv.vehicle_id
      },
      orderBy: { inspection_date: 'asc' }
    });
    
    console.log(`Total inspecciones: ${inspections.length}`);
    
    for (const insp of inspections) {
      console.log(`\nInspección ${insp.id}:`);
      console.log('  Tipo:', insp.inspection_type);
      console.log('  Fecha:', insp.inspection_date);
      console.log('  Fotos:');
      console.log('    - Frontal:', insp.photo_front ? 'Sí' : 'No');
      console.log('    - Izquierda:', insp.photo_left ? 'Sí' : 'No');
      console.log('    - Trasera:', insp.photo_rear ? 'Sí' : 'No');
      console.log('    - Derecha:', insp.photo_right ? 'Sí' : 'No');
      console.log('    - Odómetro:', insp.photo_odometer ? 'Sí' : 'No');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
