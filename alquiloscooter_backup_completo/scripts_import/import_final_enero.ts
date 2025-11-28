import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reservas = [
  { nombre: "DREW", apellido: "GARRET", fecha: "02/01/2025 10:58", total: 180 },
  { nombre: "TIMOTHY GABRIEL", apellido: "SHERLOCK", fecha: "05/01/2025 13:43", total: 180 },
  { nombre: "ARNE", apellido: "SCHAUMONT", fecha: "05/01/2025 15:43", total: 35 },
  { nombre: "RISTO", apellido: "HEIKINHEIMO", fecha: "06/01/2025 18:34", total: 195 },
  { nombre: "TXABER", apellido: "BASAÑEZ BILBAO", fecha: "11/01/2025 15:11", total: 70 },
  { nombre: "ALEXANDRE", apellido: "FRIAS MARQUES", fecha: "12/01/2025 22:24", total: 300 },
  { nombre: "LUIS ALBERTO", apellido: "AGULLO MARTIN", fecha: "13/01/2025 11:32", total: 90 },
  { nombre: "IVAN", apellido: "NIKOLOVSKI", fecha: "13/01/2025 11:52", total: 200 },
  { nombre: "ALAIN", apellido: "CORMIER", fecha: "13/01/2025 16:51", total: 200 },
  { nombre: "LUKAS", apellido: "JANBEN", fecha: "13/01/2025 19:26", total: 300 },
  { nombre: "CLAIRE", apellido: "CUNNINGHAM", fecha: "19/01/2025 20:30", total: 300 },
  { nombre: "WALTER ANTONIUS GERARDUS", apellido: "WISSENBURG", fecha: "20/01/2025 16:07", total: 165 },
  { nombre: "CLAUDIO", apellido: "BORIO AGUERO", fecha: "25/01/2025 11:59", total: 30 }
];

function parseFecha(str: string): Date {
  const [datePart, timePart] = str.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

async function importar() {
  console.log('🚀 IMPORTANDO 13 RESERVAS DE ENERO 2025\n');
  
  let ok = 0, err = 0;
  
  for (const r of reservas) {
    try {
      const cliente = await prisma.carRentalCustomers.findFirst({
        where: {
          AND: [
            { first_name: { contains: r.nombre.split(' ')[0], mode: 'insensitive' } },
            { last_name: { contains: r.apellido.split(' ')[0], mode: 'insensitive' } }
          ]
        }
      });
      
      if (!cliente) {
        console.log(`❌ ${r.nombre} ${r.apellido} - Cliente no encontrado`);
        err++;
        continue;
      }
      
      const inicio = parseFecha(r.fecha);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 3);
      
      const booking = await prisma.carRentalBookings.create({
        data: {
          customer: { connect: { id: cliente.id } },
          customer_name: `${cliente.first_name} ${cliente.last_name}`,
          customer_email: cliente.email || null,
          customer_phone: cliente.phone || null,
          pickup_date: inicio,
          return_date: fin,
          total_price: r.total,
          status: 'completed'
        }
      });
      
      console.log(`✅ ${booking.booking_number} - ${cliente.first_name} ${cliente.last_name}`);
      ok++;
      
    } catch (error: any) {
      console.error(`❌ ${r.nombre} ${r.apellido}: ${error.message.split('\n')[0]}`);
      err++;
    }
  }
  
  console.log(`\n📊 Resultado Final:`);
  console.log(`   ✅ Importadas: ${ok}`);
  console.log(`   ❌ Errores: ${err}`);
  console.log(`   📋 Total: ${reservas.length}`);
  
  await prisma.$disconnect();
}

importar();
