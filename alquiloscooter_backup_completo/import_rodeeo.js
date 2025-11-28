
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

// Función para extraer matrícula del campo vehículo
function extractMatricula(vehicleString) {
  // Formato: "Kymco DTX 125 N 56 6933NGT"
  // La matrícula suele ser las últimas palabras con el formato "N XX XXXXYYY"
  const match = vehicleString.match(/([A-Z]\s+\d+\s+[A-Z0-9]+(?:[A-Z]{3})?)\s*$/i);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback: buscar cualquier patrón de matrícula
  const matriculaMatch = vehicleString.match(/\b([A-Z]\s*\d+\s*[A-Z0-9]+)\b/i);
  return matriculaMatch ? matriculaMatch[1].trim() : null;
}

// Función para parsear fechas de Rodeeo
function parseFechas(fechaString) {
  // Formato: "20/11/2025 12:30  27/11/2025 12:30"
  // Usar regex para manejar espacios no separables
  const matches = fechaString.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/g);
  if (!matches || matches.length !== 2) {
    console.warn('Formato de fecha inválido: ' + fechaString);
    return { pickup: null, return: null };
  }
  
  // Parsear DD/MM/YYYY HH:MM
  const parseDate = (dateStr) => {
    const [datePart, timePart] = dateStr.split(/\s+/);
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = (timePart || '00:00').split(':');
    return new Date(year, month - 1, day, hour, minute);
  };
  
  return {
    pickup: parseDate(matches[0]),
    return: parseDate(matches[1])
  };
}

// Función para extraer precio
function extractPrice(priceString) {
  // Formato: "280,00 €"
  const match = priceString.match(/([0-9.,]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(',', '.'));
}

// Mapeo de estados de Rodeeo a AlquiloScooter
function mapStatus(rodeeoStatus) {
  const statusMap = {
    'En Curso': 'confirmed',
    'Devuelta': 'completed',
    'Finalizada': 'completed',
    'Borrador': 'pending',
    'Reservada': 'confirmed'
  };
  return statusMap[rodeeoStatus] || 'confirmed';
}

async function importReservations() {
  const filePath = '/home/ubuntu/Uploads/import rodeeo_alq 3h.xls';
  
  console.log('📖 Leyendo archivo Excel...\n');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  console.log('📊 Total de filas encontradas: ' + data.length + '\n');
  
  // Obtener todos los vehículos de la base de datos
  console.log('🚗 Cargando vehículos de la base de datos...');
  const vehicles = await prisma.carRentalCars.findMany({
    select: {
      id: true,
      registration_number: true,
      make: true,
      model: true
    }
  });
  
  // Crear mapa de matrículas
  const vehicleMap = new Map();
  vehicles.forEach(v => {
    const cleanPlate = v.registration_number.replace(/\s+/g, ' ').trim().toUpperCase();
    vehicleMap.set(cleanPlate, v);
  });
  
  console.log('✅ ' + vehicles.length + ' vehículos cargados\n');
  console.log('🔄 Procesando reservas...\n');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const report = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Validar que la fila tenga datos
    if (!row || row.length < 6 || !row[0]) {
      continue;
    }
    
    const [referencia, nombre, estado, fechas, total, vehiculoStr, canal] = row;
    
    try {
      // Extraer matrícula
      const matricula = extractMatricula(vehiculoStr);
      if (!matricula) {
        report.push('⚠️  Fila ' + (i + 1) + ': No se pudo extraer matrícula de "' + vehiculoStr + '"');
        skipped++;
        continue;
      }
      
      // Buscar vehículo
      let cleanMatricula = matricula.replace(/\s+/g, ' ').trim().toUpperCase();
      let vehicle = vehicleMap.get(cleanMatricula);
      
      // Intentar normalizar matrícula si no se encuentra
      if (!vehicle) {
        // Normalizar: "N 7" -> "N 07", "N33" -> "N 33"
        cleanMatricula = cleanMatricula.replace(/^([A-Z])\s*(\d{1,2})\s/, (match, letter, number) => {
          const paddedNumber = number.padStart(2, '0');
          return letter + ' ' + paddedNumber + ' ';
        });
        vehicle = vehicleMap.get(cleanMatricula);
      }
      
      // Si aún no se encuentra, buscar versión corta (solo "N XX")
      if (!vehicle) {
        const shortMatch = cleanMatricula.match(/^([A-Z]\s+\d{1,2})\s/);
        if (shortMatch) {
          const shortMatricula = shortMatch[1];
          vehicle = vehicleMap.get(shortMatricula);
          if (vehicle) {
            cleanMatricula = shortMatricula + ' (versión corta)';
          }
        }
      }
      
      if (!vehicle) {
        report.push('❌ Fila ' + (i + 1) + ': Vehículo no encontrado - Matrícula: "' + matricula + '" (normalizada: "' + cleanMatricula + '")');
        errors++;
        continue;
      }
      
      // Parsear fechas
      const { pickup, return: returnDate } = parseFechas(fechas);
      if (!pickup || !returnDate) {
        report.push('❌ Fila ' + (i + 1) + ': Fechas inválidas - "' + fechas + '"');
        errors++;
        continue;
      }
      
      // Extraer precio
      const price = extractPrice(total);
      
      // Buscar o crear cliente
      const nombreParts = nombre.trim().split(' ');
      const firstName = nombreParts[0] || nombre;
      const lastName = nombreParts.slice(1).join(' ') || '';
      
      let customer = await prisma.carRentalCustomers.findFirst({
        where: {
          first_name: firstName,
          last_name: lastName
        }
      });
      
      if (!customer) {
        customer = await prisma.carRentalCustomers.create({
          data: {
            first_name: firstName,
            last_name: lastName,
            email: firstName.toLowerCase() + '@imported.com',
            phone: '',
            phone_verified: false,
            customer_type: 'individual',
            status: 'active'
          }
        });
      }
      
      // Verificar si ya existe la reserva
      const existing = await prisma.carRentalBookings.findFirst({
        where: {
          booking_number: referencia
        }
      });
      
      if (existing) {
        report.push('⏭️  Fila ' + (i + 1) + ': Reserva ya existe - ' + referencia);
        skipped++;
        continue;
      }
      
      // Crear reserva
      const booking = await prisma.carRentalBookings.create({
        data: {
          booking_number: referencia,
          customer: {
            connect: { id: customer.id }
          },
          pickup_date: pickup,
          return_date: returnDate,
          total_price: price,
          status: mapStatus(estado)
        }
      });
      
      // Crear relación con vehículo
      await prisma.bookingVehicles.create({
        data: {
          booking: {
            connect: { id: booking.id }
          },
          car: {
            connect: { id: vehicle.id }
          },
          vehicle_price: price
        }
      });
      
      report.push('✅ Fila ' + (i + 1) + ': Importada - ' + referencia + ' | ' + nombre + ' | ' + vehicle.make + ' ' + vehicle.model + ' (' + matricula + ')');
      imported++;
      
    } catch (error) {
      report.push('❌ Fila ' + (i + 1) + ': Error - ' + error.message);
      errors++;
    }
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('='.repeat(80));
  console.log('✅ Importadas exitosamente: ' + imported);
  console.log('⏭️  Omitidas (ya existían): ' + skipped);
  console.log('❌ Errores: ' + errors);
  console.log('='.repeat(80));
  
  console.log('\n📋 DETALLE:\n');
  report.forEach(line => console.log(line));
  
  await prisma.$disconnect();
}

importReservations().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
