require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Modo DRY-RUN: true = solo simular, false = importar de verdad
const DRY_RUN = process.argv[2] === '--dry-run';

console.log(DRY_RUN ? '🔍 MODO DRY-RUN: Solo simulación\n' : '🚀 MODO REAL: Importando a la base de datos\n');

async function importReservations() {
  try {
    const csvPath = '/home/ubuntu/reservas_febrero_marzo_2025.csv';
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    
    // Agrupar documentos por session_reference
    const sessionGroups = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = line.split(';');
      
      const sessionRef = fields[3];
      
      if (!sessionGroups[sessionRef]) {
        sessionGroups[sessionRef] = [];
      }
      
      sessionGroups[sessionRef].push({
        date: fields[0].replace(/"/g, ''),
        reference: fields[1].replace(/"/g, ''),
        type: fields[2].replace(/"/g, ''),
        customerType: fields[4],
        firstName: fields[5].replace(/"/g, ''),
        lastName: fields[6].replace(/"/g, ''),
        companyName: fields[7].replace(/"/g, ''),
        paymentMethod: fields[8].replace(/"/g, ''),
        totalExclTaxes: fields[9],
        totalTaxes: fields[10],
        totalInclTaxes: fields[11]
      });
    }
    
    console.log(`📊 Total de reservas a importar: ${Object.keys(sessionGroups).length}\n`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const [sessionRef, documents] of Object.entries(sessionGroups)) {
      try {
        // Buscar el contrato principal
        const contract = documents.find(doc => doc.type === 'Contrato de alquiler');
        
        if (!contract) {
          console.log(`⚠️  Saltando ${sessionRef}: No tiene contrato de alquiler`);
          skipped++;
          continue;
        }
        
        // Extraer información
        const customerName = `${contract.firstName} ${contract.lastName}`.trim();
        
        // Parsear fecha correctamente (formato: "DD/MM/YYYY HH:MM")
        const dateStr = contract.date.trim();
        const [datePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/');
        const bookingDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Buscar o crear cliente
        let customer;
        if (!DRY_RUN) {
          customer = await prisma.CarRentalCustomers.findFirst({
            where: {
              OR: [
                { 
                  first_name: contract.firstName,
                  last_name: contract.lastName
                },
                {
                  email: `${contract.firstName.toLowerCase()}.${contract.lastName.toLowerCase()}@imported.com`
                }
              ]
            }
          });
          
          if (!customer) {
            customer = await prisma.CarRentalCustomers.create({
              data: {
                first_name: contract.firstName,
                last_name: contract.lastName,
                email: `${contract.firstName.toLowerCase()}.${contract.lastName.toLowerCase()}@imported.com`,
                phone: '+34600000000',
                document_type: 'passport',
                document_number: `IMP-${sessionRef.substring(0, 8)}`,
                created_at: new Date(),
                updated_at: new Date()
              }
            });
          }
        }
        
        // Obtener vehículo por defecto
        let vehicle;
        if (!DRY_RUN) {
          vehicle = await prisma.CarRentalCars.findFirst({
            where: { status: 'T' }
          });
          
          if (!vehicle) {
            // Si no hay vehículos con status T, obtener cualquier vehículo
            vehicle = await prisma.CarRentalCars.findFirst();
          }
          
          if (!vehicle) {
            console.log(`❌ Error: No hay vehículos en la base de datos`);
            errors++;
            continue;
          }
        }
        
        const totalPrice = parseFloat(contract.totalInclTaxes) || 0;
        
        if (!DRY_RUN) {
          // Crear número de expediente único
          const bookingNumber = `IMP-${bookingDate.getFullYear()}${String(bookingDate.getMonth() + 1).padStart(2, '0')}${String(bookingDate.getDate()).padStart(2, '0')}-${sessionRef.substring(0, 4).toUpperCase()}`;
          
          // Crear la reserva
          const booking = await prisma.CarRentalBookings.create({
            data: {
              booking_number: bookingNumber,
              car_id: vehicle.id,
              customer_id: customer.id,
              customer_name: customerName,
              customer_email: customer.email,
              customer_phone: customer.phone,
              pickup_date: bookingDate,
              return_date: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000), // +1 día por defecto
              total_price: totalPrice,
              status: 'completed',
              metodo_pago: contract.paymentMethod?.includes('Tarjeta') ? 'TPV_SUMUP' : 'EFECTIVO',
              damage_reported: 'N'
            }
          });
          
          console.log(`✅ Importado: ${customerName} - €${totalPrice} (${bookingNumber})`);
        } else {
          console.log(`✅ [DRY-RUN] ${customerName} - €${totalPrice} - ${bookingDate.toLocaleDateString()}`);
        }
        
        imported++;
        
      } catch (error) {
        console.log(`❌ Error en ${sessionRef}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`  ✅ Importadas: ${imported}`);
    console.log(`  ⚠️  Saltadas: ${skipped}`);
    console.log(`  ❌ Errores: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReservations();
