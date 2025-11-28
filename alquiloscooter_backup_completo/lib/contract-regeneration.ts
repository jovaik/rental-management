
import { prisma } from '@/lib/db';
import { generateContract } from '@/lib/contracts/template';
import { getFileAsBase64 } from '@/lib/s3'; // Solo para el logo (que es pequeño)
import fs from 'fs';

/**
 * Verifica si un contrato está firmado
 */
export async function isContractSigned(bookingId: number): Promise<boolean> {
  const contract = await prisma.carRentalContracts.findUnique({
    where: { booking_id: bookingId },
    select: { signed_at: true }
  });
  
  return contract?.signed_at !== null && contract?.signed_at !== undefined;
}

/**
 * Obtiene el historial de cambios de un contrato
 */
export async function getContractHistory(contractId: number) {
  return await prisma.contractHistory.findMany({
    where: { contract_id: contractId },
    orderBy: { version: 'desc' }
  });
}

/**
 * Función auxiliar para preparar todos los datos del contrato
 */
async function prepareContractData(
  booking: any, 
  contractNumber: string, 
  signatureDate?: string, 
  signatureTime?: string, 
  ipAddress?: string, 
  language?: string,
  contractChanges?: Array<{version: number; date: string; reason: string; modifiedBy: string;}>,
  currentVersion?: number
) {
  // Obtener configuración de la empresa (logo y colores)
  const companyConfig = await prisma.companyConfig.findFirst({
    where: { active: true }
  });

  // Preparar logo en base64 si existe
  let logoBase64 = null;
  if (companyConfig?.logo_url) {
    try {
      let logoPath = companyConfig.logo_url;
      
      // Si es una ruta de S3 (formato: uploads/...)
      if (!logoPath.startsWith('http://') && !logoPath.startsWith('https://') && !logoPath.startsWith('file://')) {
        // Es una ruta S3 (cloud_storage_path)
        console.log('Cargando logo desde S3:', logoPath);
        logoBase64 = await getFileAsBase64(logoPath);
      } 
      // Si es una URL completa de S3
      else if (logoPath.includes('s3.amazonaws.com') || logoPath.includes('amazonaws.com')) {
        // Extraer el key de la URL
        const urlParts = logoPath.split('/');
        const keyIndex = urlParts.findIndex(part => part === 'uploads');
        if (keyIndex !== -1) {
          const s3Key = urlParts.slice(keyIndex).join('/');
          console.log('Cargando logo desde URL S3:', s3Key);
          logoBase64 = await getFileAsBase64(s3Key);
        }
      }
      // Si es una ruta local
      else {
        logoPath = logoPath.replace('file://', '');
        if (logoPath.startsWith('/')) {
          // Ruta absoluta
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoExt = logoPath.split('.').pop()?.toLowerCase();
            const mimeType = logoExt === 'png' ? 'image/png' : 'image/jpeg';
            logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
          }
        } else {
          // Ruta relativa, buscar en public
          const publicPath = `/home/ubuntu/rental_management_app/app/public/${logoPath}`;
          if (fs.existsSync(publicPath)) {
            const logoBuffer = fs.readFileSync(publicPath);
            const logoExt = logoPath.split('.').pop()?.toLowerCase();
            const mimeType = logoExt === 'png' ? 'image/png' : 'image/jpeg';
            logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
          }
        }
      }
    } catch (error) {
      console.error('Error leyendo logo:', error);
    }
  }

  // Calcular días de alquiler
  const pickupDate = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
  const returnDate = booking.return_date ? new Date(booking.return_date) : new Date();
  const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

  // ✅ SOLUCIÓN DEFINITIVA: Usar URLs firmadas (7 días) en lugar de Base64
  // Esto mantiene el HTML pequeño (50KB en lugar de 990KB) → Puppeteer funciona
  const convertPhotoToSignedUrl = async (photoPath: string | null): Promise<string | undefined> => {
    if (!photoPath) return undefined;
    
    try {
      // Importar función de URLs firmadas
      const { getFileUrl } = await import('@/lib/s3');
      
      // Si es una ruta S3
      if (!photoPath.startsWith('http://') && !photoPath.startsWith('https://') && !photoPath.startsWith('file://')) {
        return await getFileUrl(photoPath, 604800); // 7 días = 604800 segundos
      }
      // Si es una URL completa de S3
      else if (photoPath.includes('s3.amazonaws.com') || photoPath.includes('amazonaws.com')) {
        const urlParts = photoPath.split('/');
        const keyIndex = urlParts.findIndex(part => part === 'uploads');
        if (keyIndex !== -1) {
          const s3Key = urlParts.slice(keyIndex).join('/');
          return await getFileUrl(s3Key, 604800); // 7 días
        }
      }
      // Si es una ruta local (para desarrollo)
      else if (photoPath.startsWith('file://')) {
        return photoPath; // Mantener path local en desarrollo
      }
    } catch (error) {
      console.error('Error generando URL firmada:', photoPath, error);
    }
    
    return undefined;
  };

  // Preparar vehículos CON INSPECCIONES
  let vehicles = [];
  
  if (booking.vehicles && booking.vehicles.length > 0) {
    // Multi-vehicle booking
    vehicles = await Promise.all(booking.vehicles.map(async (vb: any) => {
      const vehicleId = vb.car_id;
      
      // Fetch delivery inspection for this vehicle
      const deliveryInspection = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: booking.id,
          vehicle_id: vehicleId,
          inspection_type: 'delivery'
        },
        orderBy: { inspection_date: 'desc' }
      });
      
      // Fetch return inspection for this vehicle
      const returnInspection = await prisma.vehicleInspections.findFirst({
        where: {
          booking_id: booking.id,
          vehicle_id: vehicleId,
          inspection_type: 'return'
        },
        orderBy: { inspection_date: 'desc' }
      });
      
      // Convert delivery inspection photos
      let deliveryInspectionData = null;
      if (deliveryInspection) {
        const [frontPhoto, leftPhoto, rearPhoto, rightPhoto, odometerPhoto] = await Promise.all([
          convertPhotoToSignedUrl(deliveryInspection.front_photo),
          convertPhotoToSignedUrl(deliveryInspection.left_photo),
          convertPhotoToSignedUrl(deliveryInspection.rear_photo),
          convertPhotoToSignedUrl(deliveryInspection.right_photo),
          convertPhotoToSignedUrl(deliveryInspection.odometer_photo)
        ]);
        
        deliveryInspectionData = {
          odometerReading: deliveryInspection.odometer_reading || undefined,
          fuelLevel: deliveryInspection.fuel_level || undefined,
          generalCondition: deliveryInspection.general_condition || undefined,
          notes: deliveryInspection.notes || undefined,
          frontPhoto,
          leftPhoto,
          rearPhoto,
          rightPhoto,
          odometerPhoto,
          inspectionDate: deliveryInspection.inspection_date 
            ? new Date(deliveryInspection.inspection_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US') 
            : undefined
        };
      }
      
      // Convert return inspection photos
      let returnInspectionData = null;
      if (returnInspection) {
        const [frontPhoto, leftPhoto, rearPhoto, rightPhoto, odometerPhoto] = await Promise.all([
          convertPhotoToSignedUrl(returnInspection.front_photo),
          convertPhotoToSignedUrl(returnInspection.left_photo),
          convertPhotoToSignedUrl(returnInspection.rear_photo),
          convertPhotoToSignedUrl(returnInspection.right_photo),
          convertPhotoToSignedUrl(returnInspection.odometer_photo)
        ]);
        
        returnInspectionData = {
          odometerReading: returnInspection.odometer_reading || undefined,
          fuelLevel: returnInspection.fuel_level || undefined,
          generalCondition: returnInspection.general_condition || undefined,
          notes: returnInspection.notes || undefined,
          frontPhoto,
          leftPhoto,
          rearPhoto,
          rightPhoto,
          odometerPhoto,
          inspectionDate: returnInspection.inspection_date 
            ? new Date(returnInspection.inspection_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US') 
            : undefined
        };
      }
      
      return {
        registration: vb.car?.registration_number || 'N/A',
        make: vb.car?.make || '',
        model: vb.car?.model || '',
        pricePerDay: parseFloat(vb.vehicle_price?.toString() || '0') / days,
        days: days,
        total: parseFloat(vb.vehicle_price?.toString() || '0'),
        deliveryInspection: deliveryInspectionData,
        returnInspection: returnInspectionData
      };
    }));
  } else if (booking.car) {
    // Single vehicle booking (legacy)
    const vehicleId = booking.car_id;
    
    // Fetch delivery inspection
    const deliveryInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vehicleId,
        inspection_type: 'delivery'
      },
      orderBy: { inspection_date: 'desc' }
    });
    
    // Fetch return inspection
    const returnInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vehicleId,
        inspection_type: 'return'
      },
      orderBy: { inspection_date: 'desc' }
    });
    
    // Convert delivery inspection photos
    let deliveryInspectionData = null;
    if (deliveryInspection) {
      const [frontPhoto, leftPhoto, rearPhoto, rightPhoto, odometerPhoto] = await Promise.all([
        convertPhotoToSignedUrl(deliveryInspection.front_photo),
        convertPhotoToSignedUrl(deliveryInspection.left_photo),
        convertPhotoToSignedUrl(deliveryInspection.rear_photo),
        convertPhotoToSignedUrl(deliveryInspection.right_photo),
        convertPhotoToSignedUrl(deliveryInspection.odometer_photo)
      ]);
      
      deliveryInspectionData = {
        odometerReading: deliveryInspection.odometer_reading || undefined,
        fuelLevel: deliveryInspection.fuel_level || undefined,
        generalCondition: deliveryInspection.general_condition || undefined,
        notes: deliveryInspection.notes || undefined,
        frontPhoto,
        leftPhoto,
        rearPhoto,
        rightPhoto,
        odometerPhoto,
        inspectionDate: deliveryInspection.inspection_date 
          ? new Date(deliveryInspection.inspection_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US') 
          : undefined
      };
    }
    
    // Convert return inspection photos
    let returnInspectionData = null;
    if (returnInspection) {
      const [frontPhoto, leftPhoto, rearPhoto, rightPhoto, odometerPhoto] = await Promise.all([
        convertPhotoToSignedUrl(returnInspection.front_photo),
        convertPhotoToSignedUrl(returnInspection.left_photo),
        convertPhotoToSignedUrl(returnInspection.rear_photo),
        convertPhotoToSignedUrl(returnInspection.right_photo),
        convertPhotoToSignedUrl(returnInspection.odometer_photo)
      ]);
      
      returnInspectionData = {
        odometerReading: returnInspection.odometer_reading || undefined,
        fuelLevel: returnInspection.fuel_level || undefined,
        generalCondition: returnInspection.general_condition || undefined,
        notes: returnInspection.notes || undefined,
        frontPhoto,
        leftPhoto,
        rearPhoto,
        rightPhoto,
        odometerPhoto,
        inspectionDate: returnInspection.inspection_date 
          ? new Date(returnInspection.inspection_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US') 
          : undefined
      };
    }
    
    vehicles = [{
      registration: booking.car.registration_number || 'N/A',
      make: booking.car.make || '',
      model: booking.car.model || '',
      pricePerDay: parseFloat(booking.car.daily_rate?.toString() || '0'),
      days: days,
      total: parseFloat(booking.car.daily_rate?.toString() || '0') * days,
      deliveryInspection: deliveryInspectionData,
      returnInspection: returnInspectionData
    }];
  }

  // Preparar conductores adicionales (datos directos en BookingDrivers)
  const additionalDrivers = booking.drivers?.map((driver: any) => ({
    fullName: driver.full_name || 'N/A',
    license: driver.driver_license || undefined
  })) || [];

  // Preparar extras
  const extras = booking.extras?.map((eb: any) => ({
    description: eb.extra?.name || 'Extra',
    priceUnit: parseFloat(eb.unit_price?.toString() || '0'),
    quantity: eb.quantity || 1,
    total: parseFloat(eb.total_price?.toString() || '0')
  })) || [];

  // Preparar upgrades
  const upgrades = booking.upgrades?.map((ub: any) => ({
    description: ub.upgrade?.name || 'Upgrade',
    priceUnit: parseFloat(ub.unit_price_per_day?.toString() || '0'),
    quantity: ub.days || 1,
    total: parseFloat(ub.total_price?.toString() || '0')
  })) || [];

  // Calcular totales
  const vehiclesTotal = vehicles.reduce((sum: number, v: any) => sum + v.total, 0);
  const extrasTotal = extras.reduce((sum: number, e: any) => sum + e.total, 0);
  const upgradesTotal = upgrades.reduce((sum: number, u: any) => sum + u.total, 0);
  const totalPriceNum = vehiclesTotal + extrasTotal + upgradesTotal;
  const subtotal = totalPriceNum / 1.21;  // Desglosar IVA 21%
  const iva = totalPriceNum - subtotal;



  // Determinar idioma del contrato basado en el cliente
  const contractLanguage = language || booking.customer?.language || 'es';

  // ✅ Generar o obtener enlace público de inspección (30 días de validez)
  let inspectionLink: string | undefined;
  try {
    const crypto = require('crypto');
    
    // Buscar enlace existente válido
    let existingLink = await prisma.inspectionLink.findFirst({
      where: {
        booking_id: booking.id,
        expires_at: {
          gte: new Date()
        }
      }
    });

    // Si no existe, crear uno nuevo
    if (!existingLink) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de expiración

      existingLink = await prisma.inspectionLink.create({
        data: {
          booking_id: booking.id,
          token: token,
          expires_at: expiresAt
        }
      });
      
      console.log(`✅ Creado nuevo enlace de inspección para reserva ${booking.id}: ${existingLink.token}`);
    } else {
      console.log(`✅ Reutilizando enlace de inspección existente para reserva ${booking.id}`);
    }

    // Generar URL del enlace
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
    inspectionLink = `${baseUrl}/inspeccion/${existingLink.token}`;
  } catch (error) {
    console.error('⚠️ Error generando enlace de inspección:', error);
    // Continuar sin enlace si hay error
  }

  return generateContract({
    contractNumber,
    contractDate: new Date().toLocaleDateString(contractLanguage === 'es' ? 'es-ES' : 'en-US'),
    customerFullname: `${booking.customer.first_name} ${booking.customer.last_name}`,
    customerDni: booking.customer.dni_nie || '',
    customerPhone: booking.customer.phone,
    customerEmail: booking.customer.email || '',
    customerAddress: booking.customer.street_address || booking.customer.address || '',
    driverLicense: booking.customer.driver_license || '',
    vehicles,
    additionalDrivers: additionalDrivers.length > 0 ? additionalDrivers : undefined,
    extras: extras.length > 0 ? extras : undefined,
    upgrades: upgrades.length > 0 ? upgrades : undefined,
    pickupDate: booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString(contractLanguage === 'es' ? 'es-ES' : 'en-US') : '',
    returnDate: booking.return_date ? new Date(booking.return_date).toLocaleDateString(contractLanguage === 'es' ? 'es-ES' : 'en-US') : '',
    pickupLocation: 'No especificada',
    returnLocation: 'No especificada',
    subtotal,
    iva,
    totalPrice: totalPriceNum.toFixed(2),
    comments: booking.notes || undefined,
    signatureDate,
    signatureTime,
    ipAddress,
    primaryColor: companyConfig?.primary_color || undefined,
    secondaryColor: companyConfig?.secondary_color || undefined,
    logoBase64: logoBase64,
    companyName: companyConfig?.company_name || undefined,
    language: contractLanguage as any,
    contractChanges: contractChanges || undefined,
    currentVersion: currentVersion || undefined,
    inspectionLink: inspectionLink // ✅ ENLACE PÚBLICO DE INSPECCIÓN (30 días)
  });
}

