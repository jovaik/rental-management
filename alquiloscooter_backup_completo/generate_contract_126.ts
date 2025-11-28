import { prisma } from './lib/db';
import { getFileAsBase64 } from './lib/s3';
import { generateContract } from './lib/contracts/template';
import fs from 'fs';

async function generateContractManually() {
  const bookingId = 126;
  
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log(`🔄 GENERANDO CONTRATO PARA RESERVA #${bookingId}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // Cargar reserva completa
  const booking = await prisma.carRentalBookings.findUnique({
    where: { id: bookingId },
    include: {
      car: true,
      customer: true,
      vehicles: {
        include: {
          car: true
        }
      },
      drivers: true,
      extras: {
        include: {
          extra: true
        }
      },
      upgrades: {
        include: {
          upgrade: true
        }
      },
    }
  });

  if (!booking || !booking.customer) {
    console.error('❌ Reserva o cliente no encontrado');
    return;
  }

  console.log('✅ Reserva cargada');
  
  // Calcular días
  const pickupDate = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
  const returnDate = booking.return_date ? new Date(booking.return_date) : new Date();
  const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Función para convertir foto a base64
  const convertPhotoToBase64 = async (photoPath: string | null): Promise<string | undefined> => {
    if (!photoPath) {
      console.log('   ⚠️  Foto no proporcionada (null)');
      return undefined;
    }
    
    console.log(`   📸 Convirtiendo: ${photoPath}`);
    
    try {
      const base64Result = await getFileAsBase64(photoPath);
      if (base64Result) {
        console.log(`   ✅ ÉXITO - ${base64Result.length} chars`);
        return base64Result;
      } else {
        console.log(`   ❌ getFileAsBase64 retornó null`);
      }
    } catch (error) {
      console.error(`   ❌ ERROR:`, error);
    }
    
    return undefined;
  };

  // Preparar vehículos CON inspecciones
  const vehicles = [];
  
  console.log('\n📋 PROCESANDO VEHÍCULOS...\n');
  
  for (const vb of booking.vehicles || []) {
    const vehicleData: any = {
      registration: vb.car?.registration_number || 'N/A',
      make: vb.car?.make || '',
      model: vb.car?.model || '',
      pricePerDay: parseFloat(vb.vehicle_price?.toString() || '0') / days,
      days: days,
      total: parseFloat(vb.vehicle_price?.toString() || '0')
    };

    console.log(`🚗 Vehículo: ${vehicleData.make} ${vehicleData.model} (${vehicleData.registration})`);

    // Buscar inspección de salida
    console.log('   🔍 Buscando inspección de SALIDA...');
    const deliveryInsp = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vb.car_id,
        inspection_type: 'delivery'
      },
      orderBy: {
        inspection_date: 'desc'
      }
    });

    if (deliveryInsp) {
      console.log('   ✅ Inspección de SALIDA encontrada');
      console.log('   📷 Convirtiendo fotos de SALIDA...');
      
      const [frontPhotoBase64, leftPhotoBase64, rearPhotoBase64, rightPhotoBase64, odometerPhotoBase64] = await Promise.all([
        convertPhotoToBase64(deliveryInsp.front_photo),
        convertPhotoToBase64(deliveryInsp.left_photo),
        convertPhotoToBase64(deliveryInsp.rear_photo),
        convertPhotoToBase64(deliveryInsp.right_photo),
        convertPhotoToBase64(deliveryInsp.odometer_photo)
      ]);

      vehicleData.deliveryInspection = {
        odometerReading: deliveryInsp.odometer_reading || undefined,
        fuelLevel: deliveryInsp.fuel_level || undefined,
        generalCondition: deliveryInsp.general_condition || undefined,
        notes: deliveryInsp.notes || undefined,
        frontPhoto: frontPhotoBase64,
        leftPhoto: leftPhotoBase64,
        rearPhoto: rearPhotoBase64,
        rightPhoto: rightPhotoBase64,
        odometerPhoto: odometerPhotoBase64,
        inspectionDate: deliveryInsp.inspection_date ? new Date(deliveryInsp.inspection_date).toLocaleDateString('es-ES') : undefined
      };
      
      console.log(`   📊 Resumen de fotos:`);
      console.log(`      - Frontal: ${frontPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Izquierda: ${leftPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Trasera: ${rearPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Derecha: ${rightPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Odómetro: ${odometerPhotoBase64 ? '✅' : '❌'}`);
    } else {
      console.log('   ⚠️  No se encontró inspección de SALIDA');
    }

    // Buscar inspección de devolución
    console.log('   🔍 Buscando inspección de DEVOLUCIÓN...');
    const returnInsp = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vb.car_id,
        inspection_type: 'return'
      },
      orderBy: {
        inspection_date: 'desc'
      }
    });

    if (returnInsp) {
      console.log('   ✅ Inspección de DEVOLUCIÓN encontrada');
      console.log('   📷 Convirtiendo fotos de DEVOLUCIÓN...');
      
      const [frontPhotoBase64, leftPhotoBase64, rearPhotoBase64, rightPhotoBase64, odometerPhotoBase64] = await Promise.all([
        convertPhotoToBase64(returnInsp.front_photo),
        convertPhotoToBase64(returnInsp.left_photo),
        convertPhotoToBase64(returnInsp.rear_photo),
        convertPhotoToBase64(returnInsp.right_photo),
        convertPhotoToBase64(returnInsp.odometer_photo)
      ]);

      vehicleData.returnInspection = {
        odometerReading: returnInsp.odometer_reading || undefined,
        fuelLevel: returnInsp.fuel_level || undefined,
        generalCondition: returnInsp.general_condition || undefined,
        notes: returnInsp.notes || undefined,
        frontPhoto: frontPhotoBase64,
        leftPhoto: leftPhotoBase64,
        rearPhoto: rearPhotoBase64,
        rightPhoto: rightPhotoBase64,
        odometerPhoto: odometerPhotoBase64,
        inspectionDate: returnInsp.inspection_date ? new Date(returnInsp.inspection_date).toLocaleDateString('es-ES') : undefined
      };
      
      console.log(`   📊 Resumen de fotos:`);
      console.log(`      - Frontal: ${frontPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Izquierda: ${leftPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Trasera: ${rearPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Derecha: ${rightPhotoBase64 ? '✅' : '❌'}`);
      console.log(`      - Odómetro: ${odometerPhotoBase64 ? '✅' : '❌'}`);
    } else {
      console.log('   ⚠️  No se encontró inspección de DEVOLUCIÓN');
    }

    vehicles.push(vehicleData);
    console.log('');
  }

  // Calcular totales
  const vehiclesTotal = vehicles.reduce((sum: number, v: any) => sum + v.total, 0);
  const totalPriceNum = vehiclesTotal;
  const subtotal = totalPriceNum / 1.21;
  const iva = totalPriceNum - subtotal;

  console.log('\n💰 TOTALES:');
  console.log(`   Subtotal: ${subtotal.toFixed(2)}€`);
  console.log(`   IVA: ${iva.toFixed(2)}€`);
  console.log(`   TOTAL: ${totalPriceNum.toFixed(2)}€`);

  // Generar contrato HTML
  console.log('\n📝 GENERANDO HTML DEL CONTRATO...');
  
  const contractHTML = generateContract({
    contractNumber: '202511070001',
    contractDate: new Date().toLocaleDateString('es-ES'),
    customerFullname: `${booking.customer.first_name} ${booking.customer.last_name}`,
    customerDni: booking.customer.dni_nie || '',
    customerPhone: booking.customer.phone,
    customerEmail: booking.customer.email || '',
    customerAddress: booking.customer.street_address || booking.customer.address || '',
    driverLicense: booking.customer.driver_license || '',
    vehicles,
    pickupDate: pickupDate.toLocaleDateString('es-ES'),
    returnDate: returnDate.toLocaleDateString('es-ES'),
    subtotal,
    iva,
    totalPrice: totalPriceNum.toFixed(2),
    language: 'es'
  });

  console.log(`✅ HTML generado - ${contractHTML.length} caracteres`);
  
  // Verificar contenido
  const hasPhotos = contractHTML.includes('data:image/jpeg;base64,');
  const photoMatches = contractHTML.match(/data:image\/jpeg;base64,/g);
  
  console.log(`\n🔍 VERIFICACIÓN:`);
  console.log(`   - Contiene fotos base64: ${hasPhotos ? '✅ SÍ' : '❌ NO'}`);
  if (hasPhotos) {
    console.log(`   - Cantidad de fotos: ${photoMatches?.length || 0}`);
  }
  
  // Guardar en DB
  console.log('\n💾 GUARDANDO EN BASE DE DATOS...');
  
  const newContract = await prisma.carRentalContracts.create({
    data: {
      booking_id: booking.id,
      customer_id: booking.customer.id,
      contract_number: '202511070001',
      contract_text: contractHTML
    }
  });

  console.log(`✅ Contrato guardado - ID: ${newContract.id}`);
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ PROCESO COMPLETADO');
  console.log('═══════════════════════════════════════════════════\n');
}

generateContractManually()
  .catch(console.error)
  .finally(() => process.exit(0));
