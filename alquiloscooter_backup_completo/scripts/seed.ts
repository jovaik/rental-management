
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.carRentalUsers.upsert({
    where: { email: 'admin@rental.com' },
    update: {},
    create: {
      email: 'admin@rental.com',
      password: adminPassword,
      firstname: 'Admin',
      lastname: 'Usuario',
      role: 'admin',
      status: 'T' as const,
      username: 'admin'
    },
  });

  console.log('✅ Usuario administrador creado:', admin.email);

  // Crear técnico de mantenimiento
  const techPassword = await bcrypt.hash('tech123', 10);
  
  const technician = await prisma.carRentalUsers.upsert({
    where: { email: 'tecnico@rental.com' },
    update: {},
    create: {
      email: 'tecnico@rental.com',
      password: techPassword,
      firstname: 'Juan',
      lastname: 'Técnico',
      role: 'technician',
      status: 'T' as const,
      username: 'tecnico'
    },
  });

  console.log('✅ Técnico creado:', technician.email);

  // Crear ubicación por defecto
  const location = await prisma.carRentalLocations.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Sede Principal',
      address: 'Calle Principal 123',
      phone: '123-456-7890',
      email: 'info@rental.com',
      status: 'T' as const
    },
  });

  console.log('✅ Ubicación creada:', location.name);

  // Crear vehículos de ejemplo
  const vehicles = [
    {
      id: 1,
      registration_number: 'ABC-123',
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      color: 'Rojo',
      vin: 'JTDBR32E050012345',
      fuel_type: 'gasoline',
      transmission_type: 'manual',
      seating_capacity: 5,
      mileage: 15000,
      condition_rating: 'excellent',
      status: 'T' as const,
      location_id: location.id
    },
    {
      id: 2,
      registration_number: 'XYZ-456',
      make: 'Honda',
      model: 'Civic',
      year: 2024,
      color: 'Azul',
      vin: 'JHMFC1F16L0012345',
      fuel_type: 'gasoline',
      transmission_type: 'automatic',
      seating_capacity: 5,
      mileage: 8000,
      condition_rating: 'excellent',
      status: 'T' as const,
      location_id: location.id
    },
    {
      id: 3,
      registration_number: 'MBZ-789',
      make: 'Mercedes',
      model: 'C-Class',
      year: 2023,
      color: 'Negro',
      vin: 'WDDGF8AB5L0012345',
      fuel_type: 'gasoline',
      transmission_type: 'automatic',
      seating_capacity: 5,
      mileage: 12000,
      condition_rating: 'good',
      status: 'T' as const,
      location_id: location.id
    }
  ];

  for (const vehicleData of vehicles) {
    const vehicle = await prisma.carRentalCars.upsert({
      where: { id: vehicleData.id },
      update: {},
      create: vehicleData,
    });
    console.log(`✅ Vehículo creado: ${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
  }

  // Crear reservas de ejemplo
  const bookings = [
    {
      car_id: 1,
      customer_name: 'María González',
      customer_email: 'maria@email.com',
      customer_phone: '+34-600-123-456',
      pickup_date: new Date('2024-09-20'),
      return_date: new Date('2024-09-25'),
      total_price: 250.00,
      status: 'confirmed'
    },
    {
      car_id: 2,
      customer_name: 'Carlos Martínez',
      customer_email: 'carlos@email.com',
      customer_phone: '+34-600-987-654',
      pickup_date: new Date('2024-09-28'),
      return_date: new Date('2024-10-02'),
      total_price: 300.00,
      status: 'confirmed'
    }
  ];

  for (const bookingData of bookings) {
    const booking = await prisma.carRentalBookings.create({
      data: bookingData,
    });
    console.log(`✅ Reserva creada para: ${booking.customer_name}`);
  }

  // Crear mantenimiento de ejemplo
  const maintenanceRecords = [
    {
      car_id: 1,
      maintenance_type: 'preventive',
      title: 'Cambio de aceite y filtros',
      description: 'Mantenimiento preventivo programado - cambio de aceite, filtro de aire y filtro de aceite',
      scheduled_date: new Date('2024-10-01'),
      status: 'scheduled',
      priority: 'medium',
      estimated_duration_hours: 2.5,
      technician_id: technician.id,
      workshop_location: 'Taller Principal',
      created_by: admin.id
    },
    {
      car_id: 3,
      maintenance_type: 'corrective',
      title: 'Reparación sistema eléctrico',
      description: 'Revisión y reparación de luces traseras intermitentes',
      scheduled_date: new Date('2024-09-30'),
      completed_date: new Date('2024-09-30'),
      status: 'completed',
      priority: 'high',
      estimated_duration_hours: 4.0,
      actual_duration_hours: 3.5,
      technician_id: technician.id,
      workshop_location: 'Taller Principal',
      created_by: admin.id
    }
  ];

  for (const maintenanceData of maintenanceRecords) {
    const maintenance = await prisma.carRentalVehicleMaintenance.create({
      data: maintenanceData,
    });
    console.log(`✅ Mantenimiento creado: ${maintenance.title}`);
  }

  // Crear gastos de mantenimiento de ejemplo
  const expenses = [
    {
      maintenance_id: 2, // Para el mantenimiento completado
      expense_category: 'parts',
      item_name: 'Bombillas LED traseras',
      description: 'Kit de bombillas LED para luces traseras Mercedes C-Class',
      quantity: 2,
      unit_price: 45.00,
      total_price: 90.00,
      supplier: 'AutoParts Pro',
      invoice_number: 'INV-2024-001',
      purchase_date: new Date('2024-09-29')
    },
    {
      maintenance_id: 2,
      expense_category: 'labor',
      item_name: 'Mano de obra técnica',
      description: 'Instalación y pruebas sistema eléctrico',
      quantity: 3.5,
      unit_price: 25.00,
      total_price: 87.50,
      supplier: 'Taller Interno',
      purchase_date: new Date('2024-09-30')
    }
  ];

  for (const expenseData of expenses) {
    const expense = await prisma.carRentalMaintenanceExpenses.create({
      data: expenseData,
    });
    console.log(`✅ Gasto de mantenimiento creado: ${expense.item_name}`);
  }

  // Crear eventos de calendario
  const calendarEvents = [
    {
      event_type: 'booking',
      reference_id: 1,
      car_id: 1,
      location_id: location.id,
      title: 'Reserva: María González - Toyota Corolla',
      description: 'Reserva confirmada del vehículo ABC-123',
      start_datetime: new Date('2024-09-20T09:00:00'),
      end_datetime: new Date('2024-09-25T17:00:00'),
      color: '#10b981',
      status: 'confirmed',
      created_by: admin.id
    },
    {
      event_type: 'maintenance',
      reference_id: 1,
      car_id: 1,
      location_id: location.id,
      title: 'Mantenimiento: Cambio de aceite - Toyota Corolla',
      description: 'Mantenimiento preventivo programado',
      start_datetime: new Date('2024-10-01T08:00:00'),
      end_datetime: new Date('2024-10-01T10:30:00'),
      color: '#f59e0b',
      status: 'scheduled',
      created_by: admin.id,
      assigned_to: technician.id
    }
  ];

  for (const eventData of calendarEvents) {
    const event = await prisma.carRentalCalendarEvents.create({
      data: eventData,
    });
    console.log(`✅ Evento de calendario creado: ${event.title}`);
  }

  console.log('🎉 Seeding completado exitosamente!');
  console.log('\n📊 Datos creados:');
  console.log('- 2 usuarios (admin + técnico)');
  console.log('- 1 ubicación');
  console.log('- 3 vehículos');
  console.log('- 2 reservas');
  console.log('- 2 registros de mantenimiento');
  console.log('- 2 gastos de mantenimiento');
  console.log('- 2 eventos de calendario');
  console.log('\n📧 Credenciales de acceso:');
  console.log('Admin - Email: admin@rental.com | Contraseña: admin123');
  console.log('Técnico - Email: tecnico@rental.com | Contraseña: tech123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
