require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('Conectando a la base de datos...\n');
    
    // Contar total de reservas
    const totalBookings = await prisma.booking.count();
    console.log(`📊 Total de reservas en BD: ${totalBookings}`);
    
    // Contar clientes
    const totalCustomers = await prisma.customer.count();
    console.log(`👥 Total de clientes en BD: ${totalCustomers}\n`);
    
    // Obtener las últimas 10 reservas
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { 
        customer: { 
          select: { name: true, email: true } 
        }
      }
    });
    
    console.log('📋 Últimas 10 reservas creadas:');
    console.log('─'.repeat(80));
    recentBookings.forEach((b, idx) => {
      const bookingNum = b.bookingNumber || b.id.slice(0, 8);
      const customerName = b.customer.name;
      const dateCreated = b.createdAt.toISOString().split('T')[0];
      const dateStart = b.startDate.toISOString().split('T')[0];
      console.log(`${idx + 1}. #${bookingNum} | ${customerName} | Inicio: ${dateStart} | Creada: ${dateCreated}`);
    });
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error al verificar:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
