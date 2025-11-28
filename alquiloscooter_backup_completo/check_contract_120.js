require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContract120() {
  try {
    // Buscar la reserva
    const booking = await prisma.carRentalBookings.findFirst({
      where: { 
        OR: [
          { id: 120 },
          { booking_number: { contains: '120' } }
        ]
      },
      include: {
        vehicles: {
          include: {
            car: true
          }
        },
        customer: true
      }
    });

    if (!booking) {
      console.log('❌ No se encontró reserva con ID o número 120');
      return;
    }

    console.log('\n📋 RESERVA ENCONTRADA:');
    console.log('  ID:', booking.id);
    console.log('  Número:', booking.booking_number);
    console.log('  Cliente:', booking.customer.first_name, booking.customer.last_name);
    console.log('  Vehículos:', booking.vehicles.length);
    
    // Buscar inspecciones
    const inspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: booking.id
      },
      orderBy: { created_at: 'asc' }
    });

    console.log('\n📸 INSPECCIONES:');
    console.log('  Total:', inspections.length);
    
    inspections.forEach((insp, idx) => {
      console.log(`\n  Inspección ${idx + 1}:`);
      console.log('    ID:', insp.id);
      console.log('    Tipo:', insp.inspection_type);
      console.log('    Vehicle ID:', insp.vehicle_id);
      console.log('    Frontal:', insp.photo_front ? '✅ Sí' : '❌ No');
      console.log('    Izquierda:', insp.photo_left ? '✅ Sí' : '❌ No');
      console.log('    Trasera:', insp.photo_rear ? '✅ Sí' : '❌ No');
      console.log('    Derecha:', insp.photo_right ? '✅ Sí' : '❌ No');
      console.log('    Odómetro:', insp.photo_odometer ? '✅ Sí' : '❌ No');
    });

    // Verificar el contrato
    console.log('\n📄 CONTRATO:');
    console.log('  Contrato guardado:', booking.signed_contract_html ? '✅ Sí' : '❌ No');
    if (booking.signed_contract_html) {
      const htmlLength = booking.signed_contract_html.length;
      console.log('  Tamaño HTML:', htmlLength, 'caracteres');
      
      // Verificar si contiene imágenes base64
      const base64Count = (booking.signed_contract_html.match(/data:image/g) || []).length;
      console.log('  Imágenes base64 detectadas:', base64Count);
      
      // Verificar si contiene la sección de comparativa
      const hasComparative = booking.signed_contract_html.includes('COMPARATIVA') || 
                            booking.signed_contract_html.includes('VISUAL DE INSPECCIONES');
      console.log('  Contiene comparativa:', hasComparative ? '✅ Sí' : '❌ No');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContract120();
