

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlanningData() {
  try {
    console.log('🌱 Seeding planning data...');

    // Create some sample bookings for existing vehicles
    const vehicles = await prisma.carRentalCars.findMany({
      where: { status: 'T' },
      take: 5
    });

    if (vehicles.length === 0) {
      console.log('No vehicles found. Please seed vehicles first.');
      return;
    }

    // Clear existing bookings (optional)
    await prisma.carRentalBookings.deleteMany();
    console.log('Cleared existing bookings');

    // Get current date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);

    // Create sample bookings
    const sampleBookings = [
      {
        car_id: vehicles[0].id,
        customer_name: 'Juan Pérez García',
        customer_email: 'juan.perez@email.com',
        customer_phone: '+34 666 123 456',
        pickup_date: today,
        return_date: dayAfterTomorrow,
        total_price: 90.00,
        status: 'confirmed'
      },
      {
        car_id: vehicles[1].id,
        customer_name: 'María González López',
        customer_email: 'maria.gonzalez@email.com',
        customer_phone: '+34 677 234 567',
        pickup_date: tomorrow,
        return_date: nextWeek,
        total_price: 180.00,
        status: 'confirmed'
      },
      {
        car_id: vehicles[2].id,
        customer_name: 'Carlos Rodríguez Silva',
        customer_email: 'carlos.rodriguez@email.com',
        customer_phone: '+34 688 345 678',
        pickup_date: dayAfterTomorrow,
        return_date: in10Days,
        total_price: 240.00,
        status: 'pending'
      }
    ];

    // Add more vehicles if available
    if (vehicles.length > 3) {
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      
      sampleBookings.push({
        car_id: vehicles[3].id,
        customer_name: 'Ana Martín Vega',
        customer_email: 'ana.martin@email.com',
        customer_phone: '+34 699 456 789',
        pickup_date: nextWeek,
        return_date: nextMonth,
        total_price: 690.00,
        status: 'confirmed'
      });
    }

    // Insert bookings
    for (const booking of sampleBookings) {
      await prisma.carRentalBookings.create({
        data: booking
      });
    }

    console.log(`✅ Created ${sampleBookings.length} sample bookings`);

    // Create some maintenance records to test different vehicle statuses
    const maintenanceRecords = [
      {
        car_id: vehicles.length > 4 ? vehicles[4].id : vehicles[0].id,
        maintenance_type: 'preventive',
        title: 'Mantenimiento Preventivo',
        description: 'Cambio de aceite y revisión general',
        scheduled_date: tomorrow,
        status: 'scheduled',
        priority: 'medium'
      }
    ];

    for (const maintenance of maintenanceRecords) {
      await prisma.carRentalVehicleMaintenance.create({
        data: maintenance
      });
    }

    console.log(`✅ Created ${maintenanceRecords.length} maintenance records`);

    console.log('🎉 Planning data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding planning data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlanningData();

