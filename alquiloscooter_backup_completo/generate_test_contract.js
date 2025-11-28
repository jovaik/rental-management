require('dotenv').config({ path: './app/.env' });
const fs = require('fs');
const path = require('path');

async function generateTestContract() {
  try {
    console.log('🧪 Generando contrato de prueba para verificar calidad de fotos\n');
    console.log('   Reserva: 202510260001');
    console.log('   Cliente: DONAVON CECIL FREDERIKSSON\n');
    
    // Hacer petición a la API de contratos
    const response = await fetch('http://localhost:3000/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingNumber: '202510260001',
        language: 'es'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error generando contrato:', error);
      return;
    }
    
    const contract = await response.json();
    
    if (contract.pdfUrl) {
      console.log('✅ Contrato generado exitosamente\n');
      console.log('📄 URL:', contract.pdfUrl);
      console.log(`📊 Tamaño: ${(contract.pdfSize / 1024).toFixed(2)} KB\n`);
      
      // Descargar el PDF para análisis
      const pdfResponse = await fetch(contract.pdfUrl);
      const buffer = await pdfResponse.arrayBuffer();
      const outputPath = path.join(__dirname, 'test_contract_202510260001.pdf');
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      
      console.log('💾 PDF guardado en:', outputPath);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 VERIFICACIÓN PENDIENTE:\n');
      console.log('1. Abrir el PDF y revisar la calidad de las fotos');
      console.log('2. Verificar si se pueden distinguir daños pequeños');
      console.log('3. Comprobar el tamaño del archivo (¿es manejable?)');
      console.log('4. Confirmar que solo incluye inspección de SALIDA\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
    } else {
      console.log('⚠️  Contrato generado pero sin PDF URL');
      console.log('Respuesta:', JSON.stringify(contract, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateTestContract();
