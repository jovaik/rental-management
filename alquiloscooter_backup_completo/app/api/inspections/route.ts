
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, downloadFile } from '@/lib/s3';
import { getBookingFilePath } from '@/lib/booking-number';

export const dynamic = 'force-dynamic';

// GET /api/inspections?bookingId=123 - Obtener inspecciones de una reserva
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

    const inspections = await prisma.vehicleInspections.findMany({
      where: {
        booking_id: parseInt(bookingId)
      },
      include: {
        damages: true,
        extras: true,
        inspector: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: {
        inspection_date: 'asc'
      }
    });

    // ✅ SOLUCIÓN DEFINITIVA: Convertir rutas S3 a URLs del proxy interno (nunca expiran)
    /**
     * Convierte una ruta de S3 a una URL del proxy interno que nunca expira
     */
    const convertToProxyUrl = (s3Path: string | null): string | null => {
      if (!s3Path) return null;
      // Remover el prefijo del bucket si existe
      const cleanPath = s3Path.replace(/^rental-app-storage\//, '');
      return `/api/s3/image/${cleanPath}`;
    };

    const inspectionsWithProxyUrls = inspections.map((inspection: any) => {
      // Convertir fotos principales usando el proxy
      const frontPhotoUrl = convertToProxyUrl(inspection.front_photo);
      const leftPhotoUrl = convertToProxyUrl(inspection.left_photo);
      const rearPhotoUrl = convertToProxyUrl(inspection.rear_photo);
      const rightPhotoUrl = convertToProxyUrl(inspection.right_photo);
      const odometerPhotoUrl = convertToProxyUrl(inspection.odometer_photo);

      // Convertir fotos de daños
      const damagesWithProxyUrls = inspection.damages.map((damage: any) => ({
        ...damage,
        photo_url: convertToProxyUrl(damage.photo_url)
      }));

      return {
        ...inspection,
        front_photo: frontPhotoUrl,
        left_photo: leftPhotoUrl,
        rear_photo: rearPhotoUrl,
        right_photo: rightPhotoUrl,
        odometer_photo: odometerPhotoUrl,
        damages: damagesWithProxyUrls
      };
    });

    return NextResponse.json(inspectionsWithProxyUrls);
  } catch (error) {
    console.error('Error obteniendo inspecciones:', error);
    return NextResponse.json(
      { error: 'Error obteniendo inspecciones' },
      { status: 500 }
    );
  }
}

