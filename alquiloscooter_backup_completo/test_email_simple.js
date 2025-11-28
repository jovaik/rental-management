
/**
 * Test simple de envío de email
 * Verifica si el SMTP funciona correctamente
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente
const envPath = path.join(__dirname, 'app', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remover comillas si existen
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

async function testEmail() {
  console.log('📧 ========== TEST DE EMAIL ==========');
  console.log('');
  console.log('📋 Configuración SMTP:');
  console.log('  Host:', envVars.SMTP_HOST);
  console.log('  Puerto:', envVars.SMTP_PORT);
  console.log('  Usuario:', envVars.SMTP_USER);
  console.log('  From:', envVars.SMTP_FROM);
  console.log('  Admin:', envVars.ADMIN_EMAIL);
  console.log('');

  // Crear transporter
  console.log('🔌 Creando transporter...');
  const transporter = nodemailer.createTransport({
    host: envVars.SMTP_HOST,
    port: parseInt(envVars.SMTP_PORT || '587'),
    secure: false, // false para 587, true para 465
    requireTLS: true, // Forzar TLS para puerto 587
    auth: {
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // No rechazar certificados auto-firmados
    },
    debug: true, // Logs detallados
    logger: true
  });

  // Verificar conexión SMTP
  try {
    console.log('🔌 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada correctamente');
    console.log('');
  } catch (verifyError) {
    console.error('❌ Error verificando conexión SMTP:', {
      message: verifyError.message,
      code: verifyError.code,
      command: verifyError.command
    });
    process.exit(1);
  }

  // Enviar email de prueba
  try {
    console.log('📤 Enviando email de prueba...');
    
    const mailOptions = {
      from: `"Alquiloscooter Test" <${envVars.SMTP_USER}>`,
      to: 'romypauw2000@gmail.com', // Email del cliente de la reserva 130
      subject: 'Test de email - Sistema de notificaciones',
      html: `
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
  </style>
</head>
<body>
  <div class="header">
    <h1>🧪 Test de Email</h1>
  </div>
  
  <div class="content">
    <p><strong>Este es un email de prueba del sistema de notificaciones.</strong></p>
    
    <p>Si recibes este mensaje, significa que:</p>
    <ul>
      <li>✅ La configuración SMTP es correcta</li>
      <li>✅ El servidor puede conectarse al servidor de email</li>
      <li>✅ Los emails se están enviando correctamente</li>
    </ul>
    
    <p>Fecha de prueba: ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado correctamente');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    console.log('');
    console.log('✅ ========== TEST EXITOSO ==========');
  } catch (error) {
    console.error('❌ Error enviando email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    console.error('');
    console.error('❌ ========== TEST FALLIDO ==========');
    process.exit(1);
  }
}

testEmail();
