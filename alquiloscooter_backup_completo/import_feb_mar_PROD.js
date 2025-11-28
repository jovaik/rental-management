require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// Mapa de estados
const statusMap = {
  'Pending': 'PENDING',
  'Confirmed': 'CONFIRMED',
  'In Progress': 'IN_PROGRESS',
  'Completed': 'COMPLETED',
  'Cancelled': 'CANCELLED'
};

// Mapa de métodos de pago
const paymentMethodMap = {
  'Cash': 'CASH',
  'Card': 'CARD',
  'Transfer': 'TRANSFER',
  'Bizum': 'BIZUM',
  'Mixed': 'MIXED'
};

// Función para parsear fechas
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    // Intentar formato DD-MM-YYYY HH:mm
    const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (parts) {
      const [_, day, month, year, hour, minute] = parts;
      return new Date(year, month - 1, day, hour, minute);
    }
    
    // Intentar formato ISO
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function importReservations() {
  try {
    console.log('🚀 Iniciando importación en PRODUCCIÓN...\n');
    
    // Leer archivo CSV
    const csvContent = fs.readFileSync('/home/ubuntu/reservas_febrero_marzo_2025.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });
    
    console.log(`📄 Archivo leído: ${records.length} registros encontrados\n`);
    
    let imported = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const record of records) {
      try {
        // Parsear fechas
        const startDate = parseDate(record.start_date);
        const endDate = parseDate(record.end_date);
        
        if (!startDate || !endDate) {
          console.log(`⚠️  Fechas inválidas para contrato ${record.contract_number}`);
          skipped++;
          continue;
        }
        
        // Buscar cliente
        const customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { email: record.customer_email },
              { phone: record.customer_phone }
            ]
          }
        });
        
        if (!customer) {
          console.log(`⚠️  Cliente no encontrado: ${record.customer_name}`);
          skipped++;
          continue;
        }
        
        // Buscar vehículo
        const vehicle = await prisma.vehicle.findFirst({
          where: { license_plate: record.vehicle_license }
        });
        
        if (!vehicle) {
          console.log(`⚠️  Vehículo no encontrado: ${record.vehicle_license}`);
          skipped++;
          continue;
        }
        
        // Crear reserva
        const booking = await prisma.booking.create({
          data: {
            booking_number: record.contract_number || `IMP-${Date.now()}`,
            customer_id: customer.id,
            vehicle_id: vehicle.id,
            start_date: startDate,
            end_date: endDate,
            pickup_location: record.pickup_location || 'Importado',
            dropoff_location: record.dropoff_location || 'Importado',
            status: statusMap[record.status] || 'CONFIRMED',
            total_price: parseFloat(record.total_price) || 0,
            paid_amount: parseFloat(record.paid_amount) || 0,
            payment_method: paymentMethodMap[record.payment_method] || 'CASH',
            payment_status: record.payment_status || 'PENDING',
            notes: record.notes || null,
            contract_signed: record.contract_signed === 'true' || record.contract_signed === '1',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        console.log(`✅ Importada: ${record.contract_number} - ${customer.name}`);
        imported++;
        
      } catch (error) {
        console.error(`❌ Error al importar ${record.contract_number}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Importadas correctamente: ${imported}`);
    console.log(`⚠️  Omitidas: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('='.repeat(60));
    
    // Verificar total
    const totalBookings = await prisma.booking.count();
    console.log(`\n📊 Total de reservas en PROD: ${totalBookings}\n`);
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReservations();
