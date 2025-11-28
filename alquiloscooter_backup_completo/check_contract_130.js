require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContract130() {
  try {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 130 },
      include: {
        vehicles: { include: { car: true } },
        customer: true
      }
    });

    if (!booking) {
      console.log('❌ Reserva 130 no encontrada');
      return;
    }

    console.log('\n📋 RESERVA 130:');
    console.log(`   Número: ${booking.booking_number}`);
    console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name}`);

    const contract = await prisma.carRentalContracts.findFirst({
      where: { booking_id: 130 },
      orderBy: { created_at: 'desc' }
    });

    if (!contract) {
      console.log('❌ Contrato no encontrado');
      return;
    }

    console.log('\n📄 CONTRATO:');
    console.log(`   ID: ${contract.id}`);
    console.log(`   Firmado: ${contract.signed_at ? 'Sí' : 'No'}`);
    
    if (contract.contract_text) {
      const signatureMatches = (contract.contract_text.match(/Firma Digital del Cliente/g) || []).length;
      console.log(`   Firmas duplicadas: ${signatureMatches} veces`);
      
      const hasInspectionLink = contract.contract_text.includes('inspeccion') || contract.contract_text.includes('inspection');
      console.log(`   Tiene enlace inspección: ${hasInspectionLink ? 'Sí' : 'No'}`);
    }

    for (const bv of booking.vehicles) {
      const deliveryInsp = await prisma.vehicleInspections.findFirst({
        where: { booking_id: 130, vehicle_id: bv.car_id, inspection_type: 'delivery' }
      });
      const returnInsp = await prisma.vehicleInspections.findFirst({
        where: { booking_id: 130, vehicle_id: bv.car_id, inspection_type: 'return' }
      });

      console.log(`\n🔍 Vehículo ${bv.car.registration_number}:`);
      console.log(`   Entrega: ${deliveryInsp ? `ID ${deliveryInsp.id}` : 'No'}`);
      console.log(`   Devolución: ${returnInsp ? `ID ${returnInsp.id}` : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContract130();
