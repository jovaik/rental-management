
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding vehicle categories...');

  // Crear categorías de vehículos
  const categories = [
    { name: 'Scooter', description: 'Scooters y ciclomotores', display_order: 1, icon: 'bike' },
    { name: 'Motocicleta', description: 'Motocicletas de diferentes cilindradas', display_order: 2, icon: 'bike' },
    { name: 'Coche Económico', description: 'Coches pequeños y económicos', display_order: 3, icon: 'car' },
    { name: 'Coche Familiar', description: 'Coches medianos para familias', display_order: 4, icon: 'car' },
    { name: 'Coche Premium', description: 'Coches de gama alta', display_order: 5, icon: 'car' },
    { name: 'Coche SUV', description: 'SUVs y todoterrenos', display_order: 6, icon: 'truck' },
    { name: 'Furgoneta', description: 'Furgonetas y vehículos comerciales', display_order: 7, icon: 'truck' },
  ];

  for (const category of categories) {
    await prisma.carRentalVehicleCategories.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    console.log(`✓ Created/Updated category: ${category.name}`);
  }

  // Obtener las categorías creadas
  const scooterCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Scooter' } });
  const motoCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Motocicleta' } });
  const economicoCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Coche Económico' } });
  const familiarCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Coche Familiar' } });
  const premiumCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Coche Premium' } });
  const suvCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Coche SUV' } });
  const furgonetaCategory = await prisma.carRentalVehicleCategories.findUnique({ where: { name: 'Furgoneta' } });

  console.log('✅ Vehicle categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
