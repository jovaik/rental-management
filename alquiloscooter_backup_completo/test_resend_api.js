// Script para simular el clic del botón de reenvío
require('dotenv').config();

async function testResendAPI() {
  try {
    console.log('🧪 Simulando llamada a la API de reenvío...\n');
    
    const inspectionId = 49; // ID de la inspección de devolución
    
    // Importar la función directamente
    const { sendInspectionNotification } = require('./lib/inspection-email-notifier');
    
    console.log(`📧 Enviando notificación para inspección ${inspectionId}...\n`);
    
    const result = await sendInspectionNotification({
      inspectionId: inspectionId,
      bookingNumber: '202511100001',
      customerEmail: 'romypauw2000@gmail.com',
      customerName: 'ROMY PAUW',
      vehicleInfo: 'Kymco Like 125 - XCV5693',
      inspectionType: 'return',
      inspectionDate: new Date(),
      pickupDate: new Date('2025-11-10'),
      returnDate: new Date('2025-11-10')
    });
    
    if (result.success) {
      console.log('✅ ¡EMAIL ENVIADO CORRECTAMENTE!');
      console.log('El cliente debería recibir el PDF comparativo en su email.');
    } else {
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
  }
}

testResendAPI();
