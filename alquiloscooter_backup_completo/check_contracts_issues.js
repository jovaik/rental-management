require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('\n=== VERIFICACIÓN DE CONTRATOS ===\n');
  
  // Contratos a verificar
  const contractIds = [141, 133, 131, 130, 64];
  
  for (const id of contractIds) {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id },
      include: {
        vehicles: { include: { car: true } },
        customer: true
      }
    });
    
    if (!booking) {
      console.log(`❌ Reserva ${id} no encontrada\n`);
      continue;
    }
    
    const contract = await prisma.carRentalContracts.findFirst({
      where: { booking_id: id },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`📋 RESERVA ${id} (${booking.booking_number}):`);
    console.log(`   Cliente: ${booking.customer?.first_name} ${booking.customer?.last_name}`);
    console.log(`   Vehículos: ${booking.vehicles?.length || 0}`);
    
    if (booking.vehicles?.length > 0) {
      booking.vehicles.forEach((bv, idx) => {
        console.log(`   - Vehículo ${idx + 1}: ${bv.car.make} ${bv.car.model} (${bv.car.registration_number})`);
      });
    }
    
    if (!contract) {
      console.log(`   ❌ Sin contrato generado\n`);
      continue;
    }
    
    console.log(`\n   📄 CONTRATO ID ${contract.id}:`);
    console.log(`      Firmado: ${contract.signed_at ? 'Sí' : 'No'}`);
    console.log(`      Tiene firma (signature_data): ${contract.signature_data ? 'Sí' : 'No'}`);
    
    if (contract.contract_text) {
      const text = contract.contract_text;
      const hasLogo = text.includes('alquiloscooter-logo') || text.includes('logoBase64');
      const hasInspectionLink = text.includes('/inspeccion/') || text.includes('FOTOGRAFÍAS DE INSPECCIÓN');
      const signatureCount = (text.match(/Firma Digital del Cliente|FIRMA DEL CONTRATO/gi) || []).length;
      
      console.log(`      Logo en HTML: ${hasLogo ? 'Sí' : 'No'}`);
      console.log(`      Link inspección: ${hasInspectionLink ? 'Sí' : 'No'}`);
      console.log(`      Secciones de firma en HTML: ${signatureCount}`);
    }
    
    // Verificar inspecciones
    for (const bv of booking.vehicles) {
      const deliveryInsp = await prisma.vehicleInspections.findFirst({
        where: { booking_id: id, vehicle_id: bv.car_id, inspection_type: 'delivery' }
      });
      const returnInsp = await prisma.vehicleInspections.findFirst({
        where: { booking_id: id, vehicle_id: bv.car_id, inspection_type: 'return' }
      });
      
      console.log(`\n   🔍 Inspecciones ${bv.car.registration_number}:`);
      console.log(`      Entrega: ${deliveryInsp ? `ID ${deliveryInsp.id}` : 'No'}`);
      console.log(`      Devolución: ${returnInsp ? `ID ${returnInsp.id}` : 'No'}`);
    }
    
    console.log('\n');
  }
  
  await prisma.$disconnect();
}

check();
