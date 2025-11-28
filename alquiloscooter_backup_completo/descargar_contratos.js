const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

// Importar el generador de PDF
async function descargarContratos() {
  const contratosARecuperar = [64, 58, 42];
  const directorioSalida = '/home/ubuntu/CONTRATOS_RECUPERADOS';
  
  console.log('🔄 Iniciando recuperación de contratos...\n');
  
  for (const contratoId of contratosARecuperar) {
    try {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 Procesando Contrato #${contratoId}...`);
      
      // Buscar el contrato
      const contrato = await prisma.carRentalContracts.findUnique({
        where: { id: contratoId },
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
      
      if (!contrato) {
        console.log(`   ❌ Contrato no encontrado`);
        continue;
      }
      
      const booking = contrato.booking;
      const customer = booking?.customer;
      
      console.log(`   ✅ Encontrado:`);
      console.log(`      Reserva: ${booking?.booking_number}`);
      console.log(`      Cliente: ${customer?.email}`);
      console.log(`      Firmado: ${contrato.signed_at?.toLocaleString('es-ES')}`);
      
      // Información para recuperación manual
      const fileName = `contrato_${contratoId}_${booking?.booking_number}_${customer?.email?.split('@')[0]}.txt`;
      const filePath = path.join(directorioSalida, fileName);
      
      const info = `
INFORMACIÓN CONTRATO #${contratoId}
═══════════════════════════════════════════════════════

📋 Detalles:
   • ID Contrato: ${contratoId}
   • Número Reserva: ${booking?.booking_number}
   • Booking ID: ${booking?.id}
   • Cliente: ${customer?.nombre || ''} ${customer?.apellido || ''}
   • Email: ${customer?.email}
   • Firmado: ${contrato.signed_at?.toLocaleString('es-ES')}

🔗 URLs para Recuperación:

   1. URL API (requiere login):
      https://app.alquiloscooter.com/api/contracts/${contratoId}/download

   2. URL directa en navegador (requiere estar logueado):
      https://app.alquiloscooter.com/reservas?contract=${contratoId}

${contrato.remote_signature_token ? `   3. URL pública (sin login):
      https://app.alquiloscooter.com/contracts/${contrato.remote_signature_token}` : ''}

📝 INSTRUCCIONES:
   
   OPCIÓN A - Desde el navegador (MÁS FÁCIL):
   1. Abre el navegador en app.alquiloscooter.com
   2. Inicia sesión con tu cuenta
   3. Copia y pega esta URL en el navegador:
      https://app.alquiloscooter.com/api/contracts/${contratoId}/download
   4. El PDF se descargará automáticamente

   OPCIÓN B - Desde gestión de reservas:
   1. Ve a Planning / Reservas
   2. Busca la reserva ${booking?.booking_number}
   3. Clic en el menú (3 puntos)
   4. Selecciona "Ver/Enviar Contrato"
   5. Clic en "Descargar PDF"
`;
      
      fs.writeFileSync(filePath, info);
      console.log(`   📝 Información guardada en: ${fileName}`);
      console.log();
      
    } catch (error) {
      console.error(`   ❌ Error procesando contrato ${contratoId}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ RECUPERACIÓN COMPLETADA');
  console.log('='.repeat(60));
  console.log(`\n📂 Archivos guardados en: ${directorioSalida}\n`);
  console.log('📝 He creado archivos .txt con las URLs de descarga de cada contrato.');
  console.log('   Puedes usar cualquiera de las opciones mencionadas para descargarlos.\n');
  
  await prisma.$disconnect();
}

descargarContratos();
