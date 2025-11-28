require('dotenv').config();
const { sendContractConfirmationEmail } = require('./lib/inspection-email-notifier.ts');

async function test() {
  console.log('\n=== TEST ENVÍO DE EMAIL CONFIRMACIÓN ===\n');
  console.log('Configuración SMTP:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  From: ${process.env.SMTP_FROM}`);
  console.log(`  Admin: ${process.env.ADMIN_EMAIL}`);
  
  console.log('\nIntentando enviar email de confirmación para reserva 143...\n');
  
  try {
    const result = await sendContractConfirmationEmail(143);
    console.log('\n=== RESULTADO ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
