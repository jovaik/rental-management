require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️ Eliminando conductor duplicado...\n');
    
    const deletedDriver = await prisma.bookingDrivers.delete({
      where: { id: 10 }
    });
    
    console.log('✅ Conductor eliminado exitosamente:');
    console.log('   ID:', deletedDriver.id);
    console.log('   Nombre:', deletedDriver.full_name);
    console.log('   De reserva:', deletedDriver.booking_id);
    
    // Verificar que quedó solo MICHAEL
    const remainingDrivers = await prisma.bookingDrivers.findMany({
      where: { booking_id: 126 },
      select: {
        id: true,
        full_name: true,
        dni_nie: true
      }
    });
    
    console.log('\n📋 Conductores adicionales restantes en reserva #126:');
    console.log('   Cantidad:', remainingDrivers.length);
    remainingDrivers.forEach(d => {
      console.log(`   - ID ${d.id}: ${d.full_name} (DNI: ${d.dni_nie || 'vacío'})`);
    });
    
    console.log('\n✅ Duplicación corregida!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
