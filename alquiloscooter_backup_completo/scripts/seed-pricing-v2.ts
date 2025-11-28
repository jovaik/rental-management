
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding advanced pricing system...');

  // 1. Configuración de temporadas
  console.log('\n📅 Creating season configuration...');
  
  const highSeason = await prisma.carRentalSeasonConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      season_name: 'Temporada Alta',
      start_month: 4,  // 1 de abril
      start_day: 1,
      end_month: 9,    // 30 de septiembre
      end_day: 30,
      is_high_season: true
    }
  });

  const lowSeason = await prisma.carRentalSeasonConfig.upsert({
    where: { id: 2 },
    update: {},
    create: {
      season_name: 'Temporada Baja',
      start_month: 10,  // 1 de octubre
      start_day: 1,
      end_month: 3,     // 31 de marzo
      end_day: 31,
      is_high_season: false
    }
  });
  
  console.log('✓ Seasons configured');

  // 2. Upgrades/Add-ons
  console.log('\n🔧 Creating upgrades...');
  
  const upgrades = [
    {
      name: 'KM Ilimitados',
      description: 'Conduce sin límite de kilómetros',
      upgrade_type: 'unlimited_km',
      fee_per_day: 15.00,
      is_available: true,
      display_order: 1
    },
    {
      name: 'Segundo Conductor',
      description: 'Añade un conductor adicional a tu reserva',
      upgrade_type: 'second_driver',
      fee_per_day: 10.00,
      is_available: true,
      display_order: 2
    },
    {
      name: 'Soporte para Móvil',
      description: 'Soporte de teléfono móvil integrado',
      upgrade_type: 'mobile_support',
      fee_per_day: 3.00,
      is_available: true,
      display_order: 3
    },
    {
      name: 'Paquete Premium Completo',
      description: 'Incluye KM ilimitados, segundo conductor, GPS, soporte móvil y seguro completo',
      upgrade_type: 'full_package',
      fee_per_day: 35.00,
      is_available: true,
      display_order: 4
    },
    {
      name: 'GPS Navegador',
      description: 'Sistema de navegación GPS',
      upgrade_type: 'gps',
      fee_per_day: 5.00,
      is_available: true,
      display_order: 5
    }
  ];

  for (const upgrade of upgrades) {
    await prisma.carRentalUpgrades.upsert({
      where: { name: upgrade.name },
      update: upgrade,
      create: upgrade
    });
  }
  
  console.log('✓ Upgrades created');

  // 3. Extras (Servicio a domicilio, sillas infantiles, etc.)
  console.log('\n✨ Creating extras...');
  
  const extras = [
    {
      name: 'Servicio a Domicilio - Zona Cercana',
      description: 'Entrega y recogida a domicilio hasta 5 km',
      extra_type: 'home_delivery',
      pricing_type: 'fixed',
      distance_range_min: 0,
      distance_range_max: 5,
      price: 15.00,
      is_available: true,
      display_order: 1
    },
    {
      name: 'Servicio a Domicilio - Zona Media',
      description: 'Entrega y recogida a domicilio de 5 a 15 km',
      extra_type: 'home_delivery',
      pricing_type: 'fixed',
      distance_range_min: 5,
      distance_range_max: 15,
      price: 30.00,
      is_available: true,
      display_order: 2
    },
    {
      name: 'Servicio a Domicilio - Zona Lejana',
      description: 'Entrega y recogida a domicilio de 15 a 30 km',
      extra_type: 'home_delivery',
      pricing_type: 'fixed',
      distance_range_min: 15,
      distance_range_max: 30,
      price: 50.00,
      is_available: true,
      display_order: 3
    },
    {
      name: 'Recogida en Aeropuerto',
      description: 'Recogida y entrega en el aeropuerto',
      extra_type: 'airport_pickup',
      pricing_type: 'fixed',
      price: 35.00,
      is_available: true,
      display_order: 4
    },
    {
      name: 'Silla Infantil (0-4 años)',
      description: 'Silla de seguridad para bebés y niños pequeños',
      extra_type: 'child_seat',
      pricing_type: 'per_day',
      price: 5.00,
      is_available: true,
      display_order: 5
    },
    {
      name: 'Elevador Infantil (4-12 años)',
      description: 'Elevador de seguridad para niños',
      extra_type: 'child_seat',
      pricing_type: 'per_day',
      price: 3.00,
      is_available: true,
      display_order: 6
    },
    {
      name: 'Cadenas para Nieve',
      description: 'Cadenas para conducción en nieve',
      extra_type: 'snow_chains',
      pricing_type: 'per_day',
      price: 10.00,
      is_available: true,
      display_order: 7
    }
  ];

  for (const extra of extras) {
    await prisma.carRentalExtras.create({
      data: extra
    });
  }
  
  console.log('✓ Extras created');

  // 4. Experiencias/Actividades
  console.log('\n🏄 Creating experiences...');
  
  const experiences = [
    {
      name: 'Excursión en Jet Ski',
      description: 'Disfruta de una emocionante aventura en jet ski por la costa',
      experience_type: 'jetski',
      price_per_hour: 80.00,
      duration_minutes: 60,
      max_participants: 2,
      min_age: 16,
      is_available: true,
      requires_booking: true,
      advance_booking_hours: 24,
      display_order: 1
    },
    {
      name: 'Paseo en Barco - Tour Costero',
      description: 'Tour guiado por la costa con vistas espectaculares',
      experience_type: 'boat_tour',
      price_per_hour: 150.00,
      duration_minutes: 120,
      max_participants: 8,
      min_age: 0,
      is_available: true,
      requires_booking: true,
      advance_booking_hours: 48,
      display_order: 2
    },
    {
      name: 'Parasailing',
      description: 'Vuela sobre el mar con increíbles vistas panorámicas',
      experience_type: 'parasailing',
      price_fixed: 60.00,
      duration_minutes: 15,
      max_participants: 2,
      min_age: 12,
      is_available: true,
      requires_booking: true,
      advance_booking_hours: 24,
      display_order: 3
    },
    {
      name: 'Ruta en Buggy',
      description: 'Aventura todoterreno en buggy por paisajes impresionantes',
      experience_type: 'buggy',
      price_per_hour: 100.00,
      duration_minutes: 120,
      max_participants: 4,
      min_age: 18,
      is_available: true,
      requires_booking: true,
      advance_booking_hours: 24,
      display_order: 4
    },
    {
      name: 'Excursión en Quad',
      description: 'Recorre caminos de montaña en quad',
      experience_type: 'quad',
      price_per_hour: 70.00,
      duration_minutes: 90,
      max_participants: 2,
      min_age: 16,
      is_available: true,
      requires_booking: true,
      advance_booking_hours: 12,
      display_order: 5
    },
    {
      name: 'Arrastrables Acuáticos',
      description: 'Diversión extrema con sofá y banana boat',
      experience_type: 'towables',
      price_per_hour: 50.00,
      duration_minutes: 30,
      max_participants: 6,
      min_age: 8,
      is_available: true,
      requires_booking: true,
      advance_booking_hours: 12,
      display_order: 6
    }
  ];

  for (const experience of experiences) {
    await prisma.carRentalExperiences.create({
      data: experience
    });
  }
  
  console.log('✓ Experiences created');

  // 5. Actualizar Pricing Groups con nuevo esquema
  console.log('\n💰 Updating pricing groups...');
  
  // Eliminar grupos antiguos si existen
  await prisma.carRentalPricingGroups.deleteMany({});

  const pricingGroups = [
    {
      name: 'Grupo 1 - Scooters Económicos',
      description: 'Scooters 50cc ideales para ciudad',
      vehicle_category: 'scooter_economy',
      // Precios diarios base (temporada alta)
      price_1_3_days: 25.00,
      price_4_7_days: 22.00,
      price_8_plus_days: 20.00,
      // Suscripciones
      price_monthly_high: 500.00,  // Solo temporada alta
      price_monthly_low: 250.00,   // Solo temporada baja
      price_annual_full: 200.00,   // Todo el año (precio por mes)
      // Mínimos
      min_months_high_season: 3,
      min_months_low_season: 1,
      min_months_full_year: 12,
      // Multiplicador temporada baja
      low_season_multiplier: 0.5,
      // Otros
      included_km_per_day: 100,
      extra_km_charge: 0.10,
      deposit_amount: 200.00,
      status: 'active'
    },
    {
      name: 'Grupo 2 - Scooters Premium',
      description: 'Scooters 125cc con más potencia y confort',
      vehicle_category: 'scooter_premium',
      price_1_3_days: 35.00,
      price_4_7_days: 32.00,
      price_8_plus_days: 30.00,
      price_monthly_high: 700.00,
      price_monthly_low: 350.00,
      price_annual_full: 300.00,
      min_months_high_season: 3,
      min_months_low_season: 1,
      min_months_full_year: 12,
      low_season_multiplier: 0.5,
      included_km_per_day: 150,
      extra_km_charge: 0.12,
      deposit_amount: 300.00,
      status: 'active'
    },
    {
      name: 'Grupo 3 - Motos Deportivas',
      description: 'Motos deportivas 300cc+',
      vehicle_category: 'motorcycle_sport',
      price_1_3_days: 50.00,
      price_4_7_days: 45.00,
      price_8_plus_days: 40.00,
      price_monthly_high: 1000.00,
      price_monthly_low: 500.00,
      price_annual_full: 450.00,
      min_months_high_season: 3,
      min_months_low_season: 1,
      min_months_full_year: 12,
      low_season_multiplier: 0.5,
      included_km_per_day: 200,
      extra_km_charge: 0.15,
      deposit_amount: 500.00,
      status: 'active'
    },
    {
      name: 'Grupo 4 - Coches Económicos',
      description: 'Coches compactos ideales para ciudad',
      vehicle_category: 'car_economy',
      price_1_3_days: 45.00,
      price_4_7_days: 40.00,
      price_8_plus_days: 35.00,
      price_monthly_high: 900.00,
      price_monthly_low: 450.00,
      price_annual_full: 400.00,
      min_months_high_season: 3,
      min_months_low_season: 1,
      min_months_full_year: 12,
      low_season_multiplier: 0.55,
      included_km_per_day: 150,
      extra_km_charge: 0.15,
      deposit_amount: 400.00,
      status: 'active'
    },
    {
      name: 'Grupo 5 - Coches Familiares',
      description: 'Coches espaciosos para familias',
      vehicle_category: 'car_family',
      price_1_3_days: 60.00,
      price_4_7_days: 55.00,
      price_8_plus_days: 50.00,
      price_monthly_high: 1200.00,
      price_monthly_low: 600.00,
      price_annual_full: 550.00,
      min_months_high_season: 3,
      min_months_low_season: 1,
      min_months_full_year: 12,
      low_season_multiplier: 0.55,
      included_km_per_day: 200,
      extra_km_charge: 0.18,
      deposit_amount: 500.00,
      status: 'active'
    }
  ];

  for (const group of pricingGroups) {
    await prisma.carRentalPricingGroups.create({
      data: group
    });
    console.log(`✓ Created pricing group: ${group.name}`);
  }

  console.log('\n✅ Advanced pricing system seeded successfully!');
  console.log('\n📋 Summary:');
  console.log('   - 2 seasons configured');
  console.log('   - 5 upgrades/add-ons created');
  console.log('   - 7 extras created');
  console.log('   - 6 experiences created');
  console.log('   - 5 pricing groups created');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
