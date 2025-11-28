const fetch = require('node-fetch');

async function testWidgetAPI() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 7);
    
    const url = `http://localhost:3000/api/booking-widget/search?pickupDate=${tomorrow.toISOString()}&returnDate=${dayAfter.toISOString()}&carType=all`;
    
    console.log("Testing URL:", url);
    console.log("");
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Vehicles found: ${data.length || 0}`);
    console.log("");
    
    if (data.length > 0) {
      console.log("=== PRIMEROS 3 VEHÍCULOS ===\n");
      data.slice(0, 3).forEach((v, i) => {
        console.log(`${i + 1}. ${v.brand} ${v.model}`);
        console.log(`   imageUrl: ${v.imageUrl ? 'SÍ ✓' : 'NO ✗'}`);
        if (v.imageUrl) {
          console.log(`   URL: ${v.imageUrl.substring(0, 80)}...`);
        }
        console.log(`   images array: ${v.images?.length || 0} fotos`);
        console.log("");
      });
    } else {
      console.log("⚠️  NO SE ENCONTRARON VEHÍCULOS");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testWidgetAPI();
