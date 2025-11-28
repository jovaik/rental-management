
/**
 * Configuración SMTP compartida para TODO el sistema
 * - Contratos
 * - Inspecciones
 * - Notificaciones
 * 
 * SINGLE SOURCE OF TRUTH para email configuration
 */

const nodemailer = require('nodemailer');

/**
 * Crea y verifica transporter SMTP compartido
 * Evita duplicación de configuración en cada archivo
 */
export async function createEmailTransporter() {
  // Validar configuración
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP no configurado: falta SMTP_HOST en variables de entorno');
  }

  // Crear transporter con configuración centralizada
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // false para 587, true para 465
    requireTLS: true, // Forzar TLS para puerto 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // No rechazar certificados auto-firmados
    },
    debug: true, // Logs detallados
    logger: true
  });

  // Verificar conexión SMTP antes de devolver
  try {
    console.log('🔌 [Email Utils] Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ [Email Utils] Conexión SMTP verificada correctamente');
  } catch (verifyError: any) {
    console.error('❌ [Email Utils] Error verificando conexión SMTP:', {
      message: verifyError.message,
      code: verifyError.code,
      command: verifyError.command
    });
    throw new Error(`Error SMTP: ${verifyError.message}`);
  }

  return transporter;
}

/**
 * Envía email genérico con retry logic
 * @param transporter - Transporter de nodemailer
 * @param mailOptions - Opciones del email
 * @returns Promise<boolean> - true si se envió correctamente
 */
export async function sendEmailWithRetry(
  transporter: any,
  mailOptions: any,
  maxRetries: number = 3
): Promise<boolean> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 [Email Utils] Intento ${attempt}/${maxRetries} de envío...`);
      await transporter.sendMail(mailOptions);
      console.log(`✅ [Email Utils] Email enviado correctamente a ${mailOptions.to}`);
      return true;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ [Email Utils] Error en intento ${attempt}:`, {
        message: error.message,
        code: error.code
      });
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < maxRetries) {
        const delayMs = attempt * 2000; // 2s, 4s, 6s...
        console.log(`⏳ [Email Utils] Esperando ${delayMs}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  console.error(`❌ [Email Utils] Todos los intentos fallaron:`, lastError);
  throw lastError;
}

/**
 * Envía copia al administrador si está configurado
 * @param transporter - Transporter de nodemailer
 * @param originalMailOptions - Opciones del email original
 */
export async function sendAdminCopy(
  transporter: any,
  originalMailOptions: any
): Promise<void> {
  if (!process.env.ADMIN_EMAIL) {
    console.log('ℹ️  [Email Utils] ADMIN_EMAIL no configurado, saltando copia admin');
    return;
  }

  try {
    const adminMailOptions = {
      ...originalMailOptions,
      to: process.env.ADMIN_EMAIL,
      subject: `[ADMIN] ${originalMailOptions.subject}`,
    };
    
    await transporter.sendMail(adminMailOptions);
    console.log(`✅ [Email Utils] Copia enviada al administrador: ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ [Email Utils] Error enviando copia al admin:', error);
    // No lanzar error aquí, la copia admin no es crítica
  }
}