// POST /api/inspections - Crear nueva inspección
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const bookingId = formData.get('bookingId')?.toString();
    const inspectionType = formData.get('inspectionType')?.toString();
    const carId = formData.get('car_id')?.toString(); // ✅ NUEVO: ID del vehículo específico
    const odometerReading = formData.get('odometerReading')?.toString();
    const fuelLevel = formData.get('fuelLevel')?.toString();
    const generalCondition = formData.get('generalCondition')?.toString();
    const notes = formData.get('notes')?.toString();

    if (!bookingId || !inspectionType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Obtener datos de la reserva incluyendo fechas
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
      select: { 
        booking_number: true,
        pickup_date: true,
        return_date: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    const bookingNumber = booking.booking_number || `booking-${bookingId}`;
    
    // Determinar la fecha correcta de la inspección según el tipo
    // Para CHECKIN/DELIVERY: usar pickup_date (o fecha actual como fallback)
    // Para CHECKOUT/RETURN: SIEMPRE usar fecha actual (es cuando se hace REALMENTE la inspección)
    const inspectionDate = inspectionType === 'CHECKIN' || inspectionType === 'DELIVERY'
      ? (booking.pickup_date ? new Date(booking.pickup_date) : new Date())
      : new Date(); // ✅ CHECKOUT/RETURN siempre usa fecha actual

    // 🔍 DIAGNÓSTICO: Ver qué archivos llegaron
    console.log('📸 [Inspección] Archivos recibidos:');
    console.log('  - frontPhoto:', formData.get('frontPhoto') ? '✅ PRESENTE' : '❌ FALTA');
    console.log('  - leftPhoto:', formData.get('leftPhoto') ? '✅ PRESENTE' : '❌ FALTA');
    console.log('  - rearPhoto:', formData.get('rearPhoto') ? '✅ PRESENTE' : '❌ FALTA');
    console.log('  - rightPhoto:', formData.get('rightPhoto') ? '✅ PRESENTE' : '❌ FALTA');
    console.log('  - odometerPhoto:', formData.get('odometerPhoto') ? '✅ PRESENTE' : '❌ FALTA');

    // Subir fotos a S3 organizadas por expediente
    const uploadPhoto = async (file: File | null, prefix: string) => {
      if (!file) {
        console.log(`⚠️ [${prefix}] No hay archivo para subir`);
        return null;
      }
      
      console.log(`📤 [${prefix}] Subiendo archivo: ${file.name} (${file.size} bytes)`);
      
      try {
        let buffer = Buffer.from(await file.arrayBuffer());
        
        // ✅ CORRECCIÓN CRÍTICA: Procesar orientación EXIF antes de subir
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
          try {
            const sharp = require('sharp');
            console.log(`🔄 [${prefix}] Corrigiendo orientación EXIF...`);
            buffer = await sharp(buffer)
              .rotate() // Aplica rotación automática basada en metadatos EXIF
              .jpeg({ quality: 85 }) // Comprimir ligeramente manteniendo calidad
              .toBuffer();
            console.log(`✅ [${prefix}] Orientación corregida`);
          } catch (sharpError) {
            console.warn(`⚠️ [${prefix}] Error procesando con Sharp, usando buffer original:`, sharpError);
          }
        }
        
        // Generar nombre limpio y único: front-1234567890123.jpg
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000000);
        const fileName = `${prefix}-${timestamp}-${randomSuffix}.${extension}`;
        
        // Nueva estructura: expedientes/20251022001/inspecciones/front-123456-789012.jpg
        const expedienteFolder = getBookingFilePath(bookingNumber, 'inspecciones');
        const s3Key = `${expedienteFolder}${fileName}`;
        
        console.log(`📤 [${prefix}] Subiendo a S3:`, s3Key);
        const uploadedKey = await uploadFile(buffer, s3Key);
        console.log(`✅ [${prefix}] Subido exitosamente: ${uploadedKey}`);
        return uploadedKey;
      } catch (error) {
        console.error(`❌ [${prefix}] Error subiendo archivo:`, error);
        throw error;
      }
    };

    console.log('🚀 [Inspección] Iniciando subida de fotos a S3...');
    const frontPhoto = await uploadPhoto(formData.get('frontPhoto') as File, 'front');
    const leftPhoto = await uploadPhoto(formData.get('leftPhoto') as File, 'left');
    const rearPhoto = await uploadPhoto(formData.get('rearPhoto') as File, 'rear');
    const rightPhoto = await uploadPhoto(formData.get('rightPhoto') as File, 'right');
    const odometerPhoto = await uploadPhoto(formData.get('odometerPhoto') as File, 'odometer');
    
    console.log('✅ [Inspección] Todas las fotos procesadas');
    console.log('  - frontPhoto:', frontPhoto || 'NULL');
    console.log('  - leftPhoto:', leftPhoto || 'NULL');
    console.log('  - rearPhoto:', rearPhoto || 'NULL');
    console.log('  - rightPhoto:', rightPhoto || 'NULL');
    console.log('  - odometerPhoto:', odometerPhoto || 'NULL');

    // Crear inspección
    const inspection = await prisma.vehicleInspections.create({
      data: {
        booking_id: parseInt(bookingId),
        vehicle_id: carId ? parseInt(carId) : null, // ✅ NUEVO: Asociar inspección a vehículo específico
        inspection_type: inspectionType,
        inspection_date: inspectionDate, // ✅ Usar fecha correcta según tipo de inspección
        odometer_reading: odometerReading ? parseInt(odometerReading) : null,
        fuel_level: fuelLevel || null,
        front_photo: frontPhoto,
        left_photo: leftPhoto,
        rear_photo: rearPhoto,
        right_photo: rightPhoto,
        odometer_photo: odometerPhoto,
        general_condition: generalCondition || null,
        notes: notes || null,
        inspector_id: session.user.id ? parseInt(session.user.id) : null
      },
      include: {
        damages: true,
        extras: true,
        inspector: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    // ⚡ OPTIMIZACIÓN: Mover sincronización con Google Drive a background
    // No esperar respuesta, devolver inmediatamente al cliente
    Promise.resolve().then(async () => {
      // 📁 Subir fotos de inspección a Google Drive en background
      try {
        console.log(`📁 [Google Drive Background] Subiendo inspección ${inspectionType}...`);
        
        const { uploadFileFromS3ToGoogleDrive } = await import('@/lib/google-drive');
        
        const photos = [
          { key: frontPhoto, name: `Inspeccion-${inspectionType}-Frontal.jpg` },
          { key: leftPhoto, name: `Inspeccion-${inspectionType}-Izquierda.jpg` },
          { key: rearPhoto, name: `Inspeccion-${inspectionType}-Trasera.jpg` },
          { key: rightPhoto, name: `Inspeccion-${inspectionType}-Derecha.jpg` },
          { key: odometerPhoto, name: `Inspeccion-${inspectionType}-Odometro.jpg` }
        ];

        let uploadedCount = 0;
        for (const photo of photos) {
          if (photo.key) {
            const result = await uploadFileFromS3ToGoogleDrive(
              bookingNumber,
              photo.name,
              photo.key
            );
            if (result.success) {
              uploadedCount++;
            }
          }
        }

        console.log(`✅ [Google Drive Background] ${uploadedCount}/5 fotos subidas`);
      } catch (driveError) {
        console.error('❌ [Google Drive Background] Error subiendo fotos:', driveError);
      }

      // 📄 Generar y subir PDF de inspección a Google Drive en background
      try {
        console.log(`📄 [Google Drive Background] Generando PDF inspección ${inspectionType}...`);
        const { generateAndUploadInspectionPDF } = await import('@/lib/google-drive');
        
        const pdfResult = await generateAndUploadInspectionPDF(
          bookingNumber,
          inspection.id,
          inspectionType
        );

        if (pdfResult.success) {
          console.log(`✅ [Google Drive Background] PDF generado y subido`);
        } else {
          console.error(`❌ [Google Drive Background] Error PDF: ${pdfResult.error}`);
        }
      } catch (pdfError) {
        console.error('❌ [Google Drive Background] Error generando PDF:', pdfError);
      }

      // 📧 FLUJO CORRECTO DE NOTIFICACIONES:
      // - DELIVERY (salida): Envía contrato + inspección salida (2 PDFs)
      // - RETURN (devolución): Envía PDF comparativo (1 PDF)
      try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 [Email Background] Iniciando proceso de notificación automática`);
        console.log(`  Tipo de inspección: ${inspectionType}`);
        console.log(`  Reserva: ${bookingNumber}`);
        console.log(`  Inspección ID: ${inspection.id}`);
        console.log(`${'='.repeat(80)}\n`);
        
        const isDelivery = inspectionType.toLowerCase() === 'delivery' || inspectionType.toLowerCase() === 'checkin';
        const isReturn = inspectionType.toLowerCase() === 'return' || inspectionType.toLowerCase() === 'checkout';
        
        if (isDelivery) {
          // ✅ INSPECCIÓN DE SALIDA: Enviar contrato + inspección
          console.log(`📧 [Email Background] → Detectada inspección de SALIDA`);
          console.log(`📧 [Email Background] → Verificando requisitos...`);
          
          // Verificar que existe contrato firmado
          const contractCheck = await prisma.carRentalContracts.findFirst({
            where: { 
              booking_id: parseInt(bookingId),
              signed_at: { not: null }
            }
          });
          
          if (!contractCheck) {
            console.error(`❌ [Email Background] ABORTADO: Contrato no firmado aún`);
            console.log(`   El email se enviará automáticamente cuando se firme el contrato\n`);
          } else {
            console.log(`✅ [Email Background] → Contrato firmado verificado`);
            console.log(`📧 [Email Background] → Enviando contrato + inspección de salida...`);
            
            const { sendContractConfirmationEmail } = await import('@/lib/inspection-email-notifier');
            const emailResult = await sendContractConfirmationEmail(parseInt(bookingId));
            
            if (emailResult.success) {
              console.log(`✅ [Email Background] ✉️  EMAIL ENVIADO CORRECTAMENTE`);
              console.log(`   Destinatario: Cliente + Admin`);
              console.log(`   Adjuntos: Contrato PDF + Inspección de Salida PDF\n`);
            } else {
              console.error(`❌ [Email Background] ERROR AL ENVIAR EMAIL`);
              console.error(`   Motivo: ${emailResult.error}\n`);
            }
          }
        } else if (isReturn) {
          // ✅ INSPECCIÓN DE DEVOLUCIÓN: Enviar PDF comparativo
          console.log(`📧 [Email Background] → Detectada inspección de DEVOLUCIÓN`);
          console.log(`📧 [Email Background] → Obteniendo datos completos...`);
          
          const { sendInspectionNotification } = await import('@/lib/inspection-email-notifier');
          
          // Obtener datos completos para el email
          const fullInspection: any = await prisma.vehicleInspections.findUnique({
            where: { id: inspection.id },
            include: {
              booking: {
                include: {
                  customer: true,
                  vehicles: {
                    include: {
                      car: true
                    }
                  }
                }
              },
              vehicle: true
            }
          });

          if (!fullInspection?.booking?.customer) {
            console.error(`❌ [Email Background] ABORTADO: Datos de reserva/cliente incompletos\n`);
          } else {
            const customer = fullInspection.booking.customer;
            const vehicle = fullInspection.vehicle || fullInspection.booking.vehicles[0]?.car;
            
            if (!customer.email) {
              console.error(`❌ [Email Background] ABORTADO: Cliente sin email registrado\n`);
            } else if (!vehicle) {
              console.error(`❌ [Email Background] ABORTADO: Información de vehículo no disponible\n`);
            } else {
              console.log(`✅ [Email Background] → Datos verificados`);
              console.log(`   Cliente: ${customer.first_name} ${customer.last_name}`);
              console.log(`   Email: ${customer.email}`);
              console.log(`   Vehículo: ${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`);
              console.log(`📧 [Email Background] → Enviando PDF comparativo...`);
              
              const emailResult = await sendInspectionNotification({
                inspectionId: inspection.id,
                bookingNumber: bookingNumber,
                customerEmail: customer.email,
                customerName: `${customer.first_name} ${customer.last_name}`,
                vehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`,
                inspectionType: inspectionType,
                inspectionDate: inspection.inspection_date,
                pickupDate: fullInspection.booking.pickup_date || undefined,
                returnDate: fullInspection.booking.return_date || undefined
              });

              if (emailResult.success) {
                console.log(`✅ [Email Background] ✉️  EMAIL ENVIADO CORRECTAMENTE`);
                console.log(`   Destinatario: ${customer.email} + Admin`);
                console.log(`   Adjunto: PDF Comparativo (Entrega vs Devolución)\n`);
              } else {
                console.error(`❌ [Email Background] ERROR AL ENVIAR EMAIL`);
                console.error(`   Motivo: ${emailResult.error}\n`);
              }
            }
          }
        } else {
          console.warn(`⚠️ [Email Background] Tipo de inspección no reconocido: ${inspectionType}`);
          console.warn(`   Valores esperados: 'delivery', 'checkin', 'return', 'checkout'\n`);
        }
      } catch (emailError: any) {
        console.error(`\n❌ [Email Background] EXCEPCIÓN NO CONTROLADA:`);
        console.error(`   Mensaje: ${emailError.message}`);
        console.error(`   Stack: ${emailError.stack}\n`);
      }
    }).catch(err => {
      console.error('❌ [Background Tasks] Error general:', err);
    });

    // ✅ Respuesta inmediata al cliente sin esperar Google Drive ni email
    return NextResponse.json(inspection);
  } catch (error) {
    console.error('Error creando inspección:', error);
    return NextResponse.json(
      { error: 'Error creando inspección' },
      { status: 500 }
    );
  }
}
