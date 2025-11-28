const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener una de las reservas importadas problemáticas
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 243 },
      include: {
        customer: true,
        car: true,
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });

    console.log('\n🔍 SIMULACIÓN DE openEditDialog PARA RESERVA #243:\n');
    console.log('='.repeat(60));
    
    // Simular la lógica de openEditDialog
    console.log('\n📊 DATOS RAW DE LA RESERVA:');
    console.log('  id:', booking.id);
    console.log('  booking_number:', booking.booking_number);
    console.log('  customer_id:', booking.customer_id);
    console.log('  customer_name:', booking.customer_name);
    console.log('  customer_email:', booking.customer_email);
    console.log('  customer_phone:', booking.customer_phone);
    console.log('  car_id:', booking.car_id);
    console.log('  pickup_date:', booking.pickup_date);
    console.log('  return_date:', booking.return_date);
    console.log('  total_price:', booking.total_price);
    console.log('  status:', booking.status);

    console.log('\n👤 OBJETO CUSTOMER:');
    if (booking.customer) {
      console.log('  ✅ Customer existe:');
      console.log('    id:', booking.customer.id);
      console.log('    first_name:', booking.customer.first_name);
      console.log('    last_name:', booking.customer.last_name);
      console.log('    email:', booking.customer.email);
      console.log('    phone:', booking.customer.phone);
    } else {
      console.log('  ❌ Customer es NULL');
    }

    console.log('\n🚗 VEHÍCULO (car):');
    if (booking.car) {
      console.log('  ✅ Car existe:');
      console.log('    id:', booking.car.id);
      console.log('    registration_number:', booking.car.registration_number);
      console.log('    make:', booking.car.make);
      console.log('    model:', booking.car.model);
    } else {
      console.log('  ❌ Car es NULL');
    }

    console.log('\n🚙 VEHÍCULOS ASIGNADOS (vehicles):');
    console.log('  Total vehicles:', booking.vehicles?.length || 0);
    if (booking.vehicles && booking.vehicles.length > 0) {
      booking.vehicles.forEach((v, i) => {
        console.log(`  Vehicle ${i + 1}:`);
        console.log(`    id: ${v.id}, car_id: ${v.car_id}`);
        if (v.car) {
          console.log(`    car: ${v.car.make} ${v.car.model} (${v.car.registration_number})`);
        }
      });
    }

    // Simular formData que se establecería
    const priceValue = booking.total_price !== null && booking.total_price !== undefined 
      ? booking.total_price.toString() 
      : '0';
    
    const customerName = booking.customer 
      ? `${booking.customer.first_name} ${booking.customer.last_name}`.trim()
      : booking.customer_name;

    console.log('\n📝 FORMDATA QUE SE ESTABLECERÍA:');
    const formData = {
      car_id: booking.car_id.toString(),
      customer_id: booking.customer_id ? booking.customer_id.toString() : '',
      customer_name: customerName,
      customer_email: booking.customer?.email || booking.customer_email,
      customer_phone: booking.customer?.phone || booking.customer_phone,
      pickup_date: booking.pickup_date,
      return_date: booking.return_date,
      total_price: priceValue,
      status: booking.status
    };

    Object.entries(formData).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${value}`);
    });

    console.log('\n');
    console.log('='.repeat(60));

    // Verificar si hay problemas
    const problemas = [];
    if (!booking.customer_id) problemas.push('customer_id es NULL');
    if (!booking.customer_name) problemas.push('customer_name es NULL');
    if (!booking.customer_email) problemas.push('customer_email es NULL');
    if (!booking.customer_phone) problemas.push('customer_phone es NULL');
    if (!booking.car_id) problemas.push('car_id es NULL');
    if (!booking.customer) problemas.push('customer relation es NULL');
    if (!booking.car) problemas.push('car relation es NULL');

    if (problemas.length > 0) {
      console.log('\n⚠️  PROBLEMAS DETECTADOS:');
      problemas.forEach(p => console.log(`  - ${p}`));
    } else {
      console.log('\n✅ TODOS LOS CAMPOS NECESARIOS ESTÁN PRESENTES');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