/**
 * Regenera un contrato si NO está firmado
 * @param bookingId ID de la reserva
 * @param changeReason Razón del cambio (ej: "Añadido vehículo adicional")
 * @param userId Usuario que realiza el cambio (opcional)
 * @returns true si se regeneró, false si ya estaba firmado
 */
export async function regenerateContractIfNotSigned(
  bookingId: number, 
  changeReason?: string,
  userId?: string
): Promise<boolean> {
  // Buscar contrato existente
  const contract = await prisma.carRentalContracts.findUnique({
    where: { booking_id: bookingId }
  });

  // Si no hay contrato, no hacer nada (se creará cuando se solicite)
  if (!contract) {
    console.log(`No hay contrato para la reserva ${bookingId}, se creará cuando se solicite`);
    return false;
  }

  // Si el contrato ya está firmado, NO regenerar
  if (contract.signed_at) {
    console.log(`Contrato ${contract.id} ya está firmado, NO se regenera`);
    return false;
  }

  console.log(`Regenerando contrato ${contract.id} para reserva ${bookingId}...`);

  // Obtener datos completos de la reserva
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
    console.error(`No se encontró reserva ${bookingId} o cliente asociado`);
    return false;
  }

  // Guardar el contrato actual en el historial
  await prisma.contractHistory.create({
    data: {
      contract_id: contract.id,
      version: contract.version,
      contract_text: contract.contract_text,
      change_reason: changeReason || 'Modificación en la reserva',
      created_by: userId || 'system'
    }
  });

  // Generar nuevo texto del contrato con datos actualizados
  const newContractText = await prepareContractData(
    booking, 
    contract.contract_number,
    undefined,
    undefined,
    undefined,
    booking.customer?.preferred_language || undefined
  );

  // Actualizar contrato con nueva versión
  await prisma.carRentalContracts.update({
    where: { id: contract.id },
    data: {
      contract_text: newContractText,
      version: contract.version + 1,
      pdf_url: null // Invalidar PDF anterior
    }
  });

  console.log(`✅ Contrato ${contract.id} regenerado exitosamente (v${contract.version} → v${contract.version + 1})`);
  return true;
}

