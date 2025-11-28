require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const reservasRodeeo = [
  { nombre: "DREW", apellido: "GARRET", fechaContrato: "02/01/2025 10:58", total: 180 },
  { nombre: "TIMOTHY GABRIEL", apellido: "SHERLOCK", fechaContrato: "05/01/2025 13:43", total: 180 },
  { nombre: "ARNE", apellido: "SCHAUMONT", fechaContrato: "05/01/2025 15:43", total: 35 },
  { nombre: "RISTO", apellido: "HEIKINHEIMO", fechaContrato: "06/01/2025 18:34", total: 195 },
  { nombre: "TXABER", apellido: "BASAÑEZ BILBAO", fechaContrato: "11/01/2025 15:11", total: 70 },
  { nombre: "ALEXANDRE", apellido: "FRIAS MARQUES", fechaContrato: "12/01/2025 22:24", total: 300 },
  { nombre: "LUIS ALBERTO", apellido: "AGULLO MARTIN", fechaContrato: "13/01/2025 11:32", total: 90 },
  { nombre: "IVAN", apellido: "NIKOLOVSKI", fechaContrato: "13/01/2025 11:52", total: 200 },
  { nombre: "ALAIN", apellido: "CORMIER", fechaContrato: "13/01/2025 16:51", total: 200 },
  { nombre: "LUKAS", apellido: "JANBEN", fechaContrato: "13/01/2025 19:26", total: 300 },
  { nombre: "CLAIRE", apellido: "CUNNINGHAM", fechaContrato: "19/01/2025 20:30", total: 300 },
  { nombre: "WALTER ANTONIUS GERARDUS", apellido: "WISSENBURG", fechaContrato: "20/01/2025 16:07", total: 165 },
  { nombre: "CLAUDIO", apellido: "BORIO AGUERO", fechaContrato: "25/01/2025 11:59", total: 30 }
];

function parseDate(dateStr) {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');
  return new Date(year, month - 1, day, hour, minute);
}

function estimarFechaFin(fechaInicio) {
  const fin = new Date(fechaInicio);
  fin.setDate(fin.getDate() + 3);
  return fin;
}

async function importar(dryRun = true) {
  console.log(dryRun ? '🧪 DRY RUN\n' : '🚀 IMPORTANDO\n');
  
  let importadas = 0;
  let errores = 0;
  
  for (const reserva of reservasRodeeo) {
    try {
      const cliente = await prisma.carRentalCustomers.findFirst({
        where: {
          AND: [
            { first_name: { contains: reserva.nombre.split(' ')[0], mode: 'insensitive' } },
            { last_name: { contains: reserva.apellido.split(' ')[0], mode: 'insensitive' } }
          ]
        }
      });
      
      if (!cliente) {
        console.log(`❌ Cliente no encontrado: ${reserva.nombre} ${reserva.apellido}`);
        errores++;
        continue;
      }
      
      const fechaInicio = parseDate(reserva.fechaContrato);
      const fechaFin = estimarFechaFin(fechaInicio);
      
      if (dryRun) {
        console.log(`✅ [DRY RUN] ${cliente.first_name} ${cliente.last_name}`);
        console.log(`   ${fechaInicio.toISOString().split('T')[0]} → ${fechaFin.toISOString().split('T')[0]} | €${reserva.total}\n`);
      } else {
        const nuevaReserva = await prisma.carRentalBookings.create({
          data: {
            customer_id: cliente.id,
            customer_name: `${cliente.first_name} ${cliente.last_name}`,
            customer_email: cliente.email,
            customer_phone: cliente.phone,
            pickup_date: fechaInicio,
            return_date: fechaFin,
            total_price: parseFloat(reserva.total),
            status: 'completed',
            payment_status: 'paid',
            created_at: fechaInicio,
            updated_at: new Date()
          }
        });
        
        console.log(`✅ ${nuevaReserva.booking_number} - ${cliente.first_name} ${cliente.last_name}`);
      }
      
      importadas++;
      
    } catch (error) {
      console.error(`❌ ${reserva.nombre} ${reserva.apellido}: ${error.message}`);
      errores++;
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ ${dryRun ? 'Para importar' : 'Importadas'}: ${importadas}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📋 Total: ${reservasRodeeo.length}`);
  
  await prisma.$disconnect();
}

const dryRun = process.argv[2] !== '--real';
importar(dryRun);
