import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding new features...');

  // Create Working Hours (Mon-Sat: 9:00-19:00, Sunday: closed)
  console.log('Creating working hours...');
  const workingHoursData = [
    { day_of_week: 0, is_working_day: false, opening_time: '00:00', closing_time: '00:00' }, // Sunday
    { day_of_week: 1, is_working_day: true, opening_time: '09:00', closing_time: '19:00' },  // Monday
    { day_of_week: 2, is_working_day: true, opening_time: '09:00', closing_time: '19:00' },  // Tuesday
    { day_of_week: 3, is_working_day: true, opening_time: '09:00', closing_time: '19:00' },  // Wednesday
    { day_of_week: 4, is_working_day: true, opening_time: '09:00', closing_time: '19:00' },  // Thursday
    { day_of_week: 5, is_working_day: true, opening_time: '09:00', closing_time: '19:00' },  // Friday
    { day_of_week: 6, is_working_day: true, opening_time: '09:00', closing_time: '14:00' },  // Saturday
  ];

  for (const hours of workingHoursData) {
    await prisma.carRentalWorkingHours.upsert({
      where: { day_of_week: hours.day_of_week },
      update: hours,
      create: hours,
    });
  }
  console.log('✅ Working hours created');

  // Create Pricing Groups
  console.log('Creating pricing groups...');
  const pricingGroups = [
    {
      name: 'Económico',
      description: 'Vehículos económicos ideales para desplazamientos urbanos',
      vehicle_category: 'economy',
      base_price_per_day: 25.00,
      price_per_hour: 5.00,
      weekly_discount_percent: 15.00,
      monthly_discount_percent: 25.00,
      min_rental_days: 1,
      insurance_per_day: 8.00,
      deposit_amount: 200.00,
      extra_km_charge: 0.15,
      included_km_per_day: 150,
      status: 'active',
    },
    {
      name: 'Compacto',
      description: 'Vehículos compactos perfectos para ciudad y carretera',
      vehicle_category: 'compact',
      base_price_per_day: 35.00,
      price_per_hour: 7.00,
      weekly_discount_percent: 15.00,
      monthly_discount_percent: 25.00,
      min_rental_days: 1,
      insurance_per_day: 10.00,
      deposit_amount: 300.00,
      extra_km_charge: 0.18,
      included_km_per_day: 150,
      status: 'active',
    },
    {
      name: 'Familiar',
      description: 'Vehículos espaciosos para familias y grupos',
      vehicle_category: 'family',
      base_price_per_day: 50.00,
      price_per_hour: 10.00,
      weekly_discount_percent: 18.00,
      monthly_discount_percent: 30.00,
      min_rental_days: 1,
      insurance_per_day: 12.00,
      deposit_amount: 400.00,
      extra_km_charge: 0.20,
      included_km_per_day: 200,
      status: 'active',
    },
    {
      name: 'Premium',
      description: 'Vehículos de lujo y alta gama',
      vehicle_category: 'premium',
      base_price_per_day: 80.00,
      price_per_hour: 15.00,
      weekly_discount_percent: 20.00,
      monthly_discount_percent: 35.00,
      min_rental_days: 2,
      insurance_per_day: 18.00,
      deposit_amount: 800.00,
      extra_km_charge: 0.30,
      included_km_per_day: 250,
      status: 'active',
    },
    {
      name: 'Furgoneta',
      description: 'Furgonetas para transporte de mercancías o grupos grandes',
      vehicle_category: 'van',
      base_price_per_day: 60.00,
      price_per_hour: 12.00,
      weekly_discount_percent: 20.00,
      monthly_discount_percent: 30.00,
      min_rental_days: 1,
      insurance_per_day: 15.00,
      deposit_amount: 500.00,
      extra_km_charge: 0.25,
      included_km_per_day: 200,
      status: 'active',
    },
  ];

  for (const group of pricingGroups) {
    await prisma.carRentalPricingGroups.upsert({
      where: { name: group.name },
      update: group,
      create: group,
    });
  }
  console.log('✅ Pricing groups created');

  // Create Sample Customers
  console.log('Creating sample customers...');
  const customers = [
    {
      first_name: 'María',
      last_name: 'García López',
      email: 'maria.garcia@email.com',
      phone: '+34 612 345 678',
      address: 'Calle Mayor 123, 3º A',
      city: 'Madrid',
      state: 'Madrid',
      country: 'España',
      postal_code: '28013',
      dni_nie: '12345678A',
      driver_license: 'B12345678',
      customer_type: 'individual',
      status: 'active',
    },
    {
      first_name: 'Juan',
      last_name: 'Martínez Pérez',
      email: 'juan.martinez@email.com',
      phone: '+34 623 456 789',
      address: 'Avenida de la Constitución 45, 2º B',
      city: 'Barcelona',
      state: 'Barcelona',
      country: 'España',
      postal_code: '08001',
      dni_nie: '23456789B',
      driver_license: 'B23456789',
      customer_type: 'individual',
      status: 'active',
    },
    {
      first_name: 'Ana',
      last_name: 'Rodríguez Sánchez',
      email: 'ana.rodriguez@email.com',
      phone: '+34 634 567 890',
      address: 'Plaza España 7, 1º C',
      city: 'Valencia',
      state: 'Valencia',
      country: 'España',
      postal_code: '46001',
      dni_nie: '34567890C',
      driver_license: 'B34567890',
      customer_type: 'individual',
      status: 'active',
    },
    {
      first_name: 'Carlos',
      last_name: 'López Fernández',
      email: 'carlos.lopez@empresa.com',
      phone: '+34 645 678 901',
      address: 'Polígono Industrial Sur, Nave 12',
      city: 'Sevilla',
      state: 'Sevilla',
      country: 'España',
      postal_code: '41010',
      dni_nie: '45678901D',
      customer_type: 'business',
      company_name: 'Transportes López S.L.',
      tax_id: 'B12345678',
      status: 'active',
    },
  ];

  for (const customer of customers) {
    await prisma.carRentalCustomers.upsert({
      where: { email: customer.email },
      update: customer,
      create: customer,
    });
  }
  console.log('✅ Sample customers created');

  console.log('✅ All new features seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding new features:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