/**
 * Regenera un contrato INCLUSO si está firmado (para cambios operativos)
 * Mantiene la firma original y agrega el cambio al historial
 */
export async function regenerateSignedContract(
  bookingId: number, 
  changeReason: string,
  userId?: string
): Promise<boolean> {
  // Buscar contrato existente
  const contract = await prisma.carRentalContracts.findUnique({
    where: { booking_id: bookingId },
    select: {
      id: true,
      contract_number: true,
      version: true,
      contract_text: true,
      signed_at: true,
      signature_data: true,
      ip_address: true
    }
  });

  // Si no hay contrato, no hacer nada
  if (!contract) {
    console.log(`No hay contrato para la reserva ${bookingId}`);
    return false;
  }

  console.log(`Regenerando contrato FIRMADO ${contract.id} para reserva ${bookingId}...`);

  // Obtener datos completos de la reserva
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
    console.error(`No se encontró reserva ${bookingId} o cliente asociado`);
    return false;
  }

  // ❌ DESACTIVADO: Historial de cambios
  // Ya no guardamos historial ni lo incluimos en el PDF
  // Esto estaba generando hojas en blanco y "cambios" no solicitados
  
  // Generar nuevo texto del contrato con datos actualizados
  // Si está firmado, mantenemos los datos de firma
  const signatureDate = contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('es-ES') : undefined;
  const signatureTime = contract.signed_at ? new Date(contract.signed_at).toLocaleTimeString('es-ES') : undefined;

  const newContractText = await prepareContractData(
    booking, 
    contract.contract_number,
    signatureDate,
    signatureTime,
    contract.ip_address || undefined,
    booking.customer?.preferred_language || undefined,
    undefined, // contractChanges - ya no se usa
    contract.version + 1
  );

  // Actualizar contrato con nueva versión (mantener firma)
  await prisma.carRentalContracts.update({
    where: { id: contract.id },
    data: {
      contract_text: newContractText,
      version: contract.version + 1,
      pdf_url: null // Invalidar PDF anterior para regenerarlo
    }
  });

  console.log(`✅ Contrato FIRMADO ${contract.id} regenerado (v${contract.version} → v${contract.version + 1})`);
  console.log(`   Razón: ${changeReason}`);
  return true;
}