require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CREANDO VEHÍCULO DE PRUEBA ===\n');
  
  const vehicle = await prisma.carRentalCars.create({
    data: {
      registration_number: 'TEST1234',
      make: 'Honda',
      model: 'Forza 350',
      year: 2023,
      color: 'Negro',
      fuel_type: 'Gasolina',
      status: 'T', // Active
      mileage: 1200,
      condition_rating: 'Bueno'
    }
  });
  
  console.log('✅ Vehículo creado con ID:', vehicle.id);
  console.log('Matrícula:', vehicle.registration_number);
  console.log('Marca/Modelo:', vehicle.make, vehicle.model);
  console.log('\n=== VERIFICANDO VEHÍCULOS EN LA BASE DE DATOS ===\n');
  
  const allVehicles = await prisma.carRentalCars.findMany({
    orderBy: { created_at: 'desc' }
  });
  
  console.log(`Total de vehículos: ${allVehicles.length}\n`);
  allVehicles.forEach(v => {
    console.log(`- ${v.registration_number} | ${v.make} ${v.model} | Status: ${v.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
