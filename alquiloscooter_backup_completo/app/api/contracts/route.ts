
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateContract } from '@/lib/contracts/template';
import { getFileAsBase64, getFileAsCompressedBase64, getFileUrl } from '@/lib/s3';
import { regenerateContractIfNotSigned, regenerateSignedContract } from '@/lib/contract-regeneration';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// Función para generar número de contrato en formato YYYYMMDD0001 (igual que expedientes)
/**
 * Genera el número de contrato basado en la fecha de inicio de la reserva
 * IMPORTANTE: 
 * - Usa la fecha de INICIO DE LA RESERVA (pickup_date)
 * - Los contratos del mismo día se numeran por ORDEN DE HORA de salida
 * - Da igual cuando se cree el contrato, el número va por la fecha de inicio
 * 
 * Formato: YYYYMMDD0001
 * 
 * Ejemplo: Si hoy firmas 3 contratos:
 * - Reserva 15/nov 10:00 → 202511150001
 * - Reserva 15/nov 14:00 → 202511150002  
 * - Reserva 20/dic 09:00 → 202512200001
 */
async function generateContractNumber(pickupDate: Date, bookingId: number): Promise<string> {
  // Obtener componentes de fecha de INICIO de reserva
  const year = pickupDate.getFullYear().toString();
  const month = (pickupDate.getMonth() + 1).toString().padStart(2, '0');
  const day = pickupDate.getDate().toString().padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`;
  
  // Obtener la hora de salida de esta reserva
  const currentBooking = await prisma.carRentalBookings.findUnique({
    where: { id: bookingId },
    select: { pickup_date: true }
  });
  
  if (!currentBooking?.pickup_date) {
    throw new Error('No se pudo obtener la fecha de recogida de la reserva');
  }
  
  // Buscar todas las reservas que comienzan el mismo día
  const startOfDay = new Date(pickupDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(pickupDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Obtener todas las reservas del mismo día ordenadas por hora
  const allBookingsOfDay = await prisma.carRentalBookings.findMany({
    where: {
      pickup_date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    select: { 
      id: true,
      pickup_date: true
    },
    orderBy: {
      pickup_date: 'asc'
    }
  });
  
  // Encontrar la posición de esta reserva en el orden cronológico
  let position = 1;
  for (const booking of allBookingsOfDay) {
    if (booking.pickup_date && currentBooking.pickup_date) {
      if (booking.pickup_date < currentBooking.pickup_date) {
        position++;
      } else if (booking.pickup_date.getTime() === currentBooking.pickup_date.getTime() && booking.id < bookingId) {
        // Si tienen la misma hora exacta, usar el ID como desempate
        position++;
      }
    }
  }
  
  // Formatear el número secuencial con ceros a la izquierda (4 dígitos)
  const sequentialStr = position.toString().padStart(4, '0');
  
  return `${datePrefix}${sequentialStr}`;
}

// Función auxiliar para preparar todos los datos del contrato
async function prepareContractData(booking: any, contractNumber: string, signatureDate?: string, signatureTime?: string, ipAddress?: string, language?: string, signatureData?: string) {
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
        // Comprimir logo para reducir tamaño del PDF (300px, calidad 75%)
        logoBase64 = await getFileAsCompressedBase64(logoPath, 300, 75);
      } 
      // Si es una URL completa de S3
      else if (logoPath.includes('s3.amazonaws.com') || logoPath.includes('amazonaws.com')) {
        // Extraer el key de la URL
        const urlParts = logoPath.split('/');
        const keyIndex = urlParts.findIndex(part => part === 'uploads');
        if (keyIndex !== -1) {
          const s3Key = urlParts.slice(keyIndex).join('/');
          console.log('Cargando logo desde URL S3:', s3Key);
          // Comprimir logo para reducir tamaño del PDF (300px, calidad 75%)
          logoBase64 = await getFileAsCompressedBase64(s3Key, 300, 75);
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

  // ✅ Preparar vehículos SIN inspecciones (solo datos básicos)
  const vehicles = [];
  if (booking.vehicles && booking.vehicles.length > 0) {
    // Reserva con múltiples vehículos
    for (const vb of booking.vehicles) {
      vehicles.push({
        registration: vb.car?.registration_number || 'N/A',
        make: vb.car?.make || '',
        model: vb.car?.model || '',
        pricePerDay: parseFloat(vb.vehicle_price?.toString() || '0') / days,
        days: days,
        total: parseFloat(vb.vehicle_price?.toString() || '0')
      });
    }
  } else if (booking.car) {
    // Reserva con un solo vehículo (legacy)
    vehicles.push({
      registration: booking.car.registration_number || 'N/A',
      make: booking.car.make || '',
      model: booking.car.model || '',
      pricePerDay: parseFloat(booking.car.daily_rate?.toString() || '0'),
      days: days,
      total: parseFloat(booking.car.daily_rate?.toString() || '0') * days
    });
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
  const contractLanguage = language || booking.customer.language || 'es';

  // Generar o obtener enlace público de inspección
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
    }

    // Generar URL del enlace
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
    inspectionLink = `${baseUrl}/inspeccion/${existingLink.token}`;
  } catch (error) {
    console.error('Error generando enlace de inspección:', error);
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
    pickupLocation: booking.pickupLocation?.name || 'No especificada',
    returnLocation: booking.returnLocation?.name || 'No especificada',
    subtotal,
    iva,
    totalPrice: totalPriceNum.toFixed(2),
    comments: booking.notes || undefined,
    signatureDate,
    signatureTime,
    signatureData, // ✅ NUEVO: Firma digital en Base64
    ipAddress,
    primaryColor: companyConfig?.primary_color || undefined,
    secondaryColor: companyConfig?.secondary_color || undefined,
    logoBase64: logoBase64,
    companyName: companyConfig?.company_name || undefined,
    language: contractLanguage as any,
    inspectionLink: inspectionLink // ✅ NUEVO: Enlace público de inspección
  });
}

// GET /api/contracts?bookingId=123 - Obtener contrato de una reserva
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Falta bookingId' }, { status: 400 });
    }

    // Buscar si ya existe un contrato para esta reserva
    let contract = await prisma.carRentalContracts.findUnique({
      where: {
        booking_id: parseInt(bookingId)
      },
      include: {
        booking: {
          include: {
            car: true,
            customer: true
          }
        }
      }
    });

    if (contract) {
      // ✅ CORRECCIÓN CRÍTICA: Siempre verificar si hay inspecciones nuevas y regenerar contrato
      const inspections = await prisma.vehicleInspections.findMany({
        where: { booking_id: parseInt(bookingId) }
      });
      
      // Verificar si el contrato fue creado ANTES de que existieran inspecciones
      const contractCreatedAt = contract.created_at ? new Date(contract.created_at) : new Date(0);
      const hasNewInspections = inspections.some(insp => {
        const inspDate = insp.inspection_date ? new Date(insp.inspection_date) : new Date();
        return inspDate > contractCreatedAt;
      });
      
      // Si el contrato NO está firmado O hay inspecciones nuevas, regenerarlo
      if (!contract.signed_at || hasNewInspections) {
        console.log(`🔄 Regenerando contrato ${contract.id} - Firmado: ${!!contract.signed_at}, Inspecciones nuevas: ${hasNewInspections}`);
        
        // ✅ CORRECCIÓN: Si está firmado Y hay inspecciones nuevas, usar regenerateSignedContract
        // para mantener la firma pero actualizar con las fotos
        if (contract.signed_at && hasNewInspections) {
          await regenerateSignedContract(
            parseInt(bookingId),
            'Actualización automática con fotos de inspección',
            session.user.email || 'system'
          );
        } else {
          // Si NO está firmado, usar regenerateContractIfNotSigned
          await regenerateContractIfNotSigned(
            parseInt(bookingId),
            'Sincronización al consultar contrato',
            session.user.email || 'system'
          );
        }
        
        // Volver a cargar el contrato actualizado
        contract = await prisma.carRentalContracts.findUnique({
          where: {
            booking_id: parseInt(bookingId)
          },
          include: {
            booking: {
              include: {
                car: true,
                customer: true
              }
            }
          }
        });
      }
      
      return NextResponse.json(contract);
    }

    // Si no existe contrato, generar uno nuevo (sin firmar)
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
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
        pickupLocation: true,  // ✅ Incluir ubicación de recogida
        returnLocation: true,  // ✅ Incluir ubicación de devolución
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (!booking.customer) {
      return NextResponse.json({ error: 'Datos incompletos de la reserva' }, { status: 400 });
    }

    if (!booking.pickup_date) {
      return NextResponse.json({ error: 'La reserva no tiene fecha de recogida' }, { status: 400 });
    }

    // Generar el texto del contrato usando la fecha de pickup de la reserva
    const contractNumber = await generateContractNumber(booking.pickup_date, booking.id);
    const contractText = await prepareContractData(booking, contractNumber, undefined, undefined, undefined, booking.customer?.preferred_language || undefined);

    // Crear contrato sin firmar
    const newContract = await prisma.carRentalContracts.create({
      data: {
        booking_id: booking.id,
        customer_id: booking.customer.id,
        contract_number: contractNumber,
        contract_text: contractText
      },
      include: {
        booking: {
          include: {
            car: true,
            customer: true
          }
        }
      }
    });

    return NextResponse.json(newContract);
  } catch (error) {
    console.error('Error obteniendo contrato:', error);
    return NextResponse.json(
      { error: 'Error obteniendo contrato' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Crear o firmar contrato
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, signatureData } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Falta bookingId' }, { status: 400 });
    }

    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
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
        pickupLocation: true,  // ✅ Incluir ubicación de recogida
        returnLocation: true,  // ✅ Incluir ubicación de devolución
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (!booking.customer) {
      return NextResponse.json({ error: 'Datos incompletos de la reserva' }, { status: 400 });
    }

    // Buscar contrato existente
    let contract = await prisma.carRentalContracts.findUnique({
      where: { booking_id: parseInt(bookingId) }
    });

    if (contract) {
      // Actualizar con firma si se proporciona
      if (signatureData) {
        const headers = request.headers;
        const forwarded = headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : headers.get('x-real-ip') || 'unknown';
        const userAgent = headers.get('user-agent') || 'unknown';

        const now = new Date();
        const signatureDate = now.toLocaleDateString('es-ES');
        const signatureTime = now.toLocaleTimeString('es-ES');

        // Regenerar el contrato con los datos de firma
        const contractText = await prepareContractData(
          booking, 
          contract.contract_number, 
          signatureDate, 
          signatureTime, 
          ip,
          booking.customer?.preferred_language || undefined,
          signatureData // ✅ NUEVO: Pasar la firma digital
        );

        contract = await prisma.carRentalContracts.update({
          where: { id: contract.id },
          data: {
            signed_at: new Date(),
            signature_data: signatureData,
            contract_text: contractText,
            ip_address: ip,
            user_agent: userAgent
          }
        });
        
        // ⚠️ DESHABILITADO TEMPORALMENTE: Generación automática de PDF
        // La generación de PDF se hará bajo demanda en /api/contracts/[id]/download
        console.log(`✅ [Contrato] Contrato firmado correctamente (PDF se generará bajo demanda)`);
      }
    } else {
      // Crear nuevo contrato usando la fecha de pickup de la reserva
      if (!booking.pickup_date) {
        return NextResponse.json({ error: 'La reserva no tiene fecha de recogida' }, { status: 400 });
      }
      
      const contractNumber = await generateContractNumber(booking.pickup_date, booking.id);
      
      let contractText = await prepareContractData(booking, contractNumber, undefined, undefined, undefined, booking.customer?.preferred_language || undefined);

      const contractData: any = {
        booking_id: booking.id,
        customer_id: booking.customer.id,
        contract_number: contractNumber,
        contract_text: contractText
      };

      if (signatureData) {
        const headers = request.headers;
        const forwarded = headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : headers.get('x-real-ip') || 'unknown';
        const userAgent = headers.get('user-agent') || 'unknown';

        const now = new Date();
        const signatureDate = now.toLocaleDateString('es-ES');
        const signatureTime = now.toLocaleTimeString('es-ES');

        // Regenerar con datos de firma
        contractText = await prepareContractData(
          booking, 
          contractNumber, 
          signatureDate, 
          signatureTime, 
          ip,
          booking.customer?.preferred_language || undefined
        );

        contractData.signed_at = new Date();
        contractData.signature_data = signatureData;
        contractData.contract_text = contractText;
        contractData.ip_address = ip;
        contractData.user_agent = userAgent;
      }

      contract = await prisma.carRentalContracts.create({
        data: contractData
      });
      
      // ⚠️ DESHABILITADO TEMPORALMENTE: Generación automática de PDF
      // La generación de PDF se hará bajo demanda en /api/contracts/[id]/download
      if (signatureData) {
        console.log(`✅ [Contrato] Contrato firmado correctamente (PDF se generará bajo demanda)`);

        // ✅ NUEVO: Enviar email si ya existe inspección de salida
        console.log(`\n📧 [Contrato] Verificando si enviar email de confirmación...`);
        
        try {
          const deliveryInspection = await prisma.vehicleInspections.findFirst({
            where: {
              booking_id: booking.id,
              inspection_type: { in: ['delivery', 'DELIVERY', 'checkin', 'CHECKIN'] }
            }
          });
          
          if (deliveryInspection) {
            console.log(`✅ [Contrato] Inspección de salida encontrada (ID ${deliveryInspection.id})`);
            console.log(`📧 [Contrato] Enviando email de confirmación...`);
            
            const { sendContractConfirmationEmail } = await import('@/lib/inspection-email-notifier');
            const emailResult = await sendContractConfirmationEmail(booking.id);
            
            if (emailResult.success) {
              console.log(`✅ [Contrato] ✉️  Email enviado correctamente`);
            } else {
              console.error(`❌ [Contrato] Error enviando email: ${emailResult.error}`);
            }
          } else {
            console.log(`ℹ️  [Contrato] No hay inspección de salida aún`);
            console.log(`   El email se enviará automáticamente al completar la inspección de salida`);
          }
        } catch (emailError) {
          console.error(`❌ [Contrato] Error verificando/enviando email:`, emailError);
        }
      }
    }

    const updatedContract = await prisma.carRentalContracts.findUnique({
      where: { id: contract.id },
      include: {
        booking: {
          include: {
            car: true,
            customer: true
          }
        }
      }
    });

    return NextResponse.json(updatedContract);
  } catch (error) {
    console.error('Error creando/actualizando contrato:', error);
    return NextResponse.json(
      { error: 'Error procesando contrato' },
      { status: 500 }
    );
  }
}