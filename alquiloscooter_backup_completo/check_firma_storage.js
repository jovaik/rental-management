require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFirmaStorage() {
  console.log('=== DIAGNÓSTICO DE ALMACENAMIENTO DE FIRMAS ===\n');
  
  try {
    // Buscar reservas con firma del cliente
    const bookingsWithSignature = await prisma.carRentalBookings.findMany({
      where: {
        customer_signature_path: {
          not: null
        }
      },
      select: {
        id: true,
        booking_number: true,
        customer_signature_path: true,
        staff_signature_path: true
      },
      take: 5,
      orderBy: {
        id: 'desc'
      }
    });

    if (bookingsWithSignature.length === 0) {
      console.log('❌ No se encontraron reservas con firma');
      return;
    }

    console.log(`✓ Encontradas ${bookingsWithSignature.length} reservas con firma\n`);

    for (const booking of bookingsWithSignature) {
      console.log(`\n--- Reserva #${booking.booking_number} (ID: ${booking.id}) ---`);
      
      // Analizar firma del cliente
      if (booking.customer_signature_path) {
        const customerSig = booking.customer_signature_path;
        const sigLength = customerSig.length;
        
        console.log(`\n📝 Firma del Cliente:`);
        console.log(`   Longitud: ${sigLength} caracteres`);
        
        if (customerSig.startsWith('data:image/')) {
          console.log(`   ✓ Formato: BASE64 (data URL)`);
          console.log(`   Primeros 100 caracteres: ${customerSig.substring(0, 100)}...`);
          console.log(`   Tamaño estimado: ${(sigLength * 0.75 / 1024).toFixed(2)} KB`);
        } else if (customerSig.startsWith('5155/') || customerSig.includes('uploads/')) {
          console.log(`   ✓ Formato: S3 KEY (cloud_storage_path)`);
          console.log(`   S3 Key: ${customerSig}`);
        } else if (customerSig.startsWith('http://') || customerSig.startsWith('https://')) {
          console.log(`   ⚠️ Formato: URL (no recomendado)`);
          console.log(`   URL: ${customerSig.substring(0, 100)}...`);
        } else {
          console.log(`   ❓ Formato desconocido`);
          console.log(`   Primeros 100 caracteres: ${customerSig.substring(0, 100)}...`);
        }
      } else {
        console.log(`\n📝 Firma del Cliente: NO DISPONIBLE`);
      }
      
      // Analizar firma del staff
      if (booking.staff_signature_path) {
        const staffSig = booking.staff_signature_path;
        const sigLength = staffSig.length;
        
        console.log(`\n👤 Firma del Staff:`);
        console.log(`   Longitud: ${sigLength} caracteres`);
        
        if (staffSig.startsWith('data:image/')) {
          console.log(`   ✓ Formato: BASE64 (data URL)`);
          console.log(`   Primeros 100 caracteres: ${staffSig.substring(0, 100)}...`);
          console.log(`   Tamaño estimado: ${(sigLength * 0.75 / 1024).toFixed(2)} KB`);
        } else if (staffSig.startsWith('5155/') || staffSig.includes('uploads/')) {
          console.log(`   ✓ Formato: S3 KEY (cloud_storage_path)`);
          console.log(`   S3 Key: ${staffSig}`);
        } else if (staffSig.startsWith('http://') || staffSig.startsWith('https://')) {
          console.log(`   ⚠️ Formato: URL (no recomendado)`);
          console.log(`   URL: ${staffSig.substring(0, 100)}...`);
        } else {
          console.log(`   ❓ Formato desconocido`);
          console.log(`   Primeros 100 caracteres: ${staffSig.substring(0, 100)}...`);
        }
      } else {
        console.log(`\n👤 Firma del Staff: NO DISPONIBLE`);
      }
    }

    console.log('\n\n=== RESUMEN ===');
    const allSignatures = bookingsWithSignature.flatMap(b => 
      [b.customer_signature_path, b.staff_signature_path].filter(Boolean)
    );
    
    const base64Count = allSignatures.filter(s => s.startsWith('data:image/')).length;
    const s3KeyCount = allSignatures.filter(s => s.startsWith('5155/') || s.includes('uploads/')).length;
    const urlCount = allSignatures.filter(s => s.startsWith('http')).length;
    const otherCount = allSignatures.length - base64Count - s3KeyCount - urlCount;
    
    console.log(`Total firmas analizadas: ${allSignatures.length}`);
    console.log(`- BASE64: ${base64Count}`);
    console.log(`- S3 KEY: ${s3KeyCount}`);
    console.log(`- URL: ${urlCount}`);
    console.log(`- Otros: ${otherCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFirmaStorage();
