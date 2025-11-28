require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== DIAGNÓSTICO COMPLETO - RESERVA #126 ===\n');
    
    // 1. Verificar conductor adicional GREGORY BORZILLERI (duplicado)
    const duplicateDriver = await prisma.bookingDrivers.findUnique({
      where: { id: 10 }
    });
    
    console.log('--- Conductor Adicional ID: 10 (DUPLICADO) ---');
    console.log('Nombre:', duplicateDriver?.full_name);
    console.log('DNI:', duplicateDriver?.dni_nie || '(vacío)');
    console.log('Teléfono:', duplicateDriver?.phone || '(vacío)');
    console.log('Estado: DEBE SER ELIMINADO (es el conductor principal)\n');
    
    // 2. Verificar conductor adicional MICHAEL
    const michaelDriver = await prisma.bookingDrivers.findUnique({
      where: { id: 11 }
    });
    
    console.log('--- Conductor Adicional ID: 11 (MICHAEL) ---');
    console.log('Nombre completo:', michaelDriver?.full_name);
    console.log('DNI:', michaelDriver?.dni_nie || '(vacío)');
    console.log('Carnet:', michaelDriver?.driver_license || '(vacío)');
    console.log('Teléfono:', michaelDriver?.phone || '(vacío)');
    console.log('ID frontal:', michaelDriver?.id_document_front ? 'SÍ' : 'NO');
    console.log('ID trasero:', michaelDriver?.id_document_back ? 'SÍ' : 'NO');
    console.log('Carnet frontal:', michaelDriver?.driver_license_front ? 'SÍ' : 'NO');
    console.log('Carnet trasero:', michaelDriver?.driver_license_back ? 'SÍ' : 'NO');
    console.log('Estado: Documentos de ID subidos, pero faltan carnets\n');
    
    console.log('=== SOLUCIÓN PROPUESTA ===');
    console.log('1. Eliminar conductor adicional ID: 10 (GREGORY BORZILLERI duplicado)');
    console.log('2. Mantener conductor adicional ID: 11 (MICHAEL) pero revisar por qué no puede subir carnets');
    console.log('3. Investigar el problema del componente de subida de documentos\n');
    
    // Preguntar si proceder con la eliminación
    console.log('¿Desea proceder con la eliminación del conductor duplicado? (Ejecutar manualmente)');
    console.log('Comando: await prisma.bookingDrivers.delete({ where: { id: 10 } })');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
