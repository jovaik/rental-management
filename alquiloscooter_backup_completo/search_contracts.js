require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchContracts() {
  try {
    // Buscar todos los contratos
    const contracts = await prisma.carRentalContracts.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      include: {
        booking: {
          include: {
            customer: true
          }
        }
      }
    });

    console.log(`📋 Últimos ${contracts.length} contratos en el sistema:\n`);
    
    if (contracts.length === 0) {
      console.log('❌ No hay contratos en el sistema');
      return;
    }

    contracts.forEach(contract => {
      console.log(`ID Contrato: ${contract.id} | Número: ${contract.contract_number}`);
      console.log(`  Reserva ID: ${contract.booking_id} | Número: ${contract.booking?.booking_number || 'N/A'}`);
      console.log(`  Cliente: ${contract.booking?.customer?.name || 'Sin cliente'}`);
      console.log(`  Firmado: ${contract.signed_at ? 'SÍ (' + contract.signed_at.toLocaleString() + ')' : 'NO'}`);
      console.log(`  Versión: ${contract.version}`);
      console.log('');
    });

    // Buscar si existe algo relacionado con "57"
    const contract57 = await prisma.carRentalContracts.findMany({
      where: {
        OR: [
          { id: 57 },
          { booking_id: 57 },
          { contract_number: { contains: '57' } }
        ]
      },
      include: {
        booking: {
          include: {
            customer: true
          }
        }
      }
    });

    if (contract57.length > 0) {
      console.log('\n🔍 Contratos relacionados con "57":\n');
      contract57.forEach(contract => {
        console.log(`ID Contrato: ${contract.id} | Número: ${contract.contract_number}`);
        console.log(`  Reserva ID: ${contract.booking_id}`);
        console.log(`  Cliente: ${contract.booking?.customer?.name || 'Sin cliente'}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No se encontró ningún contrato con "57" (ni ID, ni booking_id, ni número de contrato)\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

searchContracts();
