import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateContract } from './lib/contracts/template';
import { getFileAsBase64 } from './lib/s3';
import fs from 'fs';

const prisma = new PrismaClient();

async function convertPhotoToBase64(photoPath: string | null): Promise<string | undefined> {
  if (!photoPath) return undefined;
  
  try {
    const base64Result = await getFileAsBase64(photoPath);
    return base64Result || undefined;
  } catch (error) {
    console.error('Error converting photo:', photoPath, error);
    return undefined;
  }
}

async function generateTestContract() {
  console.log('\n🧪 GENERANDO CONTRATO COMPLETO PARA RESERVA #126\n');

  try {
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: 126 },
      include: {
        customer: true,
        car: true,
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

    if (!booking || !booking.customer || !booking.pickup_date) {
      console.log('❌ Reserva no encontrada o incompleta');
      return;
    }

    console.log('✅ Reserva encontrada:', booking.booking_number);

    // Calcular días
    const pickupDate = new Date(booking.pickup_date);
    const returnDate = booking.return_date ? new Date(booking.return_date) : new Date();
    const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Preparar vehículos con inspecciones
    const vehicles = [];
    for (const vb of booking.vehicles) {
      console.log(`\n📋 Procesando vehículo: ${vb.car.make} ${vb.car.model}`);
      
      const vehicleData: any = {
        registration: vb.car.registration_number || 'N/A',
        make: vb.car.make || '',
        model: vb.car.model || '',
        pricePerDay: parseFloat(vb.vehicle_price?.toString() || '0') / days,
        days: days,
        total: parseFloat(vb.vehicle_price?.toString() || '0')
      };

      // Buscar inspección de salida
      const deliveryInsp = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: 126,
          vehicle_id: vb.car_id,
          inspection_type: 'delivery'
        },
        orderBy: {
          inspection_date: 'desc'
        }
      });

      if (deliveryInsp) {
        console.log(`   ✅ Inspección de salida encontrada (ID: ${deliveryInsp.id})`);
        console.log('   🔄 Convirtiendo fotos a base64...');
        
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
          inspectionDate: new Date(deliveryInsp.inspection_date).toLocaleDateString('es-ES')
        };

        console.log(`   ✅ Fotos convertidas: ${[frontPhotoBase64, leftPhotoBase64, rearPhotoBase64, rightPhotoBase64, odometerPhotoBase64].filter(Boolean).length}/5`);
      }

      vehicles.push(vehicleData);
    }

    console.log('\n📝 Generando HTML del contrato...\n');

    const html = await generateContract({
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
      pickupLocation: 'No especificada',
      returnLocation: 'No especificada',
      subtotal: 100,
      iva: 21,
      totalPrice: '121.00',
      language: 'es'
    });

    // Guardar HTML
    fs.writeFileSync('/tmp/contrato_test_126.html', html);
    console.log('✅ HTML generado y guardado en: /tmp/contrato_test_126.html');
    
    // Contar cuántas imágenes hay en el HTML
    const imgCount = (html.match(/<img src="data:image/g) || []).length;
    console.log(`📸 Imágenes encontradas en el HTML: ${imgCount}`);
    
    // Verificar si las imágenes tienen src válidos
    const imgWithoutSrc = (html.match(/<img src=""/g) || []).length;
    if (imgWithoutSrc > 0) {
      console.log(`⚠️  Imágenes sin src válido: ${imgWithoutSrc}`);
    }

    console.log('\n💡 Abre el archivo /tmp/contrato_test_126.html en un navegador para ver el resultado\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestContract();
