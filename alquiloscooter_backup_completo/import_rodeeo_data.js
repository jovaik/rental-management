require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Datos extraídos del CSV de Rodeeo (Enero 2025)
const reservasRodeeo = [
  {
    nombre: "DREW",
    apellido: "GARRET",
    fechaContrato: "02/01/2025 10:58",
    total: 180,
    sessionRef: "ea7f3a84"
  },
  {
    nombre: "TIMOTHY GABRIEL",
    apellido: "SHERLOCK",
    fechaContrato: "05/01/2025 13:43",
    total: 180,
    sessionRef: "17ca1f76"
  },
  {
    nombre: "ARNE",
    apellido: "SCHAUMONT",
    fechaContrato: "05/01/2025 15:43",
    total: 35,
    sessionRef: "5d696f70"
  },
  {
    nombre: "RISTO",
    apellido: "HEIKINHEIMO",
    fechaContrato: "06/01/2025 18:34",
    total: 195,
    sessionRef: "0c72f0a2"
  },
  {
    nombre: "TXABER",
    apellido: "BASAÑEZ BILBAO",
    fechaContrato: "11/01/2025 15:11",
    total: 70,
    sessionRef: "a2ba8d0e"
  },
  {
    nombre: "ALEXANDRE",
    apellido: "FRIAS MARQUES",
    fechaContrato: "12/01/2025 22:24",
    total: 300,
    sessionRef: "cd6f6738"
  },
  {
    nombre: "LUIS ALBERTO",
    apellido: "AGULLO MARTIN",
    fechaContrato: "13/01/2025 11:32",
    total: 90,
    sessionRef: "d4f3a8bf"
  },
  {
    nombre: "IVAN",
    apellido: "NIKOLOVSKI",
    fechaContrato: "13/01/2025 11:52",
    total: 200,
    sessionRef: "7de84a86"
  },
  {
    nombre: "ALAIN",
    apellido: "CORMIER",
    fechaContrato: "13/01/2025 16:51",
    total: 200,
    sessionRef: "3b5fc5dc"
  },
  {
    nombre: "LUKAS",
    apellido: "JANBEN",
    fechaContrato: "13/01/2025 19:26",
    total: 300,
    sessionRef: "07e51511"
  },
  {
    nombre: "CLAIRE",
    apellido: "CUNNINGHAM",
    fechaContrato: "19/01/2025 20:30",
    total: 300,
    sessionRef: "de28dfc5"
  },
  {
    nombre: "WALTER ANTONIUS GERARDUS",
    apellido: "WISSENBURG",
    fechaContrato: "20/01/2025 16:07",
    total: 165,
    sessionRef: "fcd02315"
  },
  {
    nombre: "CLAUDIO",
    apellido: "BORIO AGUERO",
    fechaContrato: "25/01/2025 11:59",
    total: 30,
    sessionRef: "5853a6f9"
  }
];

// Parsear fecha DD/MM/YYYY HH:MM
function parseDate(dateStr) {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');
  return new Date(year, month - 1, day, hour, minute);
}

// Estimar fecha de fin (3 días después por defecto)
function estimarFechaFin(fechaInicio) {
  const fin = new Date(fechaInicio);
  fin.setDate(fin.getDate() + 3);
  return fin;
}

async function importarReservas(dryRun = true) {
  console.log(dryRun ? '🧪 MODO DRY RUN - No se harán cambios\n' : '🚀 IMPORTANDO RESERVAS REALES\n');
  
  let importadas = 0;
  let errores = 0;
  
  for (const reserva of reservasRodeeo) {
    try {
      // Buscar cliente
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
        console.log(`✅ [DRY RUN] Reserva para ${cliente.first_name} ${cliente.last_name}`);
        console.log(`   Fecha: ${fechaInicio.toISOString().split('T')[0]} → ${fechaFin.toISOString().split('T')[0]}`);
        console.log(`   Total: €${reserva.total}`);
        console.log(`   Cliente ID: ${cliente.id}\n`);
      } else {
        // Crear reserva real
        const nuevaReserva = await prisma.carRentalBookings.create({
          data: {
            customer_id: cliente.id,
            customer_name: `${cliente.first_name} ${cliente.last_name}`,
            pickup_date: fechaInicio,
            return_date: fechaFin,
            pickup_location_id: 1, // Ubicación por defecto
            return_location_id: 1,
            total_price: parseFloat(reserva.total),
            status: 'completed',
            payment_status: 'paid',
            created_at: fechaInicio,
            updated_at: new Date()
          }
        });
        
        console.log(`✅ Reserva creada: ${nuevaReserva.booking_number} - ${cliente.first_name} ${cliente.last_name}`);
      }
      
      importadas++;
      
    } catch (error) {
      console.error(`❌ Error con ${reserva.nombre} ${reserva.apellido}:`, error.message);
      errores++;
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ ${dryRun ? 'Para importar' : 'Importadas'}: ${importadas}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📋 Total: ${reservasRodeeo.length}`);
  
  await prisma.$disconnect();
}

// Ejecutar
const dryRun = process.argv[2] !== '--real';
importarReservas(dryRun);
