/**
 * Sistema de notificaciones UNIFICADO para inspecciones
 * USA LA MISMA ARQUITECTURA QUE LOS CONTRATOS
 * - Email utils compartidos (SMTP)
 * - PDF generator unificado
 * - Templates HTML consistentes
 */

import { generateInspectionComparisonPDF, generateInspectionPDFBuffer } from './inspection-pdf-generator';
import { createEmailTransporter, sendEmailWithRetry, sendAdminCopy } from './email-utils';
import { prisma } from './db';

interface InspectionEmailData {
  inspectionId: number;
  bookingNumber: string;
  customerEmail: string;
  customerName: string;
  vehicleInfo: string;
  inspectionType: string;
  inspectionDate: Date;
  pickupDate?: Date;
  returnDate?: Date;
}

/**
 * ✅ FUNCIÓN UNIFICADA: Envía email de notificación de inspección
 * Usa la misma arquitectura que los contratos:
 * - Email utils compartidos
 * - PDF generator unificado
 * - Templates consistentes
 */
export async function sendInspectionNotification(data: InspectionEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`📧 [Email Inspección] Enviando notificación ${data.inspectionType} para ${data.bookingNumber}...`);

    // 1. ✅ Crear transporter usando configuración compartida
    let transporter;
    try {
      transporter = await createEmailTransporter();
    } catch (error: any) {
      console.error('❌ [Email Inspección] Error creando transporter:', error);
      return { success: false, error: error.message };
    }

    // 2. ✅ Generar PDF usando arquitectura unificada
    let pdfBuffer: Buffer;
    let attachmentFilename: string;
    
    console.log(`\n📄 ============ GENERACIÓN DE PDF ============`);
    console.log(`📄 [Email Inspección] Tipo de inspección:`, data.inspectionType);
    
    // Si es DEVOLUCIÓN, generar PDF COMPARATIVO (entrega + devolución)
    if (data.inspectionType === 'return' || data.inspectionType === 'RETURN' || data.inspectionType === 'CHECKOUT') {
      console.log(`📊 [Email Inspección] Generando PDF COMPARATIVO...`);
      console.log(`📊 [Email Inspección] Inspection ID:`, data.inspectionId);
      
      try {
        pdfBuffer = await generateInspectionComparisonPDF(data.inspectionId);
        attachmentFilename = `Comparativa_Inspecciones_${data.bookingNumber}.pdf`;
        console.log(`✅ [Email Inspección] PDF comparativo generado exitosamente`);
        console.log(`✅ [Email Inspección] Tamaño: ${Math.round(pdfBuffer.length / 1024)}KB`);
      } catch (error: any) {
        console.error('❌ [Email Inspección] ========== ERROR GENERANDO PDF COMPARATIVO ==========');
        console.error('❌ [Email Inspección] Mensaje:', error.message);
        console.error('❌ [Email Inspección] Stack:', error.stack);
        console.error('❌ [Email Inspección] Intentando PDF individual como fallback...');
        
        // Fallback a PDF individual
        try {
          pdfBuffer = await generateInspectionPDFBuffer(data.inspectionId);
          attachmentFilename = `Inspeccion_Devolucion_${data.bookingNumber}.pdf`;
          console.log(`✅ [Email Inspección] PDF individual generado como fallback (${Math.round(pdfBuffer.length / 1024)}KB)`);
        } catch (fallbackError: any) {
          console.error('❌ [Email Inspección] ========== ERROR GENERANDO PDF FALLBACK ==========');
          console.error('❌ [Email Inspección] Mensaje:', fallbackError.message);
          console.error('❌ [Email Inspección] Stack:', fallbackError.stack);
          throw fallbackError;
        }
      }
    } else {
      // Para ENTREGAS, mantener PDF individual
      console.log(`📄 [Email Inspección] Generando PDF de inspección individual...`);
      console.log(`📄 [Email Inspección] Inspection ID:`, data.inspectionId);
      
      try {
        pdfBuffer = await generateInspectionPDFBuffer(data.inspectionId);
        attachmentFilename = `Inspeccion_Entrega_${data.bookingNumber}.pdf`;
        console.log(`✅ [Email Inspección] PDF generado exitosamente`);
        console.log(`✅ [Email Inspección] Tamaño: ${Math.round(pdfBuffer.length / 1024)}KB`);
      } catch (error: any) {
        console.error('❌ [Email Inspección] ========== ERROR GENERANDO PDF ==========');
        console.error('❌ [Email Inspección] Mensaje:', error.message);
        console.error('❌ [Email Inspección] Stack:', error.stack);
        throw error;
      }
    }
    
    console.log(`✅ [Email Inspección] PDF listo para adjuntar: ${attachmentFilename}`);

    // 3. Determinar tipo de inspección en español
    const tipoInspeccion = data.inspectionType === 'DELIVERY' || data.inspectionType === 'CHECKIN' || data.inspectionType === 'delivery'
      ? 'ENTREGA'
      : 'DEVOLUCIÓN';

    const tipoInspeccionLower = tipoInspeccion.toLowerCase();

    // Contenido del email
    const subject = `Inspección de ${tipoInspeccionLower} completada - Reserva ${data.bookingNumber}`;
    
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
    .header h1 {
      margin: 0;
      font-size: 24px;
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
    .info-box p {
      margin: 8px 0;
    }
    .info-box strong {
      color: #555;
      min-width: 140px;
      display: inline-block;
    }
    .highlight {
      background: #fff3cd;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      border-left: 4px solid #ffc107;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #FF6B35;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #888;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
      margin-top: 20px;
    }
    .icon {
      font-size: 20px;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1><span class="icon">📋</span> Inspección de ${tipoInspeccionLower} completada</h1>
  </div>
  
  <div class="content">
    <p>Estimado/a <strong>${data.customerName}</strong>,</p>
    
    <p>Le informamos que se ha completado la <strong>inspección de ${tipoInspeccionLower}</strong> de su vehículo alquilado.</p>
    
    <div class="info-box">
      <p><strong><span class="icon">📄</span> Nº de Reserva:</strong> ${data.bookingNumber}</p>
      <p><strong><span class="icon">🏍️</span> Vehículo:</strong> ${data.vehicleInfo}</p>
      <p><strong><span class="icon">📅</span> Fecha Inspección:</strong> ${new Date(data.inspectionDate).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      ${data.pickupDate ? `<p><strong><span class="icon">🚀</span> Fecha Recogida:</strong> ${new Date(data.pickupDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>` : ''}
      ${data.returnDate ? `<p><strong><span class="icon">🏁</span> Fecha Devolución:</strong> ${new Date(data.returnDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>` : ''}
    </div>
    
    <div class="highlight">
      <p><strong><span class="icon">📎</span> Documento adjunto:</strong></p>
      ${tipoInspeccion === 'ENTREGA' ? `
        <p>Encontrará adjunto a este correo el <strong>PDF con las fotografías y detalles de la inspección de ${tipoInspeccionLower}</strong>.</p>
      ` : `
        <p>Encontrará adjunto a este correo el <strong>PDF comparativo con las fotografías de entrega y devolución lado a lado</strong>.</p>
        <p>Este documento incluye la comparación completa del estado del vehículo al inicio y al final del alquiler.</p>
      `}
      <p>Le recomendamos revisar el documento y conservarlo para su registro.</p>
    </div>
    
    ${tipoInspeccion === 'ENTREGA' ? `
      <p>Este documento registra el <strong>estado del vehículo al momento de la entrega</strong>. Cualquier daño o desperfecto detectado en este momento ha sido documentado.</p>
    ` : `
      <p>Este documento comparativo muestra el <strong>estado del vehículo al inicio y al final del alquiler</strong>, permitiendo identificar fácilmente cualquier cambio o daño durante el período de uso.</p>
    `}
    
    <p style="margin-top: 30px;">Si tiene alguna pregunta o necesita información adicional, no dude en contactarnos.</p>
    
    <p style="margin-top: 20px;">Atentamente,<br><strong>Equipo de Alquiloscooter</strong></p>
  </div>
  
  <div class="footer">
    <p>Este es un correo automático generado por el sistema de gestión de alquileres.</p>
    <p>Por favor, no responda directamente a este correo.</p>
  </div>
</body>
</html>
`;

    // 4. ✅ Preparar opciones del email
    const mailOptions = {
      from: `"Alquiloscooter" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: attachmentFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // 5. ✅ Enviar email usando función compartida con retry logic
    console.log(`\n📤 ============ ENVÍO DE EMAIL ============`);
    console.log(`📤 [Email Inspección] Destinatario:`, data.customerEmail);
    console.log(`📤 [Email Inspección] Asunto:`, subject);
    console.log(`📤 [Email Inspección] Adjuntos:`, attachmentFilename);
    
    try {
      await sendEmailWithRetry(transporter, mailOptions);
      console.log(`✅ [Email Inspección] ========== EMAIL ENVIADO EXITOSAMENTE ==========`);
      console.log(`✅ [Email Inspección] Destinatario: ${data.customerEmail}`);
    } catch (error: any) {
      console.error('❌ [Email Inspección] ========== ERROR ENVIANDO EMAIL ==========');
      console.error('❌ [Email Inspección] Destinatario:', data.customerEmail);
      console.error('❌ [Email Inspección] Mensaje:', error.message);
      console.error('❌ [Email Inspección] Code:', error.code);
      console.error('❌ [Email Inspección] ================================================');
      return { success: false, error: `Error enviando email: ${error.message}` };
    }

    // 6. ✅ Enviar copia al admin usando función compartida
    console.log(`📧 [Email Inspección] Enviando copia al admin...`);
    await sendAdminCopy(transporter, mailOptions);
    console.log(`✅ [Email Inspección] Copia enviada al admin`);

    console.log(`✅ [Email Inspección] ========== PROCESO COMPLETADO ==========\n`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [Email Inspección] ========== ERROR COMPLETO ==========');
    console.error('❌ [Email Inspección] Tipo:', error.constructor?.name || 'Unknown');
    console.error('❌ [Email Inspección] Mensaje:', error.message);
    console.error('❌ [Email Inspección] Stack:', error.stack);
    console.error('❌ [Email Inspección] Code:', error.code || 'N/A');
    console.error('❌ [Email Inspección] ======================================');
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}


/**
 * ✅ SOLUCIÓN DEFINITIVA: Email con ENLACES HTML (como ServyAuto)
 * 
 * Envía email al cliente cuando se firma el contrato CON ENLACES a:
 * - Contrato HTML (visualizable en navegador, imprimible con Ctrl+P)
 * - Inspección HTML (con todas las fotos, sin límites de tamaño)
 * 
 * NO genera PDFs en el servidor
 * NO adjunta archivos pesados
 * MÁS rápido, MÁS confiable, SIN dependencias de Puppeteer
 */
export async function sendContractConfirmationEmail(bookingId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`📧 [Email Confirmación] Enviando email con ENLACES HTML para reserva ${bookingId}...`);

    // Validar configuración SMTP
    if (!process.env.SMTP_HOST) {
      console.log('ℹ️  Email SMTP no configurado, saltando notificación');
      return { success: false, error: 'SMTP no configurado' };
    }

    // Obtener datos de la reserva
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        contract: true,
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });

    if (!booking || !booking.customer || !booking.contract) {
      console.error('❌ No se encontró la reserva, cliente o contrato');
      return { success: false, error: 'Datos incompletos' };
    }

    // Importar nodemailer dinámicamente
    const nodemailer = require('nodemailer');

    // Crear transporter con configuración mejorada para puerto 587
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
      }
    });

    // Verificar conexión SMTP
    try {
      console.log('🔌 Verificando conexión SMTP...');
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
    } catch (verifyError: any) {
      console.error('❌ Error verificando conexión SMTP:', verifyError.message);
      return { success: false, error: `Error SMTP: ${verifyError.message}` };
    }

    // ✅ Generar enlace al contrato HTML (NO PDF)
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
    const contractUrl = `${baseUrl}/api/contracts/${booking.contract.id}/html`;

    // ✅ Buscar enlace de inspección existente
    const inspectionLink = await prisma.inspectionLink.findFirst({
      where: {
        booking_id: booking.id,
        expires_at: { gte: new Date() }
      }
    });

    const inspectionUrl = inspectionLink 
      ? `${baseUrl}/inspeccion/${inspectionLink.token}`
      : null;

    // Preparar datos del vehículo
    const vehicleInfo = booking.vehicles.length > 0
      ? `${booking.vehicles[0].car?.make} ${booking.vehicles[0].car?.model} - ${booking.vehicles[0].car?.registration_number}`
      : 'No especificado';

    // Contenido del email
    const subject = `Confirmación de reserva - ${booking.booking_number}`;

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
    .header h1 {
      margin: 0;
      font-size: 24px;
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
    .info-box p {
      margin: 8px 0;
    }
    .info-box strong {
      color: #555;
      min-width: 140px;
      display: inline-block;
    }
    .highlight {
      background: #e7f3ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2196F3;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #FF6B35;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 5px;
      font-weight: bold;
      font-size: 14px;
    }
    .button:hover {
      background: #E55A25;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #888;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
      margin-top: 20px;
    }
    .icon {
      font-size: 20px;
      margin-right: 8px;
    }
    .link-box {
      background: white;
      border: 2px dashed #ddd;
      padding: 15px;
      border-radius: 5px;
      margin: 10px 0;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1><span class="icon">✅</span> Reserva Confirmada</h1>
  </div>
  
  <div class="content">
    <p>Estimado/a <strong>${booking.customer.first_name} ${booking.customer.last_name}</strong>,</p>
    
    <p>¡Su reserva ha sido confirmada exitosamente!</p>
    
    <div class="info-box">
      <p><strong><span class="icon">📄</span> Nº de Reserva:</strong> ${booking.booking_number}</p>
      <p><strong><span class="icon">🏍️</span> Vehículo:</strong> ${vehicleInfo}</p>
      ${booking.pickup_date ? `<p><strong><span class="icon">🚀</span> Fecha Recogida:</strong> ${new Date(booking.pickup_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>` : ''}
      ${booking.return_date ? `<p><strong><span class="icon">🏁</span> Fecha Devolución:</strong> ${new Date(booking.return_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>` : ''}
      ${booking.total_price ? `<p><strong><span class="icon">💰</span> Total:</strong> ${parseFloat(booking.total_price.toString()).toFixed(2)}€</p>` : ''}
    </div>
    
    <div class="highlight">
      <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">
        📄 Sus documentos están disponibles en línea:
      </p>
      
      <div style="margin: 20px 0;">
        <p style="font-weight: bold; margin-bottom: 8px;">🔗 Contrato firmado:</p>
        <div class="link-box">
          <a href="${contractUrl}" style="color: #FF6B35; text-decoration: underline;">${contractUrl}</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 5px;">
          Puede ver, imprimir o guardar el contrato como PDF desde su navegador
        </p>
      </div>
      
      ${inspectionUrl ? `
        <div style="margin: 20px 0;">
          <p style="font-weight: bold; margin-bottom: 8px;">📸 Fotografías de inspección:</p>
          <div class="link-box">
            <a href="${inspectionUrl}" style="color: #FF6B35; text-decoration: underline;">${inspectionUrl}</a>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 5px;">
            Enlace válido durante 30 días
          </p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="${contractUrl}" class="button">📄 Ver Contrato</a>
        ${inspectionUrl ? `<a href="${inspectionUrl}" class="button">📸 Ver Fotos</a>` : ''}
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 4px;">
        💡 <strong>Consejo:</strong> Estos enlaces funcionan en cualquier dispositivo. 
        Para guardar una copia, abra el enlace y use "Ctrl+P" (Windows) o "Cmd+P" (Mac) 
        para imprimir o guardar como PDF.
      </p>
    </div>
    
    <p>Gracias por confiar en nosotros. ¡Disfrute de su viaje!</p>
    
    <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
  </div>
  
  <div class="footer">
    <p>Este es un mensaje automático, por favor no responda a este email.</p>
    <p>${new Date().getFullYear()} Alquiloscooter - Todos los derechos reservados</p>
  </div>
</body>
</html>
    `;

    // Enviar email al cliente (SIN adjuntos, solo enlaces)
    const mailOptions = {
      from: `"Alquiloscooter" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: booking.customer.email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email con ENLACES HTML enviado a: ${booking.customer.email}`);

    // Enviar copia al admin si está configurado
    if (process.env.ADMIN_EMAIL) {
      const adminMailOptions = {
        ...mailOptions,
        to: process.env.ADMIN_EMAIL,
        subject: `[ADMIN] ${subject}`,
      };

      await transporter.sendMail(adminMailOptions);
      console.log(`✅ Copia enviada al administrador: ${process.env.ADMIN_EMAIL}`);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}