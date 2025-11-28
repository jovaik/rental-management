require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchContract57() {
  try {
    // Buscar por número de reserva que contenga "57"
    const bookingsByNumber = await prisma.carRentalBookings.findMany({
      where: {
        booking_number: {
          contains: '57'
        }
      },
      include: {
        customer: true
      }
    });

    console.log('🔍 Búsqueda de reservas con "57" en el número:\n');
    if (bookingsByNumber.length === 0) {
      console.log('❌ No se encontraron reservas con "57" en el número de reserva\n');
    } else {
      bookingsByNumber.forEach(b => {
        console.log(`ID: ${b.id} | Número: ${b.booking_number}`);
        console.log(`  Cliente: ${b.customer?.name || 'Sin cliente'}`);
        console.log(`  Estado: ${b.status}`);
        console.log(`  Contrato firmado: ${b.contract_signed ? 'SÍ' : 'NO'}\n`);
      });
    }

    // Buscar todas las reservas con contrato firmado
    const signedContracts = await prisma.carRentalBookings.findMany({
      where: {
        contract_signed: true
      },
      orderBy: { id: 'desc' },
      take: 5,
      include: {
        customer: true
      }
    });

    console.log('📄 Últimos contratos firmados:\n');
    if (signedContracts.length === 0) {
      console.log('❌ No hay contratos firmados en el sistema\n');
    } else {
      signedContracts.forEach(b => {
        console.log(`ID: ${b.id} | Número: ${b.booking_number}`);
        console.log(`  Cliente: ${b.customer?.name || 'Sin cliente'}`);
        console.log(`  Fecha firma: ${b.contract_signed_at}\n`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

searchContract57();
