
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateDeposit() {
  try {
    console.log('[TEST] Intentando crear depósito con valores numéricos...');
    
    const dataToCreate = {
      booking_id: 131,
      monto_deposito: 200,
      metodo_pago_deposito: 'EFECTIVO',
      fecha_deposito: new Date(),
      estado: 'RETENIDO',
      monto_devuelto: 0,
      monto_descontado: 0,
      fecha_devolucion: null,
      metodo_devolucion: null,
      descuento_danos: 0,
      descuento_multas: 0,
      descuento_extensiones: 0,
      descuento_otros: 0,
      notas: null
    };
    
    console.log('[TEST] Datos a crear:', JSON.stringify(dataToCreate, null, 2));
    
    const deposit = await prisma.bookingDeposits.create({
      data: dataToCreate
    });
    
    console.log('[TEST] ✅ Depósito creado exitosamente:', deposit);
  } catch (error) {
    console.error('[TEST] ❌ Error creando depósito:');
    console.error('Error:', error);
    console.error('Code:', error.code);
    console.error('Meta:', JSON.stringify(error.meta, null, 2));
    console.error('Message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateDeposit();
