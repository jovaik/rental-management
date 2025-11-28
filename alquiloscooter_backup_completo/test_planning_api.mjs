import dotenv from 'dotenv';
dotenv.config();

async function testAPI() {
  try {
    const startDate = new Date('2025-11-02');
    const endDate = new Date('2025-11-16');
    
    const url = `http://localhost:3000/api/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
    console.log('🔍 Llamando a:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('\n📋 TODAS LAS RESERVAS DEVUELTAS:', data.length);
    
    // Buscar específicamente la reserva #123
    const booking123 = data.find((b) => b.id === 123);
    
    if (booking123) {
      console.log('\n✅ RESERVA #123 ENCONTRADA:');
      console.log('  ID:', booking123.id);
      console.log('  car_id:', booking123.car_id, '(tipo:', typeof booking123.car_id + ')');
      console.log('  Cliente:', booking123.customer_name);
      console.log('  Inicio:', booking123.pickup_date);
      console.log('  Fin:', booking123.return_date);
      console.log('  Status:', booking123.status);
      console.log('  vehicles:', booking123.vehicles?.length || 0);
      if (booking123.vehicles && booking123.vehicles.length > 0) {
        booking123.vehicles.forEach((v, i) => {
          console.log(`    Vehículo ${i+1}:`, v.car_id, '(tipo:', typeof v.car_id + ')');
        });
      }
    } else {
      console.log('\n❌ RESERVA #123 NO DEVUELTA POR EL API');
      console.log('\nReservas del vehículo 72:');
      data.filter(b => b.car_id === 72 || b.car_id === '72').forEach(b => {
        console.log(`  #${b.id}: ${b.customer_name} (${b.pickup_date} - ${b.return_date})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
