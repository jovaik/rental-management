require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clientes del archivo Rodeeo de ENERO 2025
const clientesEnero = [
  { nombre: "DREW", apellido: "GARRET", fecha: "02/01/2025", total: 180 },
  { nombre: "TIMOTHY GABRIEL", apellido: "SHERLOCK", fecha: "05/01/2025", total: 180 },
  { nombre: "ARNE", apellido: "SCHAUMONT", fecha: "05/01/2025", total: 35 },
  { nombre: "RISTO", apellido: "HEIKINHEIMO", fecha: "06/01/2025", total: 195 },
  { nombre: "TXABER", apellido: "BASAÑEZ BILBAO", fecha: "11/01/2025", total: 70 },
  { nombre: "ALEXANDRE", apellido: "FRIAS MARQUES", fecha: "12/01/2025", total: 300 },
  { nombre: "LUIS ALBERTO", apellido: "AGULLO MARTIN", fecha: "13/01/2025", total: 90 },
  { nombre: "IVAN", apellido: "NIKOLOVSKI", fecha: "13/01/2025", total: 200 },
  { nombre: "ALAIN", apellido: "CORMIER", fecha: "13/01/2025", total: 200 },
  { nombre: "LUKAS", apellido: "JANBEN", fecha: "13/01/2025", total: 300 },
  { nombre: "CLAIRE", apellido: "CUNNINGHAM", fecha: "19/01/2025", total: 300 },
  { nombre: "WALTER ANTONIUS GERARDUS", apellido: "WISSENBURG", fecha: "20/01/2025", total: 165 },
  { nombre: "CLAUDIO", apellido: "BORIO AGUERO", fecha: "25/01/2025", total: 30 }
];

async function verificar() {
  console.log('🔍 Verificando clientes de ENERO 2025 de Rodeeo...\n');
  
  let encontrados = 0;
  let noEncontrados = 0;
  
  for (const item of clientesEnero) {
    const cliente = await prisma.carRentalCustomers.findFirst({
      where: {
        AND: [
          { first_name: { contains: item.nombre.split(' ')[0], mode: 'insensitive' } },
          { last_name: { contains: item.apellido.split(' ')[0], mode: 'insensitive' } }
        ]
      }
    });
    
    if (cliente) {
      console.log(`✅ ${item.nombre} ${item.apellido}`);
      encontrados++;
    } else {
      console.log(`❌ ${item.nombre} ${item.apellido} (${item.fecha})`);
      noEncontrados++;
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Encontrados: ${encontrados}`);
  console.log(`   ❌ NO encontrados: ${noEncontrados}`);
  console.log(`   📋 Total en archivo: ${clientesEnero.length}`);
  
  await prisma.$disconnect();
}

verificar();
