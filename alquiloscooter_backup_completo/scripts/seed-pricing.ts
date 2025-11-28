
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding pricing groups...');

  // Create pricing groups
  const pricingGroups = [
    {
      name: 'Grupo Económico',
      description: 'Vehículos compactos y económicos perfectos para ciudad',
      vehicle_category: 'economy',
      price_1_3_days: 35,
      price_4_7_days: 30,
      price_8_plus_days: 25,
      price_monthly: 600,
      price_annual: 6000,
      high_season_multiplier: 1.3,
      low_season_multiplier: 0.9,
      min_months_subscription: 1,
      insurance_per_day: 10,
      deposit_amount: 200,
      extra_km_charge: 0.15,
      included_km_per_day: 100,
      status: 'active'
    },
    {
      name: 'Grupo Familiar',
      description: 'Vehículos espaciosos ideales para familias',
      vehicle_category: 'family',
      price_1_3_days: 50,
      price_4_7_days: 45,
      price_8_plus_days: 40,
      price_monthly: 900,
      price_annual: 9000,
      high_season_multiplier: 1.4,
      low_season_multiplier: 0.85,
      min_months_subscription: 1,
      insurance_per_day: 15,
      deposit_amount: 300,
      extra_km_charge: 0.20,
      included_km_per_day: 150,
      status: 'active'
    },
    {
      name: 'Grupo Premium',
      description: 'Vehículos de lujo y alta gama',
      vehicle_category: 'premium',
      price_1_3_days: 80,
      price_4_7_days: 75,
      price_8_plus_days: 70,
      price_monthly: 1500,
      price_annual: 15000,
      high_season_multiplier: 1.5,
      low_season_multiplier: 1.0,
      min_months_subscription: 2,
      insurance_per_day: 25,
      deposit_amount: 500,
      extra_km_charge: 0.30,
      included_km_per_day: 200,
      status: 'active'
    },
    {
      name: 'Grupo SUV',
      description: 'SUVs y vehículos todo terreno',
      vehicle_category: 'suv',
      price_1_3_days: 65,
      price_4_7_days: 60,
      price_8_plus_days: 55,
      price_monthly: 1200,
      price_annual: 12000,
      high_season_multiplier: 1.4,
      low_season_multiplier: 0.9,
      min_months_subscription: 1,
      insurance_per_day: 20,
      deposit_amount: 400,
      extra_km_charge: 0.25,
      included_km_per_day: 150,
      status: 'active'
    }
  ];

  for (const group of pricingGroups) {
    const existing = await prisma.carRentalPricingGroups.findUnique({
      where: { name: group.name }
    });

    if (!existing) {
      await prisma.carRentalPricingGroups.create({
        data: group
      });
      console.log(`✓ Created pricing group: ${group.name}`);
    } else {
      console.log(`- Pricing group already exists: ${group.name}`);
    }
  }

  // Assign vehicles to pricing groups (assuming vehicles exist)
  const vehicles = await prisma.carRentalCars.findMany();
  
  for (const vehicle of vehicles) {
    const make = vehicle.make?.toLowerCase() || '';
    let groupName = 'Grupo Económico';

    if (make.includes('bmw') || make.includes('mercedes') || make.includes('audi')) {
      groupName = 'Grupo Premium';
    } else if (make.includes('volkswagen') || make.includes('ford') || make.includes('seat')) {
      groupName = 'Grupo Familiar';
    } else if (make.includes('land') || make.includes('jeep') || make.includes('toyota')) {
      groupName = 'Grupo SUV';
    }

    const group = await prisma.carRentalPricingGroups.findUnique({
      where: { name: groupName }
    });

    if (group) {
      await prisma.carRentalCars.update({
        where: { id: vehicle.id },
        data: { pricing_group_id: group.id }
      });
      console.log(`✓ Assigned ${vehicle.registration_number} to ${groupName}`);
    }
  }

  console.log('✅ Pricing groups seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding pricing groups:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
