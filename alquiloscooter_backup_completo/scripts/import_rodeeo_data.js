require('dotenv').config(); // Cargar variables de entorno
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Usar el cliente de Prisma directamente
const prisma = new PrismaClient();

// ====================================
// CONFIGURACIÓN
// ====================================
const CSV_FILE = '/home/ubuntu/Uploads/documents (5).csv';
const DRY_RUN = false; // IMPORTACIÓN REAL

// ====================================
// FUNCIONES AUXILIARES
// ====================================

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(';').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

function parseDate(dateStr) {
  if (!dateStr) return new Date();
  // Formato: DD/MM/YYYY HH:mm
  const [datePart, timePart] = dateStr.split(' ');
  if (!datePart) return new Date();
  const [day, month, year] = datePart.split('/');
  const [hours, minutes] = timePart ? timePart.split(':') : ['12', '00'];
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
}

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  return parseFloat(amountStr.replace(',', '.').trim()) || 0;
}

// ====================================
// IMPORTACIÓN
// ====================================

async function importReservations() {
  console.log('='.repeat(60));
  console.log('IMPORTACIÓN DE RESERVAS DESDE RODEEO');
  console.log('='.repeat(60));
  console.log(`Modo: ${DRY_RUN ? '🔍 DRY RUN (sin cambios)' : '✅ IMPORTACIÓN REAL'}`);
  console.log('');

  // Leer CSV
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCSV(csvContent);
  
  console.log(`📄 Total de filas en CSV: ${rows.length}`);
  console.log('');

  // Filtrar solo las reservas válidas (tipo "Factura" o similares)
  const validReservations = rows.filter(row => 
    row.type && row.customer_first_name && row.reference
  );
  
  console.log(`📋 Reservas válidas para importar: ${validReservations.length}`);
  console.log('');

  const results = {
    clientsCreated: 0,
    clientsExisting: 0,
    reservationsCreated: 0,
    skipped: 0,
    errors: []
  };

  for (let i = 0; i < validReservations.length; i++) {
    const row = validReservations[i];
    const reservationNumber = row.reference || `RODEEO-${i + 1}`;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Procesando ${i + 1}/${validReservations.length}: ${reservationNumber}`);
    console.log(`${'='.repeat(60)}`);

    try {
      // 1. CREAR/OBTENER CLIENTE
      const firstName = row.customer_first_name || 'Cliente';
      const lastName = row.customer_last_name || 'Desconocido';
      const email = `rodeeo_${reservationNumber.toLowerCase()}@imported.com`;
      
      console.log(`\n👤 Cliente: ${firstName} ${lastName}`);
      console.log(`   Email generado: ${email}`);
      console.log(`   Tipo: ${row.customer_type || 'individual'}`);

      let customer;
      if (!DRY_RUN) {
        // Buscar cliente existente por email
        customer = await prisma.carRentalCustomers.findUnique({
          where: { email }
        });

        if (!customer) {
          // Crear nuevo cliente
          customer = await prisma.carRentalCustomers.create({
            data: {
              first_name: firstName,
              last_name: lastName,
              email,
              phone: '',
              document_type: 'DNI',
              document_number: `RODEEO-${reservationNumber}`,
              birth_date: new Date('1990-01-01'),
              address: 'Dirección pendiente',
              city: 'Ciudad pendiente',
              zip_code: '00000',
              country: 'ES'
            }
          });
          console.log(`   ✅ Cliente creado (ID: ${customer.id})`);
          results.clientsCreated++;
        } else {
          console.log(`   ℹ️  Cliente ya existe (ID: ${customer.id})`);
          results.clientsExisting++;
        }
      } else {
        console.log(`   [DRY RUN] Se crearía/obtendría cliente`);
      }

      // 2. CREAR RESERVA
      const documentDate = parseDate(row.date);
      const totalAmount = parseAmount(row.total_incl_taxes);
      const taxAmount = parseAmount(row.total_taxes);
      const baseAmount = parseAmount(row.total_excl_taxes);

      console.log(`\n📅 Reserva:`);
      console.log(`   Número: ${reservationNumber}`);
      console.log(`   Tipo: ${row.type}`);
      console.log(`   Fecha documento: ${documentDate.toLocaleString('es-ES')}`);
      console.log(`   Total (con IVA): ${totalAmount.toFixed(2)} €`);
      console.log(`   Base imponible: ${baseAmount.toFixed(2)} €`);
      console.log(`   IVA: ${taxAmount.toFixed(2)} €`);
      console.log(`   Vehículo: [VACÍO - Para asignar manualmente]`);
      console.log(`   Método de pago: ${row.payment_methods || 'No especificado'}`);

      if (!DRY_RUN && customer) {
        // Verificar si ya existe una reserva con este número
        const existingBooking = await prisma.carRentalBookings.findFirst({
          where: { booking_number: reservationNumber }
        });

        if (existingBooking) {
          console.log(`   ⚠️  Reserva ya existe (ID: ${existingBooking.id}) - OMITIDA`);
          results.skipped++;
        } else {
          // Crear fechas de recogida/devolución (por defecto, mismo día con 24h de diferencia)
          const pickupDate = documentDate;
          const returnDate = new Date(documentDate);
          returnDate.setHours(returnDate.getHours() + 24);

          const booking = await prisma.carRentalBookings.create({
            data: {
              booking_number: reservationNumber,
              customer_id: customer.id,
              // car_id: null, // Se asignará manualmente
              pickup_date: pickupDate,
              return_date: returnDate,
              pickup_location_id: 1, // Ubicación por defecto
              return_location_id: 1, // Ubicación por defecto
              status: 'COMPLETED',
              total_amount: totalAmount,
              paid_amount: totalAmount, // Asumimos que está pagado completamente
              pending_amount: 0,
              notes: `Importado desde Rodeeo
Tipo documento: ${row.type}
Fecha documento: ${row.date}
Método pago: ${row.payment_methods || 'No especificado'}
Base imponible: ${baseAmount.toFixed(2)} €
IVA: ${taxAmount.toFixed(2)} €
Referencia sesión: ${row.session_reference || 'N/A'}`
            }
          });
          console.log(`   ✅ Reserva creada (ID: ${booking.id})`);
          results.reservationsCreated++;
        }
      } else if (DRY_RUN) {
        console.log(`   [DRY RUN] Se crearía reserva`);
      }

    } catch (error) {
      console.error(`   ❌ Error procesando ${reservationNumber}:`, error.message);
      results.errors.push({
        reservation: reservationNumber,
        error: error.message
      });
    }
  }

  // RESUMEN FINAL
  console.log('\n\n' + '='.repeat(60));
  console.log('RESUMEN DE IMPORTACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Clientes nuevos creados: ${results.clientsCreated}`);
  console.log(`ℹ️  Clientes ya existentes: ${results.clientsExisting}`);
  console.log(`✅ Reservas creadas: ${results.reservationsCreated}`);
  console.log(`⚠️  Reservas omitidas (duplicadas): ${results.skipped}`);
  console.log(`❌ Errores: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\nDetalles de errores:');
    results.errors.forEach(err => {
      console.log(`  - ${err.reservation}: ${err.error}`);
    });
  }
  
  console.log('='.repeat(60));
  
  if (!DRY_RUN) {
    console.log('\n✅ IMPORTACIÓN COMPLETADA');
    console.log('');
    console.log('📝 PRÓXIMOS PASOS:');
    console.log('   1. Asignar vehículos manualmente desde el panel de reservas');
    console.log('   2. Ajustar fechas de recogida/devolución si es necesario');
    console.log('   3. Verificar que los datos de los clientes sean correctos');
  }
}

// Ejecutar
importReservations()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
