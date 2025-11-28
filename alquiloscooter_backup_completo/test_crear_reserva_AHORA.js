require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateBooking() {
  try {
    console.log('🧪 TEST: Intentando crear reserva directamente en DB...');
    
    // Obtener cualquier vehículo
    const vehicle = await prisma.carRentalCars.findFirst();
    
    if (!vehicle) {
      console.error('❌ No hay vehículos en la base de datos');
      return;
    }
    
    console.log(`✅ Vehículo encontrado: ${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
    
    // Intentar crear una reserva de prueba
    const pickupDate = new Date();
    pickupDate.setHours(10, 0, 0, 0);
    
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 2);
    returnDate.setHours(18, 0, 0, 0);
    
    console.log('📅 Fechas de prueba:', {
      pickup: pickupDate.toISOString(),
      return: returnDate.toISOString()
    });
    
    console.log('\n⏳ Intentando crear reserva...');
    
    const booking = await prisma.carRentalBookings.create({
      data: {
        booking_number: 'TEST-' + Date.now(),
        car_id: vehicle.id,
        customer_name: 'Cliente Test Consola',
        customer_phone: '+34600000000',
        customer_email: 'test@consola.com',
        pickup_date: pickupDate,
        return_date: returnDate,
        total_price: 100.00,
        status: 'confirmed',
        vehicles: {
          create: [{
            car_id: vehicle.id,
            vehicle_price: 100.00
          }]
        }
      },
      include: {
        car: true,
        vehicles: true
      }
    });
    
    console.log('\n✅✅✅ RESERVA CREADA EXITOSAMENTE ✅✅✅');
    console.log('ID:', booking.id);
    console.log('Número:', booking.booking_number);
    console.log('Cliente:', booking.customer_name);
    console.log('Vehículo:', booking.car.make, booking.car.model);
    console.log('Fecha pickup:', booking.pickup_date);
    console.log('Fecha return:', booking.return_date);
    console.log('Total:', booking.total_price);
    
    // Eliminar la reserva de prueba
    console.log('\n🗑️ Eliminando reserva de prueba...');
    await prisma.bookingVehicles.deleteMany({
      where: { booking_id: booking.id }
    });
    await prisma.carRentalBookings.delete({
      where: { id: booking.id }
    });
    console.log('✅ Reserva de prueba eliminada');
    
  } catch (error) {
    console.error('\n❌❌❌ ERROR AL CREAR RESERVA ❌❌❌');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    if (error.code) {
      console.error('Código:', error.code);
    }
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testCreateBooking();
