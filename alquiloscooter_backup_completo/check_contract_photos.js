require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContractPhotos() {
  try {
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: 57 },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: {
              include: {
                car: true
              }
            },
            drivers: true,
            inspections: true
          }
        }
      }
    });

    if (!contract) {
      console.log('❌ Contrato #57 no encontrado');
      return;
    }

    console.log('📄 ANÁLISIS DEL CONTRATO #57\n');
    console.log('════════════════════════════════════════\n');
    
    console.log(`📊 DATOS GENERALES:`);
    console.log(`  - Número de contrato: ${contract.contract_number}`);
    console.log(`  - Reserva: #${contract.booking_id} (${contract.booking?.booking_number})`);
    console.log(`  - Tamaño HTML: ${(contract.contract_text.length / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    console.log(`🚗 VEHÍCULOS: ${contract.booking.vehicles.length}`);
    contract.booking.vehicles.forEach((bv, idx) => {
      console.log(`  ${idx + 1}. ${bv.car?.make || 'N/A'} ${bv.car?.model || 'N/A'} (${bv.car?.registration || 'N/A'})`);
    });
    console.log('');

    console.log(`👥 CONDUCTORES ADICIONALES: ${contract.booking.drivers.length}`);
    contract.booking.drivers.forEach((driver, idx) => {
      console.log(`  ${idx + 1}. ${driver.full_name || 'N/A'} (${driver.dni_nie || 'N/A'})`);
    });
    console.log('');

    console.log(`📸 INSPECCIONES: ${contract.booking.inspections.length}`);
    let totalPhotos = 0;
    contract.booking.inspections.forEach((insp, idx) => {
      const photos = [
        insp.photo_front_path,
        insp.photo_left_path,
        insp.photo_rear_path,
        insp.photo_right_path,
        insp.photo_odometer_path
      ].filter(p => p).length;
      totalPhotos += photos;
      console.log(`  ${idx + 1}. Inspección ${insp.inspection_type} - Vehículo ${insp.vehicle_id} (${photos} fotos)`);
    });
    console.log(`  📷 TOTAL FOTOS DE INSPECCIÓN: ${totalPhotos}`);
    console.log('');

    // Contar documentos
    let customerDocs = 0;
    if (contract.booking.customer) {
      const docFields = [
        'document_front_path',
        'document_back_path',
        'driving_license_front_path',
        'driving_license_back_path'
      ];
      customerDocs = docFields.filter(field => contract.booking.customer[field]).length;
    }
    console.log(`📋 DOCUMENTOS CLIENTE: ${customerDocs}`);
    console.log('');

    let driverDocs = 0;
    contract.booking.drivers.forEach((driver) => {
      const docFields = [
        'driver_license_front',
        'driver_license_back',
        'id_document_front',
        'id_document_back'
      ];
      const docs = docFields.filter(field => driver[field]).length;
      driverDocs += docs;
      if (docs > 0) {
        console.log(`  - ${driver.full_name}: ${docs} documentos`);
      }
    });
    console.log(`📋 DOCUMENTOS CONDUCTORES ADICIONALES: ${driverDocs}`);
    console.log('');

    const totalImages = totalPhotos + customerDocs + driverDocs + 1; // +1 por el logo
    console.log(`🎨 TOTAL IMÁGENES EN EL CONTRATO: ${totalImages}`);
    console.log(`  - Logo: 1`);
    console.log(`  - Fotos inspección: ${totalPhotos}`);
    console.log(`  - Docs cliente: ${customerDocs}`);
    console.log(`  - Docs conductores: ${driverDocs}`);
    console.log('');

    // Estimación de tamaño
    const avgSizePerImageKB = (contract.contract_text.length / 1024) / totalImages;
    console.log(`📏 TAMAÑO PROMEDIO POR IMAGEN: ${avgSizePerImageKB.toFixed(0)} KB`);
    console.log('');
    
    console.log('💡 ANÁLISIS:');
    if (avgSizePerImageKB > 400) {
      console.log(`  ⚠️  Las imágenes son MUY pesadas (${avgSizePerImageKB.toFixed(0)}KB promedio)`);
      console.log(`  ⚠️  Se recomienda aumentar la compresión`);
    } else if (avgSizePerImageKB > 250) {
      console.log(`  ⚠️  Las imágenes son pesadas (${avgSizePerImageKB.toFixed(0)}KB promedio)`);
      console.log(`  ⚠️  Se podría mejorar la compresión`);
    } else {
      console.log(`  ✅ Las imágenes tienen un tamaño razonable (${avgSizePerImageKB.toFixed(0)}KB promedio)`);
    }
    console.log('');
    
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContractPhotos();
