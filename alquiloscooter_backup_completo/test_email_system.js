require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    console.log('📧 Probando configuración SMTP...\n');
    
    console.log('Configuración:');
    console.log('  SMTP_HOST:', process.env.SMTP_HOST);
    console.log('  SMTP_PORT:', process.env.SMTP_PORT);
    console.log('  SMTP_USER:', process.env.SMTP_USER);
    console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'NO CONFIGURADO');
    console.log('  SMTP_FROM:', process.env.SMTP_FROM);
    console.log('  ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
    console.log('');

    if (!process.env.SMTP_HOST) {
      console.error('❌ ERROR: Falta SMTP_HOST en .env');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log('⏳ Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa!\n');

    console.log('📤 Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: '✅ Test Sistema Notificaciones - Alquiloscooter',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Sistema de Notificaciones Activo</h1>
  </div>
  <div class="content">
    <div class="success">
      <h3>✅ Configuración SMTP Correcta</h3>
      <p>El sistema de notificaciones automáticas está funcionando perfectamente.</p>
    </div>
    <p><strong>📧 Emails automáticos activados:</strong></p>
    <ul>
      <li>✅ Email al firmar contrato (contrato + informe salida)</li>
      <li>✅ Email al completar devolución (PDF comparativo)</li>
    </ul>
    <p>Fecha de prueba: ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>
      `
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('   MessageID:', info.messageId);
    console.log('   Destinatario:', process.env.ADMIN_EMAIL);
    console.log('\n🎉 Sistema de notificaciones OPERATIVO!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Error de autenticación SMTP.');
      console.error('   Verifica usuario y contraseña en .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  No se puede conectar al servidor SMTP.');
      console.error('   Verifica SMTP_HOST y SMTP_PORT');
    }
  }
}

testEmail();
