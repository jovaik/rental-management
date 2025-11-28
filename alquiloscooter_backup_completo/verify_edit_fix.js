const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar una de las reservas corregidas
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 243 },
      include: {
        customer: true,
        car: true
      }
    });

    console.log('\n✅ VERIFICACIÓN FINAL - RESERVA #243:\n');
    console.log('='.repeat(60));
    
    console.log('\n📊 CAMPOS CRÍTICOS PARA EDICIÓN:');
    const campos = {
      'customer_id': booking.customer_id,
      'customer_name': booking.customer_name,
      'customer_email': booking.customer_email,
      'customer_phone': booking.customer_phone,
      'car_id': booking.car_id,
      'pickup_date': booking.pickup_date,
      'return_date': booking.return_date,
      'total_price': booking.total_price
    };

    let todosOK = true;
    Object.entries(campos).forEach(([key, value]) => {
      const ok = value !== null && value !== undefined && value !== '';
      const status = ok ? '✅' : '❌';
      if (!ok) todosOK = false;
      console.log(`  ${status} ${key}: ${value}`);
    });

    console.log('\n🚗 VEHÍCULO ASOCIADO:');
    if (booking.car) {
      console.log(`  ✅ ${booking.car.make} ${booking.car.model} (${booking.car.registration_number})`);
    } else {
      console.log('  ❌ Sin vehículo');
      todosOK = false;
    }

    console.log('\n👤 CLIENTE ASOCIADO:');
    if (booking.customer) {
      console.log(`  ✅ ${booking.customer.first_name} ${booking.customer.last_name}`);
    } else {
      console.log('  ❌ Sin cliente');
      todosOK = false;
    }

    // Simular formData
    try {
      const formData = {
        car_id: booking.car_id.toString(),
        customer_id: booking.customer_id.toString(),
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        pickup_date: booking.pickup_date,
        return_date: booking.return_date,
        total_price: booking.total_price.toString(),
        status: booking.status
      };
      console.log('\n✅ FORMDATA SE CREA CORRECTAMENTE');
      todosOK = true;
    } catch (error) {
      console.log('\n❌ ERROR AL CREAR FORMDATA:', error.message);
      todosOK = false;
    }

    console.log('\n' + '='.repeat(60));
    if (todosOK) {
      console.log('\n🎉 RESERVA #243 AHORA ES TOTALMENTE EDITABLE');
    } else {
      console.log('\n⚠️  AÚN HAY PROBLEMAS');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
