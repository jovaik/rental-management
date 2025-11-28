const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function buscarContratosFirmados() {
  try {
    console.log('🔍 Buscando TODOS los contratos firmados...\n');
    
    // Buscar contratos con firma (signature_data no null)
    const contratosFirmados = await prisma.carRentalContracts.findMany({
      where: {
        signature_data: { not: null }
      },
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

    console.log(`📋 Total de contratos firmados: ${contratosFirmados.length}\n`);
    
    if (contratosFirmados.length === 0) {
      console.log('⚠️ No se encontraron contratos firmados con signature_data');
      
      // Buscar contratos con signed_at (otra forma de estar firmado)
      const contratosSigned = await prisma.carRentalContracts.findMany({
        where: {
          signed_at: { not: null }
        },
        orderBy: { created_at: 'desc' },
        include: {
          booking: {
            include: {
              customer: true
            }
          }
        }
      });
      
      console.log(`\n📋 Contratos con signed_at: ${contratosSigned.length}\n`);
      
      for (const contrato of contratosSigned) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📄 ID: ${contrato.id} | Reserva: ${contrato.booking?.booking_number}`);
        console.log(`📅 Firmado: ${contrato.signed_at?.toLocaleString('es-ES')}`);
        console.log(`👤 ${contrato.booking?.customer?.nombre || 'Sin nombre'} ${contrato.booking?.customer?.apellido || ''}`);
        console.log(`📄 PDF: ${contrato.pdf_cloud_storage_path || 'NO'}`);
        console.log(`🔗 Token: ${contrato.remote_signature_token || 'NO'}`);
        console.log(`🔗 URL: https://app.alquiloscooter.com/api/contracts/${contrato.id}/download`);
        console.log();
      }
      
    } else {
      console.log(`📋 Contratos firmados (más recientes primero):\n`);
      
      for (let i = 0; i < contratosFirmados.length; i++) {
        const contrato = contratosFirmados[i];
        const booking = contrato.booking;
        const customer = booking?.customer;
        const vehicle = booking?.vehicles?.[0]?.car;
        
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`#${i + 1} - CONTRATO ID: ${contrato.id}`);
        console.log(`📅 Firmado: ${contrato.signed_at?.toLocaleString('es-ES') || contrato.created_at?.toLocaleString('es-ES')}`);
        console.log(`🔢 Reserva #: ${booking?.booking_number || 'N/A'}`);
        console.log(`🆔 Booking ID: ${booking?.id}`);
        console.log(`👤 Cliente: ${customer?.nombre || ''} ${customer?.apellido || ''}`);
        console.log(`📧 Email: ${customer?.email || 'N/A'}`);
        console.log(`🚗 Vehículo: ${vehicle?.make || ''} ${vehicle?.model || ''} (${vehicle?.registration_number || ''})`);
        console.log(`📄 PDF en S3: ${contrato.pdf_cloud_storage_path ? 'SÍ ✅' : 'NO ❌'}`);
        console.log(`📱 Token: ${contrato.remote_signature_token || 'NO'}`);
        console.log();
        console.log(`🔗 URL descarga API: https://app.alquiloscooter.com/api/contracts/${contrato.id}/download`);
        if (contrato.remote_signature_token) {
          console.log(`🔗 URL pública: https://app.alquiloscooter.com/contracts/${contrato.remote_signature_token}`);
        }
        console.log();
      }
      
      // Identificar los 3 últimos
      if (contratosFirmados.length >= 3) {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 LOS 3 CONTRATOS FIRMADOS MÁS RECIENTES:');
        console.log('='.repeat(60) + '\n');
        
        for (let i = 0; i < 3; i++) {
          const c = contratosFirmados[i];
          console.log(`${i + 1}. Contrato #${c.id} - Reserva ${c.booking?.booking_number} - ${c.booking?.customer?.nombre || 'Sin nombre'}`);
          console.log(`   Descargar: https://app.alquiloscooter.com/api/contracts/${c.id}/download`);
          console.log();
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarContratosFirmados();
