require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('\n=== TEST EMAIL RESERVA 143 ===\n');
  
  const booking = await prisma.carRentalBookings.findUnique({
    where: { id: 143 },
    include: {
      customer: true,
      contract: true,
      vehicles: {
        include: {
          car: true
        }
      },
      inspections: {
        where: {
          inspection_type: 'delivery'
        },
        orderBy: {
          inspection_date: 'desc'
        },
        take: 1
      }
    }
  });

  if (!booking) {
    console.log('❌ Reserva no encontrada');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ DATOS DE LA RESERVA:');
  console.log(`   ID: ${booking.id}`);
  console.log(`   Número: ${booking.booking_number}`);
  console.log(`   Cliente email: ${booking.customer?.email}`);
  console.log(`   Cliente nombre: ${booking.customer?.first_name} ${booking.customer?.last_name}`);
  console.log(`\n📄 CONTRATO:`);
  console.log(`   Existe: ${booking.contract ? 'Sí' : 'No'}`);
  if (booking.contract) {
    console.log(`   ID: ${booking.contract.id}`);
    console.log(`   Firmado: ${booking.contract.signed_at ? 'Sí' : 'No'}`);
    console.log(`   Tiene contract_text: ${booking.contract.contract_text ? `Sí (${booking.contract.contract_text.length} chars)` : 'No'}`);
  }
  
  console.log(`\n🔍 INSPECCIONES DE ENTREGA:`);
  console.log(`   Cantidad: ${booking.inspections?.length || 0}`);
  if (booking.inspections && booking.inspections.length > 0) {
    const insp = booking.inspections[0];
    console.log(`   ID: ${insp.id}`);
    console.log(`   Tipo: ${insp.inspection_type}`);
    console.log(`   Fecha: ${insp.inspection_date}`);
    console.log(`   Vehículo ID: ${insp.vehicle_id}`);
  }

  console.log(`\n📋 VERIFICACIÓN DE REQUISITOS PARA EMAIL:`);
  const hasBooking = !!booking;
  const hasCustomer = !!booking.customer;
  const hasContract = !!booking.contract;
  const hasContractText = !!booking.contract?.contract_text;
  const hasDeliveryInspection = booking.inspections && booking.inspections.length > 0;
  
  console.log(`   ✅ Reserva existe: ${hasBooking}`);
  console.log(`   ${hasCustomer ? '✅' : '❌'} Cliente existe: ${hasCustomer}`);
  console.log(`   ${hasContract ? '✅' : '❌'} Contrato existe: ${hasContract}`);
  console.log(`   ${hasContractText ? '✅' : '❌'} Contract_text existe: ${hasContractText}`);
  console.log(`   ${hasDeliveryInspection ? '✅' : '❌'} Inspección de entrega: ${hasDeliveryInspection}`);
  
  if (hasBooking && hasCustomer && hasContract && hasContractText && hasDeliveryInspection) {
    console.log(`\n✅ TODOS LOS REQUISITOS SE CUMPLEN`);
    console.log(`   La función debería generar 2 PDFs:`);
    console.log(`   1. Contrato_${booking.booking_number}.pdf`);
    console.log(`   2. Informe_Salida_${booking.booking_number}.pdf`);
  } else {
    console.log(`\n❌ FALTAN REQUISITOS PARA GENERAR ADJUNTOS`);
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
