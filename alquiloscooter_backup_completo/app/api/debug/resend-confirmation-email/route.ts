
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInspectionPDFBuffer } from '@/lib/inspection-pdf-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 🔄 ENDPOINT DE DEBUG: Reenvío de Email de Confirmación
 * 
 * Uso: POST /api/debug/resend-confirmation-email?bookingId=143
 * 
 * Este endpoint reenvía el email de confirmación con logging completo
 * para diagnosticar problemas con adjuntos.
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Falta parámetro bookingId' },
      { status: 400 }
    );
  }

  const logs: string[] = [];
  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    logs.push(logMsg);
  };

  try {
    addLog(`📧 Iniciando reenvío de email para reserva ${bookingId}`);

    // ============================================================
    // PASO 1: Obtener datos de la reserva
    // ============================================================
    addLog('🔍 Consultando base de datos...');
    
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

    if (!booking || !booking.customer || !booking.contract) {
      addLog('❌ Reserva, cliente o contrato no encontrado');
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos',
        logs
      }, { status: 404 });
    }

    addLog(`✅ Reserva encontrada: ${booking.booking_number}`);
    addLog(`   Cliente: ${booking.customer.email}`);
    addLog(`   Contrato ID: ${booking.contract.id}`);
    addLog(`   Inspecciones: ${booking.inspections?.length || 0}`);

    // ============================================================
    // PASO 2: Verificar requisitos
    // ============================================================
    if (!booking.inspections || booking.inspections.length === 0) {
      addLog('❌ No hay inspección de salida, cancelando envío');
      return NextResponse.json({
        success: false,
        error: 'Inspección de salida no encontrada',
        logs
      }, { status: 400 });
    }

    // ============================================================
    // PASO 3: Configurar SMTP
    // ============================================================
    addLog('🔧 Configurando transporte SMTP...');
    addLog(`   Host: ${process.env.SMTP_HOST}`);
    addLog(`   Port: ${process.env.SMTP_PORT}`);
    addLog(`   User: ${process.env.SMTP_USER}`);

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
    addLog('🔌 Verificando conexión SMTP...');
    try {
      await transporter.verify();
      addLog('✅ Conexión SMTP verificada correctamente');
    } catch (verifyError: any) {
      addLog(`❌ Error verificando conexión SMTP: ${verifyError.message}`);
      return NextResponse.json({
        success: false,
        error: `Error SMTP: ${verifyError.message}`,
        logs
      }, { status: 500 });
    }

    // ============================================================
    // PASO 4: Generar PDF del CONTRATO
    // ============================================================
    const attachments: any[] = [];

    if (booking.contract.contract_text) {
      try {
        addLog('📄 Generando PDF del contrato...');
        addLog(`   Longitud HTML: ${booking.contract.contract_text.length.toLocaleString()} caracteres`);
        
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
        
        const startTime = Date.now();
        const file = { content: booking.contract.contract_text };
        const contractPdfBuffer = await htmlPdf.generatePdf(file, options);
        const duration = Date.now() - startTime;

        addLog(`✅ PDF del contrato generado`);
        addLog(`   Tamaño: ${Math.round(contractPdfBuffer.length / 1024)} KB`);
        addLog(`   Tiempo: ${duration}ms`);

        attachments.push({
          filename: `Contrato_${booking.booking_number}.pdf`,
          content: contractPdfBuffer,
          contentType: 'application/pdf'
        });

        addLog('✅ Adjunto de contrato añadido');

      } catch (error: any) {
        addLog(`❌ Error generando PDF de contrato: ${error.message}`);
        addLog(`   Stack: ${error.stack}`);
        // Continuar sin el contrato
      }
    }

    // ============================================================
    // PASO 5: Generar PDF de INSPECCIÓN
    // ============================================================
    if (booking.inspections && booking.inspections.length > 0) {
      try {
        const deliveryInspection = booking.inspections[0];
        addLog(`🔍 Generando PDF de inspección ID ${deliveryInspection.id}...`);
        
        const startTime = Date.now();
        const deliveryPdfBuffer = await generateInspectionPDFBuffer(deliveryInspection.id);
        const duration = Date.now() - startTime;

        addLog(`✅ PDF de inspección generado`);
        addLog(`   Tamaño: ${Math.round(deliveryPdfBuffer.length / 1024)} KB`);
        addLog(`   Tiempo: ${duration}ms`);

        attachments.push({
          filename: `Informe_Salida_${booking.booking_number}.pdf`,
          content: deliveryPdfBuffer,
          contentType: 'application/pdf'
        });

        addLog('✅ Adjunto de inspección añadido');

      } catch (error: any) {
        addLog(`❌ Error generando PDF de inspección: ${error.message}`);
        addLog(`   Stack: ${error.stack}`);
        // Continuar sin la inspección
      }
    }

    // ============================================================
    // PASO 6: Calcular tamaño total
    // ============================================================
    const totalSize = attachments.reduce((sum, att) => sum + att.content.length, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    addLog(`📦 Resumen de adjuntos:`);
    addLog(`   Cantidad: ${attachments.length}`);
    addLog(`   Tamaño total: ${Math.round(totalSize / 1024)} KB (${totalSizeMB} MB)`);

    if (attachments.length === 0) {
      addLog('⚠️ No se generó ningún adjunto, enviando email sin PDFs');
    }

    if (totalSize > 10 * 1024 * 1024) {
      addLog('⚠️ ADVERTENCIA: Tamaño total supera 10MB, puede ser rechazado');
    }

    // ============================================================
    // PASO 7: Preparar contenido del email
    // ============================================================
    const vehicleInfo = booking.vehicles.length > 0
      ? `${booking.vehicles[0].car?.make} ${booking.vehicles[0].car?.model} - ${booking.vehicles[0].car?.registration_number}`
      : 'No especificado';

    const subject = `[DEBUG] Confirmación de reserva - ${booking.booking_number}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #fff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .info-box {
      background: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #FF6B35;
      margin: 20px 0;
    }
    .highlight {
      background: #e7f3ff;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      border-left: 4px solid #2196F3;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #888;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔧 Email de Prueba - Confirmación de Reserva</h1>
  </div>
  
  <div class="content">
    <p><strong>Este es un email de DEBUG para diagnosticar problemas con adjuntos.</strong></p>
    
    <p>Estimado/a <strong>${booking.customer.first_name} ${booking.customer.last_name}</strong>,</p>
    
    <div class="info-box">
      <p><strong>Nº de Reserva:</strong> ${booking.booking_number}</p>
      <p><strong>Vehículo:</strong> ${vehicleInfo}</p>
      ${booking.pickup_date ? `<p><strong>Fecha Recogida:</strong> ${new Date(booking.pickup_date).toLocaleDateString('es-ES')}</p>` : ''}
      ${booking.return_date ? `<p><strong>Fecha Devolución:</strong> ${new Date(booking.return_date).toLocaleDateString('es-ES')}</p>` : ''}
      ${booking.total_price ? `<p><strong>Total:</strong> ${parseFloat(booking.total_price.toString()).toFixed(2)}€</p>` : ''}
    </div>
    
    <div class="highlight">
      <p><strong>📎 Adjuntos incluidos:</strong></p>
      <ul>
        ${attachments.map(att => `<li>${att.filename} (${Math.round(att.content.length / 1024)} KB)</li>`).join('')}
      </ul>
      ${attachments.length === 0 ? '<p style="color: red;">⚠️ NO se incluyeron adjuntos (ver logs para detalles)</p>' : ''}
    </div>
    
    <p><strong>Este email es solo para diagnóstico.</strong> El sistema intentó generar y adjuntar los PDFs del contrato e inspección.</p>
  </div>
  
  <div class="footer">
    <p>Email de prueba generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>
    `;

    // ============================================================
    // PASO 8: Enviar email
    // ============================================================
    addLog('📤 Enviando email...');
    
    const mailOptions = {
      from: `"Alquiloscooter [DEBUG]" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: booking.customer.email,
      subject: subject,
      html: htmlContent,
      attachments: attachments
    };

    addLog(`   Destinatario: ${booking.customer.email}`);
    addLog(`   Asunto: ${subject}`);
    addLog(`   Adjuntos: ${attachments.length}`);

    try {
      const info = await transporter.sendMail(mailOptions);
      addLog('✅ Email enviado exitosamente');
      addLog(`   Message ID: ${info.messageId}`);
      addLog(`   Response: ${info.response}`);

      // Enviar copia al admin
      if (process.env.ADMIN_EMAIL) {
        addLog(`📧 Enviando copia al admin: ${process.env.ADMIN_EMAIL}`);
        const adminMailOptions = {
          ...mailOptions,
          to: process.env.ADMIN_EMAIL,
          subject: `[ADMIN DEBUG] ${subject}`,
        };
        await transporter.sendMail(adminMailOptions);
        addLog('✅ Copia enviada al admin');
      }

      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        attachmentsCount: attachments.length,
        totalSizeMB: totalSizeMB,
        logs
      }, { status: 200 });

    } catch (sendError: any) {
      addLog(`❌ Error enviando email: ${sendError.message}`);
      addLog(`   Code: ${sendError.code || 'N/A'}`);
      addLog(`   Response: ${sendError.response || 'N/A'}`);
      
      return NextResponse.json({
        success: false,
        error: sendError.message,
        code: sendError.code,
        logs
      }, { status: 500 });
    }

  } catch (error: any) {
    addLog(`❌ Error fatal: ${error.message}`);
    addLog(`   Stack: ${error.stack}`);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      logs
    }, { status: 500 });
  }
}
