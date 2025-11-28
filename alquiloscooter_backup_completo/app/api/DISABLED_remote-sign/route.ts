
// import { launchBrowser } from '@/lib/puppeteer-launcher'; // DISABLED - file not used

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/contracts/remote-sign?token=xxx - Obtener contrato para firma remota (sin autenticación)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    // Buscar contrato por token
    const contract = await prisma.carRentalContracts.findUnique({
      where: { remote_signature_token: token },
      include: {
        booking: {
          include: {
            customer: true,
            car: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ 
        error: 'Token inválido',
        errorCode: 'INVALID_TOKEN'
      }, { status: 404 });
    }

    // Verificar si el token ha expirado
    if (contract.remote_signature_token_expires && 
        new Date(contract.remote_signature_token_expires) < new Date()) {
      return NextResponse.json({ 
        error: 'El enlace de firma ha expirado',
        errorCode: 'TOKEN_EXPIRED'
      }, { status: 410 });
    }

    // Verificar si ya está firmado
    if (contract.signed_at) {
      return NextResponse.json({ 
        error: 'El contrato ya ha sido firmado',
        errorCode: 'ALREADY_SIGNED',
        signedAt: contract.signed_at
      }, { status: 400 });
    }

    // Devolver datos del contrato (sin datos sensibles)
    return NextResponse.json({
      id: contract.id,
      contractNumber: contract.contract_number,
      contractText: contract.contract_text,
      customer: {
        firstName: contract.booking.customer?.first_name || '',
        lastName: contract.booking.customer?.last_name || '',
        email: contract.booking.customer?.email || ''
      },
      isSigned: false
    });

  } catch (error) {
    console.error('Error obteniendo contrato para firma remota:', error);
    return NextResponse.json(
      { error: 'Error obteniendo contrato' },
      { status: 500 }
    );
  }
}

