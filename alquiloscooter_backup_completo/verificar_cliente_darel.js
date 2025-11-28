require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        customer: {
          OR: [
            { first_name: { contains: 'Darel', mode: 'insensitive' } },
            { last_name: { contains: 'Ribero', mode: 'insensitive' } },
            { last_name: { contains: 'Rivero', mode: 'insensitive' } }
          ]
        }
      },
      include: {
        customer: true
      },
      orderBy: { id: 'desc' }
    });

    if (!booking) {
      console.log('❌ NO SE ENCONTRÓ RESERVA');
      await prisma.$disconnect();
      return;
    }

    const customer = booking.customer;

    console.log('👤 ESTADO DEL CLIENTE DAREL RIVERO:');
    console.log('═══════════════════════════════════════════');
    console.log('Nombre:', customer.first_name, customer.last_name);
    console.log('Email:', customer.email);
    console.log('Teléfono:', customer.phone);
    console.log('STATUS:', customer.status, customer.status === 'incomplete' ? '❌ INCOMPLETO' : '✅ COMPLETO');
    console.log('');
    console.log('📋 DATOS FALTANTES:');
    console.log('DNI/NIE:', customer.dni_nie || '❌ FALTA');
    console.log('Dirección:', customer.street_address || '❌ FALTA');
    console.log('Carnet Frontal:', customer.driver_license_front ? '✅' : '❌ FALTA');
    console.log('Carnet Trasero:', customer.driver_license_back ? '✅' : '❌ FALTA');
    console.log('ID Frontal:', customer.id_document_front ? '✅' : '❌ FALTA');
    console.log('ID Trasero:', customer.id_document_back ? '✅' : '❌ FALTA');
    console.log('');
    console.log('🔍 DIAGNÓSTICO:');
    if (customer.status === 'incomplete') {
      console.log('⚠️  EL CLIENTE ESTÁ INCOMPLETO → NO SE PUEDEN HACER INSPECCIONES DE DEVOLUCIÓN');
      console.log('');
      console.log('✅ SOLUCIÓN:');
      console.log('   1. Ir a CLIENTES en el menú');
      console.log('   2. Editar el cliente Darel Rivero');
      console.log('   3. Completar DNI, dirección y subir documentos');
      console.log('   4. El status cambiará a "active" automáticamente');
      console.log('   5. Entonces podrá hacer la inspección de devolución');
    } else {
      console.log('✅ El cliente está completo. El problema debe ser otro.');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
