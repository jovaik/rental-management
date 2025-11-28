const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReservation() {
  try {
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        id: 126
      },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        },
        contract: true
      }
    });
    
    if (!booking) {
      console.log('❌ Reserva #126 no encontrada');
      return;
    }
    
    console.log('\n📋 RESERVA #126');
    console.log('================');
    console.log('Número:', booking.booking_number);
    console.log('Cliente:', booking.customer?.first_name, booking.customer?.last_name);
    console.log('Vehículos:', booking.vehicles?.length || 0);
    
    if (booking.vehicles) {
      for (const v of booking.vehicles) {
        console.log(`  - ${v.car?.make} ${v.car?.model} (${v.car?.registration_number})`);
      }
    }
    
    // Buscar inspecciones
    const inspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: 126
      },
      orderBy: {
        inspection_date: 'desc'
      }
    });
    
    console.log('\n🔍 INSPECCIONES:');
    console.log('=================');
    console.log('Total:', inspections.length);
    
    for (const insp of inspections) {
      console.log(`\n  ${insp.inspection_type} - Vehículo ID: ${insp.vehicle_id}`);
      console.log(`  - Fecha: ${insp.inspection_date}`);
      console.log(`  - Front: ${insp.front_photo ? '✓' : '✗'}`);
      console.log(`  - Left: ${insp.left_photo ? '✓' : '✗'}`);
      console.log(`  - Rear: ${insp.rear_photo ? '✓' : '✗'}`);
      console.log(`  - Right: ${insp.right_photo ? '✓' : '✗'}`);
      console.log(`  - Odometer: ${insp.odometer_photo ? '✓' : '✗'}`);
      
      if (insp.front_photo) {
        console.log(`  - Path ejemplo: ${insp.front_photo.substring(0, 100)}`);
      }
    }
    
    // Buscar contrato
    if (booking.contract) {
      console.log('\n📄 CONTRATO:');
      console.log('============');
      console.log('Número:', booking.contract.contract_number);
      console.log('Firmado:', booking.contract.signed_at ? 'Sí' : 'No');
      console.log('Tamaño HTML:', booking.contract.contract_text?.length || 0, 'caracteres');
      
      // Verificar si contiene fotos
      const hasPhotos = booking.contract.contract_text?.includes('data:image');
      console.log('Contiene fotos:', hasPhotos ? 'Sí' : 'NO');
      
      // Verificar sección de inspecciones
      const hasInspectionSection = booking.contract.contract_text?.includes('COMPARATIVA VISUAL');
      console.log('Tiene sección inspecciones:', hasInspectionSection ? 'Sí' : 'NO');
    } else {
      console.log('\n📄 CONTRATO: No generado aún');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservation();
