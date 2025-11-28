import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const DRY_RUN = process.argv[2] === '--dry-run';

console.log(DRY_RUN ? '🔍 MODO DRY-RUN: Solo simulación\n' : '🚀 MODO REAL: Importando a la base de datos\n');

async function importReservations() {
  try {
    const csvPath = '/home/ubuntu/reservas_febrero_marzo_2025.csv';
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    
    // Agrupar documentos por session_reference
    const sessionGroups: Record<string, any[]> = {};
    
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
          customer = await prisma.carRentalCustomers.findFirst({
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
            customer = await prisma.carRentalCustomers.create({
              data: {
                first_name: contract.firstName,
                last_name: contract.lastName,
                email: `${contract.firstName.toLowerCase().replace(/ /g, '.')}.${contract.lastName.toLowerCase().replace(/ /g, '.')}@imported.com`,
                phone: '+34600000000',
                dni_nie: `IMP-${sessionRef.substring(0, 8)}`,
                customer_type: 'individual',
                status: 'active'
              }
            });
          }
        }
        
        // Obtener vehículo por defecto
        let vehicle;
        if (!DRY_RUN) {
          vehicle = await prisma.carRentalCars.findFirst({
            where: { status: 'T' }
          });
          
          if (!vehicle) {
            console.log(`❌ Error: No hay vehículos disponibles`);
            errors++;
            continue;
          }
        }
        
        const totalPrice = parseFloat(contract.totalInclTaxes) || 0;
        
        if (!DRY_RUN) {
          // Crear la reserva
          const booking = await prisma.carRentalBookings.create({
            data: {
              customer_id: customer!.id,
              car_id: vehicle!.id,
              pickup_date: bookingDate,
              return_date: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000), // +1 día por defecto
              total_price: totalPrice,
              status: 'completed'
            }
          });
          
          console.log(`✅ Importado: ${customerName} - €${totalPrice} (ID: ${booking.id})`);
        } else {
          console.log(`✅ [DRY-RUN] ${customerName} - €${totalPrice} - ${bookingDate.toLocaleDateString()}`);
        }
        
        imported++;
        
      } catch (error: any) {
        console.log(`❌ Error en ${sessionRef}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`  ✅ Importadas: ${imported}`);
    console.log(`  ⚠️  Saltadas: ${skipped}`);
    console.log(`  ❌ Errores: ${errors}`);
    
  } catch (error: any) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReservations();
