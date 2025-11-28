
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInspectionPDFBuffer } from '@/lib/inspection-pdf-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 🔍 ENDPOINT DE DEBUG: Generación de PDFs y Adjuntos de Email
 * 
 * Uso: GET /api/debug/email-attachments?bookingId=143
 * 
 * Este endpoint diagnóstica todo el flujo de generación de PDFs y adjuntos:
 * 1. ¿Se genera el PDF del contrato?
 * 2. ¿Se genera el PDF de la inspección?
 * 3. ¿Cuál es el tamaño de cada PDF?
 * 4. ¿Qué errores ocurren?
 * 5. ¿El SMTP los rechaza?
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Falta parámetro bookingId' },
      { status: 400 }
    );
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    bookingId: parseInt(bookingId),
    steps: [],
    pdfs: {},
    errors: [],
    smtpConfig: {
      host: process.env.SMTP_HOST || 'NO CONFIGURADO',
      port: process.env.SMTP_PORT || 'NO CONFIGURADO',
      user: process.env.SMTP_USER || 'NO CONFIGURADO',
      from: process.env.SMTP_FROM || 'NO CONFIGURADO',
      configured: !!process.env.SMTP_HOST
    }
  };

  try {
    // ============================================================
    // PASO 1: Verificar que existe la reserva
    // ============================================================
    diagnostics.steps.push('🔍 Verificando reserva en base de datos...');
    
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        customer: true,
        contract: true,
        vehicles: {
          include: {
            car: true
          }
        },
        inspections: {
          where: {
            inspection_type: 'delivery'
          },
          orderBy: {
            inspection_date: 'desc'
          },
          take: 1
        }
      }
    });

    if (!booking) {
      diagnostics.errors.push('❌ Reserva no encontrada');
      return NextResponse.json(diagnostics, { status: 404 });
    }

    diagnostics.booking = {
      id: booking.id,
      number: booking.booking_number,
      customer: booking.customer?.email,
      hasContract: !!booking.contract,
      hasDeliveryInspection: booking.inspections && booking.inspections.length > 0,
      vehicleCount: booking.vehicles?.length || 0
    };

    diagnostics.steps.push(`✅ Reserva encontrada: ${booking.booking_number}`);
    diagnostics.steps.push(`   Cliente: ${booking.customer?.email}`);
    diagnostics.steps.push(`   Contrato: ${booking.contract ? 'Sí' : 'No'}`);
    diagnostics.steps.push(`   Inspección entrega: ${booking.inspections && booking.inspections.length > 0 ? 'Sí' : 'No'}`);

    // ============================================================
    // PASO 2: Verificar requisitos para adjuntos
    // ============================================================
    diagnostics.steps.push('\n📋 Verificando requisitos para adjuntos...');

    const hasCustomer = !!booking.customer;
    const hasContract = !!booking.contract;
    const hasContractText = !!booking.contract?.contract_text;
    const hasDeliveryInspection = booking.inspections && booking.inspections.length > 0;

    diagnostics.requirements = {
      customer: hasCustomer,
      contract: hasContract,
      contractText: hasContractText,
      deliveryInspection: hasDeliveryInspection,
      allMet: hasCustomer && hasContract && hasContractText && hasDeliveryInspection
    };

    if (!diagnostics.requirements.allMet) {
      diagnostics.errors.push('⚠️ No se cumplen todos los requisitos para generar adjuntos');
      diagnostics.steps.push(`   ${hasCustomer ? '✅' : '❌'} Cliente`);
      diagnostics.steps.push(`   ${hasContract ? '✅' : '❌'} Contrato`);
      diagnostics.steps.push(`   ${hasContractText ? '✅' : '❌'} Contract Text`);
      diagnostics.steps.push(`   ${hasDeliveryInspection ? '✅' : '❌'} Inspección de Entrega`);
      return NextResponse.json(diagnostics, { status: 200 });
    }

    diagnostics.steps.push('✅ Todos los requisitos se cumplen');

    // ============================================================
    // PASO 3: Intentar generar PDF del CONTRATO
    // ============================================================
    diagnostics.steps.push('\n📄 Generando PDF del contrato...');
    
    try {
      const htmlPdf = require('html-pdf-node');
      
      const options = { 
        format: 'A4',
        printBackground: true,
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm'
        }
      };
      
      const contractHtmlLength = booking.contract!.contract_text!.length;
      diagnostics.steps.push(`   HTML del contrato: ${contractHtmlLength.toLocaleString()} caracteres`);
      
      const startTime = Date.now();
      const file = { content: booking.contract!.contract_text };
      const contractPdfBuffer = await htmlPdf.generatePdf(file, options);
      const duration = Date.now() - startTime;

      diagnostics.pdfs.contract = {
        success: true,
        size: contractPdfBuffer.length,
        sizeKB: Math.round(contractPdfBuffer.length / 1024),
        sizeMB: (contractPdfBuffer.length / (1024 * 1024)).toFixed(2),
        generationTimeMs: duration,
        htmlLength: contractHtmlLength
      };

      diagnostics.steps.push(`✅ PDF del contrato generado exitosamente`);
      diagnostics.steps.push(`   Tamaño: ${diagnostics.pdfs.contract.sizeKB} KB (${diagnostics.pdfs.contract.sizeMB} MB)`);
      diagnostics.steps.push(`   Tiempo: ${duration}ms`);

    } catch (contractError: any) {
      diagnostics.pdfs.contract = {
        success: false,
        error: contractError.message,
        stack: contractError.stack
      };
      diagnostics.errors.push(`❌ Error generando PDF de contrato: ${contractError.message}`);
      diagnostics.steps.push(`❌ Error generando PDF de contrato`);
      diagnostics.steps.push(`   Error: ${contractError.message}`);
    }

    // ============================================================
    // PASO 4: Intentar generar PDF de INSPECCIÓN
    // ============================================================
    diagnostics.steps.push('\n🔍 Generando PDF de inspección...');

    if (booking.inspections && booking.inspections.length > 0) {
      try {
        const deliveryInspection = booking.inspections[0];
        diagnostics.steps.push(`   ID de inspección: ${deliveryInspection.id}`);
        
        const startTime = Date.now();
        const deliveryPdfBuffer = await generateInspectionPDFBuffer(deliveryInspection.id);
        const duration = Date.now() - startTime;

        diagnostics.pdfs.inspection = {
          success: true,
          inspectionId: deliveryInspection.id,
          size: deliveryPdfBuffer.length,
          sizeKB: Math.round(deliveryPdfBuffer.length / 1024),
          sizeMB: (deliveryPdfBuffer.length / (1024 * 1024)).toFixed(2),
          generationTimeMs: duration
        };

        diagnostics.steps.push(`✅ PDF de inspección generado exitosamente`);
        diagnostics.steps.push(`   Tamaño: ${diagnostics.pdfs.inspection.sizeKB} KB (${diagnostics.pdfs.inspection.sizeMB} MB)`);
        diagnostics.steps.push(`   Tiempo: ${duration}ms`);

      } catch (inspectionError: any) {
        diagnostics.pdfs.inspection = {
          success: false,
          error: inspectionError.message,
          stack: inspectionError.stack
        };
        diagnostics.errors.push(`❌ Error generando PDF de inspección: ${inspectionError.message}`);
        diagnostics.steps.push(`❌ Error generando PDF de inspección`);
        diagnostics.steps.push(`   Error: ${inspectionError.message}`);
      }
    } else {
      diagnostics.pdfs.inspection = {
        success: false,
        error: 'No hay inspección de entrega'
      };
      diagnostics.steps.push('⚠️ No hay inspección de entrega para generar PDF');
    }

    // ============================================================
    // PASO 5: Calcular tamaño total de adjuntos
    // ============================================================
    let totalSize = 0;
    if (diagnostics.pdfs.contract?.success) {
      totalSize += diagnostics.pdfs.contract.size;
    }
    if (diagnostics.pdfs.inspection?.success) {
      totalSize += diagnostics.pdfs.inspection.size;
    }

    diagnostics.totalAttachmentsSize = {
      bytes: totalSize,
      kb: Math.round(totalSize / 1024),
      mb: (totalSize / (1024 * 1024)).toFixed(2),
      exceedsLimit: totalSize > 10 * 1024 * 1024 // 10MB
    };

    diagnostics.steps.push('\n📦 Tamaño total de adjuntos:');
    diagnostics.steps.push(`   Total: ${diagnostics.totalAttachmentsSize.kb} KB (${diagnostics.totalAttachmentsSize.mb} MB)`);
    
    if (diagnostics.totalAttachmentsSize.exceedsLimit) {
      diagnostics.errors.push('⚠️ El tamaño total supera 10MB, puede ser rechazado por el servidor SMTP');
      diagnostics.steps.push('   ⚠️ ADVERTENCIA: Supera 10MB, puede ser rechazado por SMTP');
    } else {
      diagnostics.steps.push('   ✅ Tamaño aceptable para SMTP');
    }

    // ============================================================
    // PASO 6: Intentar envío de EMAIL (opcional, solo si se pasa test=true)
    // ============================================================
    const shouldTestEmail = searchParams.get('test') === 'true';
    
    if (shouldTestEmail && diagnostics.smtpConfig.configured) {
      diagnostics.steps.push('\n📧 Intentando envío de email de prueba...');
      
      try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false
          },
          debug: true,
          logger: false
        });

        // Verificar conexión
        diagnostics.steps.push('   🔌 Verificando conexión SMTP...');
        await transporter.verify();
        diagnostics.steps.push('   ✅ Conexión SMTP verificada');

        // Preparar adjuntos
        const attachments: any[] = [];
        
        if (diagnostics.pdfs.contract?.success) {
          // Aquí normalmente iría el buffer del PDF, pero para el test solo simulamos
          diagnostics.steps.push('   ✅ Adjunto de contrato preparado');
        }
        
        if (diagnostics.pdfs.inspection?.success) {
          diagnostics.steps.push('   ✅ Adjunto de inspección preparado');
        }

        diagnostics.emailTest = {
          smtpVerified: true,
          attachmentCount: attachments.length,
          message: 'Email NO enviado (solo prueba de conexión). Para enviar el email real, usar el endpoint /api/test-inspection-email'
        };

      } catch (emailError: any) {
        diagnostics.emailTest = {
          success: false,
          error: emailError.message,
          code: emailError.code
        };
        diagnostics.errors.push(`❌ Error en prueba de email: ${emailError.message}`);
        diagnostics.steps.push(`❌ Error en prueba de email: ${emailError.message}`);
      }
    } else if (shouldTestEmail && !diagnostics.smtpConfig.configured) {
      diagnostics.steps.push('\n⚠️ SMTP no configurado, no se puede probar email');
    }

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    diagnostics.summary = {
      contractPdfGenerated: diagnostics.pdfs.contract?.success || false,
      inspectionPdfGenerated: diagnostics.pdfs.inspection?.success || false,
      totalErrors: diagnostics.errors.length,
      canSendEmail: diagnostics.smtpConfig.configured && 
                    diagnostics.pdfs.contract?.success && 
                    diagnostics.pdfs.inspection?.success &&
                    !diagnostics.totalAttachmentsSize.exceedsLimit
    };

    diagnostics.steps.push('\n📊 RESUMEN:');
    diagnostics.steps.push(`   PDF Contrato: ${diagnostics.pdfs.contract?.success ? '✅' : '❌'}`);
    diagnostics.steps.push(`   PDF Inspección: ${diagnostics.pdfs.inspection?.success ? '✅' : '❌'}`);
    diagnostics.steps.push(`   Errores: ${diagnostics.errors.length}`);
    diagnostics.steps.push(`   Puede enviar email: ${diagnostics.summary.canSendEmail ? '✅ SÍ' : '❌ NO'}`);

    if (diagnostics.errors.length > 0) {
      diagnostics.steps.push('\n❌ ERRORES ENCONTRADOS:');
      diagnostics.errors.forEach((error: string) => {
        diagnostics.steps.push(`   - ${error}`);
      });
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    diagnostics.errors.push(`❌ Error fatal: ${error.message}`);
    diagnostics.steps.push(`\n❌ ERROR FATAL: ${error.message}`);
    diagnostics.fatalError = {
      message: error.message,
      stack: error.stack
    };
    
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
