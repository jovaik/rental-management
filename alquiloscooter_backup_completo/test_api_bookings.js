require('dotenv').config();

async function testBookingsAPI() {
  try {
    console.log('🧪 TEST: Probando endpoint /api/bookings POST...\n');
    
    // Datos de prueba
    const pickupDate = new Date();
    pickupDate.setHours(10, 0, 0, 0);
    
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 2);
    returnDate.setHours(18, 0, 0, 0);
    
    const testData = {
      vehicle_ids: [{ id: 1, price: 100 }],
      customer_name: 'Cliente Test API',
      customer_phone: '+34600000000',
      customer_email: 'test@api.com',
      pickup_date: pickupDate.toISOString(),
      return_date: returnDate.toISOString(),
      total_price: 100,
      status: 'confirmed'
    };
    
    console.log('📤 Datos de prueba:', JSON.stringify(testData, null, 2));
    console.log('\n⏳ Haciendo petición...\n');
    
    // Intentar simular la petición (sin autenticación aún)
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Verificar que el vehículo existe
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: 1 }
    });
    
    if (!vehicle) {
      console.error('❌ El vehículo con ID 1 no existe');
      console.log('📋 Buscando primer vehículo disponible...');
      const anyVehicle = await prisma.carRentalCars.findFirst();
      if (anyVehicle) {
        console.log(`✅ Vehículo encontrado: ID ${anyVehicle.id} - ${anyVehicle.make} ${anyVehicle.model}`);
        console.log('💡 Usa este ID en el frontend: vehicle_ids: [{ id: ' + anyVehicle.id + ', price: 100 }]');
      }
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ Vehículo válido: ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id})`);
    
    // Simular el código del endpoint
    const { generateBookingNumber } = require('./lib/booking-number');
    const bookingNumber = await generateBookingNumber(pickupDate);
    
    console.log(`📋 Número de reserva generado: ${bookingNumber}`);
    
    // Intentar crear la reserva
    console.log('\n⏳ Creando reserva en DB...');
    const booking = await prisma.carRentalBookings.create({
      data: {
        booking_number: bookingNumber,
        car_id: vehicle.id,
        customer_name: testData.customer_name,
        customer_phone: testData.customer_phone,
        customer_email: testData.customer_email,
        pickup_date: pickupDate,
        return_date: returnDate,
        total_price: testData.total_price,
        status: testData.status,
        vehicles: {
          create: [{
            car_id: vehicle.id,
            vehicle_price: testData.total_price
          }]
        }
      },
      include: {
        car: true,
        vehicles: true
      }
    });
    
    console.log('\n✅✅✅ RESERVA CREADA EXITOSAMENTE VIA API SIMULATION ✅✅✅');
    console.log('ID:', booking.id);
    console.log('Número:', booking.booking_number);
    console.log('Cliente:', booking.customer_name);
    console.log('Vehículo:', booking.car.make, booking.car.model);
    console.log('Total:', booking.total_price);
    
    // Limpiar
    console.log('\n🗑️ Eliminando reserva de prueba...');
    await prisma.bookingVehicles.deleteMany({
      where: { booking_id: booking.id }
    });
    await prisma.carRentalBookings.delete({
      where: { id: booking.id }
    });
    console.log('✅ Limpieza completada');
    
    await prisma.$disconnect();
    
    console.log('\n✅ CONCLUSIÓN: El endpoint /api/bookings DEBERÍA funcionar correctamente');
    console.log('Si no funciona en el navegador, el problema está en:');
    console.log('1. Autenticación (session)');
    console.log('2. Formato de datos del frontend');
    console.log('3. Errores de JavaScript en el navegador');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code) console.error('Código:', error.code);
  }
}

testBookingsAPI();
