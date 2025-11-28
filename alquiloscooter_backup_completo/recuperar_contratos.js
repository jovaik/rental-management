const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function recuperarContratos() {
  try {
    console.log('🔍 Buscando contratos recientes...\n');
    
    // Buscar los últimos 5 contratos
    const contratos = await prisma.carRentalContracts.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: {
              include: {
                car: true
              }
            }
          }
        }
      }
    });

    console.log(`📋 Encontrados ${contratos.length} contratos recientes:\n`);
    
    for (const contrato of contratos) {
      const booking = contrato.booking;
      const customer = booking?.customer;
      const vehicle = booking?.vehicles?.[0]?.car;
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 Contrato ID: ${contrato.id}`);
      console.log(`📅 Fecha: ${contrato.created_at?.toLocaleString('es-ES')}`);
      console.log(`🔢 Reserva #: ${booking?.booking_number || 'N/A'}`);
      console.log(`🆔 Booking ID: ${booking?.id || 'N/A'}`);
      console.log(`👤 Cliente: ${customer?.nombre || ''} ${customer?.apellido || ''}`);
      console.log(`🚗 Vehículo: ${vehicle?.make || ''} ${vehicle?.model || ''} (${vehicle?.registration_number || ''})`);
      console.log(`✍️ Firmado: ${contrato.client_signature ? 'SÍ ✅' : 'NO ❌'}`);
      console.log(`📱 Token: ${contrato.signed_contract_token || 'NO'}`);
      console.log();
      
      // URLs para recuperación
      if (booking?.id) {
        console.log(`🔗 URL API descarga: https://app.alquiloscooter.com/api/contracts/${contrato.id}/download`);
        if (contrato.signed_contract_token) {
          console.log(`🔗 URL pública: https://app.alquiloscooter.com/contracts/${contrato.signed_contract_token}`);
        }
        console.log();
      }
    }

    console.log('\n✅ Análisis completado');
    console.log('\n📝 INSTRUCCIONES PARA RECUPERAR:');
    console.log('   1. Copia la URL de descarga del contrato que necesitas');
    console.log('   2. Ábrela en tu navegador (estando logueado)');
    console.log('   3. Se descargará automáticamente el PDF');
    console.log('\n   O si prefieres, dame los IDs de los contratos que necesitas y te los bajo yo.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recuperarContratos();
