
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Importar nodemailer dinámicamente
    const nodemailer = require('nodemailer');
    
    // Verificar configuración SMTP
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM;

    console.log('📧 Configuración SMTP:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      from: smtpFrom,
      passwordLength: smtpPassword?.length || 0
    });

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return NextResponse.json({
        error: 'Configuración SMTP incompleta',
        config: {
          host: smtpHost ? '✅ Configurado' : '❌ Falta',
          user: smtpUser ? '✅ Configurado' : '❌ Falta',
          password: smtpPassword ? '✅ Configurado' : '❌ Falta'
        }
      }, { status: 500 });
    }

    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false // Para desarrollo, acepta certificados autofirmados
      },
      debug: true, // Habilitar logs de debug
      logger: true // Logs detallados
    });

    console.log('🔄 Verificando conexión SMTP...');

    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada correctamente');

    // Enviar email de prueba
    const testEmail = {
      from: smtpFrom || smtpUser,
      to: smtpUser, // Enviar a la misma cuenta
      subject: '🧪 Test Email - AlquiloScooter',
      text: 'Este es un email de prueba del sistema AlquiloScooter.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #D2011F;">🧪 Test Email</h1>
            <p>Este es un email de prueba del sistema <strong>AlquiloScooter</strong>.</p>
            <p>Si recibes este email, significa que la configuración SMTP funciona correctamente.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Fecha: ${new Date().toLocaleString('es-ES')}</p>
            <p style="color: #666; font-size: 12px;">Servidor SMTP: ${smtpHost}:${smtpPort}</p>
          </div>
        </div>
      `
    };

    console.log('📤 Enviando email de prueba a:', smtpUser);
    const info = await transporter.sendMail(testEmail);
    
    console.log('✅ Email enviado correctamente:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Email de prueba enviado correctamente',
      details: {
        messageId: info.messageId,
        to: smtpUser,
        response: info.response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error en test de email:', error);
    
    return NextResponse.json({
      error: 'Error al enviar email de prueba',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
