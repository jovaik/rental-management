require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function reimport() {
  console.log('═══════════════════════════════════════════');
  console.log('  REIMPORTACIÓN CORRECTA FEBRERO-MARZO');
  console.log('═══════════════════════════════════════════\n');

  // 1. BORRAR TODAS LAS RESERVAS MAL IMPORTADAS
  console.log('1. Eliminando reservas mal importadas...');
  
  // Primero eliminar relaciones
  await prisma.bookingVehicles.deleteMany({
    where: {
      booking: {
        pickup_date: {
          gte: new Date('2025-02-01'),
          lt: new Date('2025-04-01')
        }
      }
    }
  });
  
  await prisma.bookingDrivers.deleteMany({
    where: {
      booking: {
        pickup_date: {
          gte: new Date('2025-02-01'),
          lt: new Date('2025-04-01')
        }
      }
    }
  });
  
  // Luego las reservas
  const deleted = await prisma.carRentalBookings.deleteMany({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      }
    }
  });
  
  console.log(`   ✓ Eliminadas ${deleted.count} reservas\n`);

  // 2. LEER CSV ORIGINAL
  console.log('2. Leyendo datos del CSV...');
  const csvPath = '/home/ubuntu/Uploads/documents (6).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  
  // Filtrar solo febrero y marzo
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const record = {};
    headers.forEach((header, idx) => {
      record[header.trim()] = values[idx] ? values[idx].trim() : '';
    });
    
    const pickupDate = new Date(record['pickup date']);
    if (pickupDate >= new Date('2025-02-01') && pickupDate < new Date('2025-04-01')) {
      records.push(record);
    }
  }
  
  console.log(`   ✓ Encontrados ${records.length} registros\n`);

  // 3. OBTENER VEHÍCULO PARA ASIGNAR
  const vehicle = await prisma.carRentalCars.findFirst();
  if (!vehicle) {
    console.log('   ❌ No hay vehículos en el sistema');
    return;
  }
  console.log(`   Vehículo a usar: ${vehicle.brand} ${vehicle.model} (${vehicle.registration})\n`);

  // 4. IMPORTAR CORRECTAMENTE
  console.log('3. Importando reservas correctamente...');
  
  let imported = 0;
  const bookingsByContract = new Map();
  
  for (const record of records) {
    const contractNumber = record['contract number'];
    
    // Agrupar por contrato (ignorar documentos individuales)
    if (!bookingsByContract.has(contractNumber)) {
      bookingsByContract.set(contractNumber, record);
    }
  }
  
  console.log(`   Contratos únicos: ${bookingsByContract.size}\n`);
  
  for (const [contractNumber, record] of bookingsByContract) {
    const email = record['email'];
    const pickupDate = new Date(record['pickup date']);
    const returnDate = new Date(record['return date']);
    const totalPrice = parseFloat(record['total price'] || '0');
    
    // Extraer nombre del email
    const emailPrefix = email.split('@')[0];
    const nameParts = emailPrefix.split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Cliente';
    const lastName = nameParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Importado';
    
    // Crear o encontrar cliente
    let customer = await prisma.carRentalCustomers.findUnique({
      where: { email }
    });
    
    if (!customer) {
      customer = await prisma.carRentalCustomers.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          email,
          phone: record['phone'] || '',
          id_type: 'passport',
          id_number: '',
          country: 'Unknown',
          birth_date: new Date('1990-01-01')
        }
      });
    }
    
    // Crear reserva
    const booking = await prisma.carRentalBookings.create({
      data: {
        booking_number: `IMP-${pickupDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(16).substr(2, 4).toUpperCase()}`,
        customer_id: customer.id,
        car_id: vehicle.id,
        pickup_date: pickupDate,
        return_date: returnDate,
        total_price: totalPrice,
        status: 'confirmed'
      }
    });
    
    // Asignar vehículo
    await prisma.bookingVehicles.create({
      data: {
        booking_id: booking.id,
        car_id: vehicle.id,
        vehicle_price: totalPrice,
        notes: 'Importado correctamente'
      }
    });
    
    imported++;
    console.log(`   ✓ ${imported}/${bookingsByContract.size} - ${firstName} ${lastName} (${pickupDate.toISOString().split('T')[0]})`);
  }
  
  console.log(`\n✅ Importadas ${imported} reservas correctamente\n`);

  // 5. VERIFICAR
  console.log('4. Verificación final...');
  const final = await prisma.carRentalBookings.findMany({
    where: {
      pickup_date: {
        gte: new Date('2025-02-01'),
        lt: new Date('2025-04-01')
      }
    },
    include: {
      customer: true,
      vehicles: {
        include: { car: true }
      }
    }
  });
  
  console.log('═══════════════════════════════════════════');
  console.log('           RESULTADO FINAL');
  console.log('═══════════════════════════════════════════\n');
  console.log(`✓ Total reservas: ${final.length}`);
  console.log(`✓ Con nombre: ${final.filter(b => b.customer && b.customer.first_name).length}`);
  console.log(`✓ Con vehículo: ${final.filter(b => b.vehicles.length > 0).length}`);
  console.log(`✓ Con número expediente: ${final.filter(b => b.booking_number).length}\n`);
  
  await prisma.$disconnect();
}

reimport().catch(e => {
  console.error('ERROR:', e);
  console.error(e.stack);
  process.exit(1);
});
