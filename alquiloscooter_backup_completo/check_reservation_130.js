const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReservation() {
  try {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 130 },
      include: {
        customer: true,
        inspections: {
          select: {
            id: true,
            inspection_type: true,
            inspection_date: true
          }
        }
      }
    });
    
    console.log('📋 Reserva 130:');
    console.log('Email Cliente:', booking.customer.email);
    console.log('\n📸 Inspecciones:');
    booking.inspections.forEach(insp => {
      console.log(`  - ID: ${insp.id}, Tipo: ${insp.inspection_type}, Fecha: ${insp.inspection_date}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkReservation();
