require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContract() {
  const booking = await prisma.carRentalBookings.findFirst({
    where: { booking_number: '202511070001' },
    include: {
      contract: {
        select: {
          id: true,
          contract_number: true,
          signed_at: true,
          signature_data: true,
          version: true
        }
      },
      vehicles: {
        include: {
          car: {
            select: {
              id: true,
              make: true,
              model: true,
              registration_number: true
            }
          }
        }
      },
      inspections: {
        where: {
          inspection_type: 'delivery'
        },
        select: {
          id: true,
          vehicle_id: true,
          inspection_type: true,
          front_photo: true,
          left_photo: true,
          rear_photo: true,
          right_photo: true,
          odometer_photo: true
        }
      }
    }
  });
  
  if (booking) {
    console.log('\n=== RESERVA #126 ===');
    console.log('ID:', booking.id);
    console.log('Número:', booking.booking_number);
    console.log('Estado:', booking.status);
    console.log('\n=== CONTRATO ===');
    if (booking.contract) {
      console.log('Existe:', 'SÍ');
      console.log('Número:', booking.contract.contract_number);
      console.log('Firmado:', booking.contract.signed_at ? 'SÍ - ' + booking.contract.signed_at.toISOString() : 'NO');
      console.log('Versión:', booking.contract.version);
      console.log('Tiene firma:', !!booking.contract.signature_data);
    } else {
      console.log('Existe:', 'NO - El contrato se regenerará automáticamente');
    }
    
    console.log('\n=== VEHÍCULOS ===');
    console.log('Cantidad:', booking.vehicles.length);
    booking.vehicles.forEach((bv, idx) => {
      console.log(`\nVehículo ${idx + 1}:`, bv.car.make, bv.car.model, '-', bv.car.registration_number);
    });
    
    console.log('\n=== INSPECCIONES DE ENTREGA ===');
    console.log('Cantidad:', booking.inspections.length);
    booking.inspections.forEach((insp, idx) => {
      console.log(`\nInspección ${idx + 1}:`);
      console.log('  Vehicle ID:', insp.vehicle_id);
      console.log('  Foto frontal:', insp.front_photo ? 'SÍ' : 'NO');
      if (insp.front_photo) {
        console.log('    Path:', insp.front_photo);
      }
      console.log('  Foto izquierda:', insp.left_photo ? 'SÍ' : 'NO');
      console.log('  Foto trasera:', insp.rear_photo ? 'SÍ' : 'NO');
      console.log('  Foto derecha:', insp.right_photo ? 'SÍ' : 'NO');
      console.log('  Foto odómetro:', insp.odometer_photo ? 'SÍ' : 'NO');
    });
    
    console.log('\n\n=== CONCLUSIÓN ===');
    if (!booking.contract || !booking.contract.signed_at) {
      console.log('✅ El contrato NO está firmado → Se regenerará automáticamente con la última lógica');
    } else {
      console.log('⚠️  El contrato YA está firmado → NO se regenerará por seguridad legal');
      console.log('   Para ver cambios, necesitas eliminar el contrato firmado y regenerarlo manualmente');
    }
  } else {
    console.log('No se encontró la reserva');
  }
  
  await prisma.$disconnect();
}

checkContract();