// POST /api/contracts/remote-sign - Firmar contrato remotamente (sin autenticación)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signatureData } = body;

    if (!token || !signatureData) {
      return NextResponse.json({ 
        error: 'Token y firma son requeridos' 
      }, { status: 400 });
    }

    // Buscar contrato por token
    const contract = await prisma.carRentalContracts.findUnique({
      where: { remote_signature_token: token },
      include: {
        booking: {
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
            }
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ 
        error: 'Token inválido',
        errorCode: 'INVALID_TOKEN'
      }, { status: 404 });
    }

    // Verificar si el token ha expirado
    if (contract.remote_signature_token_expires && 
        new Date(contract.remote_signature_token_expires) < new Date()) {
      return NextResponse.json({ 
        error: 'El enlace de firma ha expirado',
        errorCode: 'TOKEN_EXPIRED'
      }, { status: 410 });
    }

    // Verificar si ya está firmado
    if (contract.signed_at) {
      return NextResponse.json({ 
        error: 'El contrato ya ha sido firmado',
        errorCode: 'ALREADY_SIGNED'
      }, { status: 400 });
    }

    // Obtener IP y user agent
    const headers = request.headers;
    const forwarded = headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    const now = new Date();

    // Importar función para regenerar contrato con datos de firma
    const { generateContract } = await import('@/lib/contracts/template');
    const { getFileAsBase64 } = await import('@/lib/s3');
    
    // Preparar datos del contrato con firma
    const booking = contract.booking;
    
    // Obtener configuración de la empresa
    const companyConfig = await prisma.companyConfig.findFirst({
      where: { active: true }
    });

    let logoBase64 = null;
    if (companyConfig?.logo_url) {
      try {
        logoBase64 = await getFileAsBase64(companyConfig.logo_url);
      } catch (error) {
        console.error('Error cargando logo:', error);
      }
    }

    // Calcular días y totales
    const pickupDate = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
    const returnDate = booking.return_date ? new Date(booking.return_date) : new Date();
    const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

    const vehicles = booking.vehicles && booking.vehicles.length > 0
      ? booking.vehicles.map((vb: any) => ({
          registration: vb.car?.registration_number || 'N/A',
          make: vb.car?.make || '',
          model: vb.car?.model || '',
          pricePerDay: parseFloat(vb.vehicle_price?.toString() || '0') / days,
          days: days,
          total: parseFloat(vb.vehicle_price?.toString() || '0')
        }))
      : booking.car
      ? [{
          registration: booking.car.registration_number || 'N/A',
          make: booking.car.make || '',
          model: booking.car.model || '',
          pricePerDay: 0,
          days: days,
          total: 0
        }]
      : [];

    const additionalDrivers = booking.drivers?.map((driver: any) => ({
      fullName: driver.full_name || 'N/A',
      license: driver.driver_license || undefined
    })) || [];

    const extras = booking.extras?.map((eb: any) => ({
      description: eb.extra?.name || 'Extra',
      priceUnit: parseFloat(eb.unit_price?.toString() || '0'),
      quantity: eb.quantity || 1,
      total: parseFloat(eb.total_price?.toString() || '0')
    })) || [];

    const upgrades = booking.upgrades?.map((ub: any) => ({
      description: ub.upgrade?.name || 'Upgrade',
      priceUnit: parseFloat(ub.unit_price_per_day?.toString() || '0'),
      quantity: ub.days || 1,
      total: parseFloat(ub.total_price?.toString() || '0')
    })) || [];

    const vehiclesTotal = vehicles.reduce((sum: number, v: any) => sum + v.total, 0);
    const extrasTotal = extras.reduce((sum: number, e: any) => sum + e.total, 0);
    const upgradesTotal = upgrades.reduce((sum: number, u: any) => sum + u.total, 0);
    const totalPriceNum = vehiclesTotal + extrasTotal + upgradesTotal;
    const subtotal = totalPriceNum / 1.21;
    const iva = totalPriceNum - subtotal;

    const contractLanguage = booking.customer?.preferred_language || 'es';
    const signatureDate = now.toLocaleDateString(contractLanguage === 'es' ? 'es-ES' : 'en-US');
    const signatureTime = now.toLocaleTimeString(contractLanguage === 'es' ? 'es-ES' : 'en-US');

    // Generar texto del contrato con firma
    const contractText = generateContract({
      contractNumber: contract.contract_number,
      contractDate: new Date().toLocaleDateString(contractLanguage === 'es' ? 'es-ES' : 'en-US'),
      customerFullname: `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`,
      customerDni: booking.customer?.dni_nie || '',
      customerPhone: booking.customer?.phone || '',
      customerEmail: booking.customer?.email || '',
      customerAddress: booking.customer?.street_address || booking.customer?.address || '',
      driverLicense: booking.customer?.driver_license || '',
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
      comments: undefined,
      signatureDate,
      signatureTime,
      ipAddress: ip,
      primaryColor: companyConfig?.primary_color || undefined,
      secondaryColor: companyConfig?.secondary_color || undefined,
      logoBase64: logoBase64,
      companyName: companyConfig?.company_name || undefined,
      language: contractLanguage as any,
    });

    // Actualizar contrato con firma
    const updatedContract = await prisma.carRentalContracts.update({
      where: { id: contract.id },
      data: {
        signed_at: now,
        signature_data: signatureData,
        contract_text: contractText,
        ip_address: ip,
        user_agent: userAgent,
        // Invalidar token después de firmar
        remote_signature_token: null,
        remote_signature_token_expires: null
      }
    });

    // 📄 Generar y subir PDF del contrato firmado (S3 + Google Drive)
    try {
      console.log(`📄 Generando PDF del contrato firmado con Chrome del sistema...`);
      const puppeteer = await import('puppeteer');
      
      const browser = await puppeteer.launch(); // DISABLED file - using direct launch

      const page = await browser.newPage();
      await page.setContent(contractText, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
        displayHeaderFooter: false,
      });

      await browser.close();

      // 1️⃣ SUBIR A S3 (CRÍTICO PARA LA DESCARGA)
      try {
        const { uploadFile } = await import('@/lib/s3');
        const { getBucketConfig } = await import('@/lib/aws-config');
        const { folderPrefix } = getBucketConfig();
        
        const fileName = `Contrato_${updatedContract.contract_number}_Firmado.pdf`;
        const s3Key = `${folderPrefix}contratos/${fileName}`;
        
        console.log(`☁️ [S3] Subiendo PDF a: ${s3Key}`);
        const s3Path = await uploadFile(Buffer.from(pdfBuffer), s3Key);
        
        if (s3Path) {
          // Actualizar contrato con la ruta del PDF en S3
          await prisma.carRentalContracts.update({
            where: { id: contract.id },
            data: {
              pdf_cloud_storage_path: s3Path
            }
          });
          
          console.log(`✅ [S3] PDF guardado en: ${s3Path}`);
        } else {
          console.error('❌ [S3] uploadFile() retornó null');
        }
      } catch (s3Error) {
        console.error('❌ [S3] Error subiendo PDF:', s3Error);
      }

      // 2️⃣ SUBIR A GOOGLE DRIVE (BACKUP)
      try {
        const { createBookingFolder, uploadFileToBookingFolder } = await import('@/lib/google-drive');
        
        let folderId = contract.booking.google_drive_folder_id;
        
        // Si no hay carpeta, crearla
        if (!folderId) {
          const customerName = contract.booking.customer_name || 
                              `${contract.booking.customer?.first_name || ''} ${contract.booking.customer?.last_name || ''}`.trim() || 
                              'Cliente';
          const customerId = contract.booking.customer_id || 0;
          
          const folderResult = await createBookingFolder(
            contract.booking.booking_number || `RES-${contract.booking_id}`,
            customerName,
            customerId
          );
          
          if (folderResult.success && folderResult.folderId) {
            folderId = folderResult.folderId;
            
            // Actualizar booking con folder ID
            await prisma.carRentalBookings.update({
              where: { id: contract.booking_id },
              data: {
                google_drive_folder_id: folderId,
                google_drive_folder_url: folderResult.folderUrl
              }
            });
            
            console.log(`✅ [Google Drive] Carpeta creada: ${folderResult.folderUrl}`);
          } else {
            console.error(`❌ [Google Drive] Error creando carpeta: ${folderResult.error}`);
          }
        }
        
        // Subir contrato firmado si hay carpeta
        if (folderId) {
          const result = await uploadFileToBookingFolder(
            contract.booking.booking_number || `RES-${contract.booking_id}`,
            `Contrato-${updatedContract.contract_number}-Firmado.pdf`,
            Buffer.from(pdfBuffer),
            'application/pdf'
          );

          if (result.success) {
            console.log(`✅ [Google Drive] Contrato firmado subido: ${result.fileUrl}`);
          } else {
            console.error(`❌ [Google Drive] Error subiendo contrato: ${result.error}`);
          }
        }
      } catch (driveError) {
        console.error('❌ [Google Drive] Error general:', driveError);
      }
    } catch (pdfError) {
      console.error('❌ Error generando/subiendo PDF del contrato firmado:', pdfError);
    }

    // TODO: Enviar notificación al staff de que el contrato fue firmado

    return NextResponse.json({
      success: true,
      contractNumber: updatedContract.contract_number,
      signedAt: updatedContract.signed_at
    });

  } catch (error) {
    console.error('Error firmando contrato remotamente:', error);
    return NextResponse.json(
      { error: 'Error procesando firma' },
      { status: 500 }
    );
  }
}