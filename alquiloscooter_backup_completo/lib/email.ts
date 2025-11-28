
/**
 * Servicio de email usando nodemailer
 * Configuración SMTP desde CompanyConfig
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '@/lib/db';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Obtener configuración SMTP desde variables de entorno
 */
function getSMTPConfig() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || process.env.ADMIN_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error(
      'Configuración SMTP incompleta. Verifica las variables de entorno: SMTP_HOST, SMTP_USER, SMTP_PASSWORD'
    );
  }

  return {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    password: smtpPassword,
    from: smtpFrom,
  };
}

/**
 * Crear transporter de nodemailer con la configuración SMTP
 */
function createTransporter(): Transporter {
  const config = getSMTPConfig();

  const transportConfig: any = {
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true para 465, false para otros puertos
    auth: {
      user: config.user,
      pass: config.password,
    },
  };

  // Log para debugging (sin mostrar contraseña)
  console.log('📧 Configurando SMTP:', {
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    user: transportConfig.auth.user,
  });

  return nodemailer.createTransport(transportConfig);
}

/**
 * Enviar email
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  const config = getSMTPConfig();
  const transporter = createTransporter();

  const mailOptions = {
    from: config.from,
    to,
    subject,
    text,
    html,
  };

  console.log('📤 Enviando email:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado correctamente:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw new Error('Error al enviar el email. Por favor intenta de nuevo.');
  }
}

/**
 * Enviar email de firma remota de contrato
 */
export async function sendRemoteSignatureEmail(
  customerEmail: string,
  customerName: string,
  signatureUrl: string,
  contractNumber: string
): Promise<void> {
  const config = await prisma.companyConfig.findFirst({
    where: { active: true }
  });

  const companyName = config?.company_name || 'Alquilo Scooter';
  const companyPhone = config?.company_phone || '';

  const subject = `Firma de Contrato - ${companyName}`;

  const text = `
Estimado/a ${customerName},

Su reserva ha sido confirmada. Para completar el proceso, por favor firme el contrato de alquiler accediendo al siguiente enlace:

${signatureUrl}

IMPORTANTE: El contrato debe estar firmado antes de la entrega del vehículo.

Este enlace expirará en 30 días o cuando el contrato sea firmado.

Número de contrato: ${contractNumber}

Si tiene alguna pregunta, no dude en contactarnos${companyPhone ? ` al ${companyPhone}` : ''}.

Atentamente,
${companyName}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${config?.primary_color || '#2563eb'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🔐 Firma de Contrato</h1>
  </div>
  
  <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Estimado/a <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 15px; margin-bottom: 20px;">
      Su reserva ha sido confirmada. Para completar el proceso, por favor firme el contrato de alquiler haciendo clic en el siguiente botón:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signatureUrl}" 
         style="background-color: ${config?.primary_color || '#2563eb'}; 
                color: white; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-size: 16px; 
                font-weight: bold;
                display: inline-block;">
        Firmar Contrato
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ IMPORTANTE:</strong> El contrato debe estar firmado ANTES de la entrega del vehículo.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      <strong>Número de contrato:</strong> ${contractNumber}<br>
      <strong>Válido hasta:</strong> 30 días o hasta que sea firmado
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 13px; color: #6b7280; margin-bottom: 5px;">
      Si tiene alguna pregunta, no dude en contactarnos${companyPhone ? ` al <strong>${companyPhone}</strong>` : ''}.
    </p>
    
    <p style="font-size: 14px; margin-top: 20px;">
      Atentamente,<br>
      <strong>${companyName}</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p style="margin: 0;">
      Si no puede hacer clic en el botón, copie y pegue este enlace en su navegador:<br>
      <a href="${signatureUrl}" style="color: ${config?.primary_color || '#2563eb'}; word-break: break-all;">
        ${signatureUrl}
      </a>
    </p>
  </div>
</body>
</html>
`.trim();

  await sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
  });
}

/**
 * Obtener textos de email de reseña según el idioma
 */
function getReviewEmailContent(
  language: string,
  customerName: string,
  companyName: string,
  companyPhone: string,
  reviewLink: string,
  bookingNumber: string,
  primaryColor: string
) {
  const content: Record<string, any> = {
    es: {
      subject: `¡Gracias por tu alquiler! - ${companyName}`,
      greeting: 'Hola',
      thanks: `¡Muchas gracias por confiar en <strong>${companyName}</strong> para tu alquiler!`,
      enjoyed: 'Esperamos que hayas disfrutado de tu experiencia con nosotros. Tu opinión es muy importante y nos ayuda a seguir mejorando nuestro servicio.',
      cta: '⭐ ¿Nos dejas tu reseña en Google? ⭐',
      button: 'Dejar Reseña en Google',
      takeMinute: 'Solo te tomará un minuto 😊',
      feedback: 'Tu feedback es fundamental para nosotros y para ayudar a futuros clientes a tomar la mejor decisión.',
      seeYou: '¡Esperamos volver a verte pronto!',
      regards: 'Un saludo',
      team: `El equipo de ${companyName}`,
      reference: 'Referencia de tu reserva',
      cantClick: 'Si no puedes hacer clic en el botón, copia este enlace:',
      headerTitle: '¡Gracias! 🎉',
      headerSubtitle: 'Tu opinión nos importa'
    },
    en: {
      subject: `Thank you for your rental! - ${companyName}`,
      greeting: 'Hello',
      thanks: `Thank you for trusting <strong>${companyName}</strong> for your rental!`,
      enjoyed: 'We hope you enjoyed your experience with us. Your opinion is very important and helps us continue improving our service.',
      cta: '⭐ Would you leave us a Google review? ⭐',
      button: 'Leave Google Review',
      takeMinute: 'It will only take a minute 😊',
      feedback: 'Your feedback is essential for us and to help future customers make the best decision.',
      seeYou: 'We hope to see you again soon!',
      regards: 'Best regards',
      team: `The ${companyName} team`,
      reference: 'Your booking reference',
      cantClick: 'If you cannot click the button, copy this link:',
      headerTitle: 'Thank you! 🎉',
      headerSubtitle: 'Your opinion matters'
    },
    fr: {
      subject: `Merci pour votre location ! - ${companyName}`,
      greeting: 'Bonjour',
      thanks: `Merci d'avoir fait confiance à <strong>${companyName}</strong> pour votre location !`,
      enjoyed: 'Nous espérons que vous avez apprécié votre expérience avec nous. Votre avis est très important et nous aide à continuer à améliorer notre service.',
      cta: '⭐ Voulez-vous nous laisser un avis sur Google ? ⭐',
      button: 'Laisser un avis sur Google',
      takeMinute: 'Cela ne prendra qu\'une minute 😊',
      feedback: 'Votre avis est essentiel pour nous et pour aider les futurs clients à prendre la meilleure décision.',
      seeYou: 'Nous espérons vous revoir bientôt !',
      regards: 'Cordialement',
      team: `L'équipe de ${companyName}`,
      reference: 'Référence de votre réservation',
      cantClick: 'Si vous ne pouvez pas cliquer sur le bouton, copiez ce lien :',
      headerTitle: 'Merci ! 🎉',
      headerSubtitle: 'Votre avis compte'
    },
    de: {
      subject: `Vielen Dank für Ihre Miete! - ${companyName}`,
      greeting: 'Hallo',
      thanks: `Vielen Dank, dass Sie <strong>${companyName}</strong> für Ihre Miete vertraut haben!`,
      enjoyed: 'Wir hoffen, Sie haben Ihre Erfahrung mit uns genossen. Ihre Meinung ist sehr wichtig und hilft uns, unseren Service weiter zu verbessern.',
      cta: '⭐ Möchten Sie uns eine Google-Bewertung hinterlassen? ⭐',
      button: 'Google-Bewertung hinterlassen',
      takeMinute: 'Es dauert nur eine Minute 😊',
      feedback: 'Ihr Feedback ist für uns und zukünftige Kunden, die die beste Entscheidung treffen möchten, von wesentlicher Bedeutung.',
      seeYou: 'Wir hoffen, Sie bald wiederzusehen!',
      regards: 'Mit freundlichen Grüßen',
      team: `Das ${companyName}-Team`,
      reference: 'Ihre Buchungsreferenz',
      cantClick: 'Wenn Sie nicht auf die Schaltfläche klicken können, kopieren Sie diesen Link:',
      headerTitle: 'Vielen Dank! 🎉',
      headerSubtitle: 'Ihre Meinung zählt'
    }
  };

  const lang = content[language] || content.es;

  const text = `
${lang.greeting} ${customerName},

${lang.thanks.replace(/<\/?strong>/g, '')}

${lang.enjoyed}

${lang.cta.replace(/⭐/g, '')}

${reviewLink}

${lang.feedback}

${lang.seeYou}

${lang.regards},
${lang.team}
${companyPhone ? `Tel: ${companyPhone}` : ''}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${primaryColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0 0 10px 0; font-size: 28px;">${lang.headerTitle}</h1>
    <p style="margin: 0; font-size: 16px; opacity: 0.95;">${lang.headerSubtitle}</p>
  </div>
  
  <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">${lang.greeting} <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 15px; margin-bottom: 20px;">
      ${lang.thanks}
    </p>
    
    <p style="font-size: 15px; margin-bottom: 20px;">
      ${lang.enjoyed}
    </p>
    
    <div style="background-color: #fff; border: 2px solid ${primaryColor}; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="font-size: 18px; font-weight: bold; color: ${primaryColor}; margin: 0 0 20px 0;">
        ${lang.cta}
      </p>
      
      <a href="${reviewLink}" 
         style="background-color: ${primaryColor}; 
                color: white; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-size: 16px; 
                font-weight: bold;
                display: inline-block;">
        ${lang.button}
      </a>
      
      <p style="font-size: 13px; color: #6b7280; margin: 15px 0 0 0;">
        ${lang.takeMinute}
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
      ${lang.feedback}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 15px; margin-bottom: 5px;">
      ${lang.seeYou}
    </p>
    
    <p style="font-size: 14px; margin-top: 20px;">
      ${lang.regards},<br>
      <strong>${lang.team}</strong>
      ${companyPhone ? `<br><span style="color: #6b7280;">Tel: ${companyPhone}</span>` : ''}
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p style="margin: 0;">
      ${lang.reference}: <strong>${bookingNumber}</strong>
    </p>
    <p style="margin: 10px 0 0 0;">
      ${lang.cantClick}<br>
      <a href="${reviewLink}" style="color: ${primaryColor}; word-break: break-all;">
        ${reviewLink}
      </a>
    </p>
  </div>
</body>
</html>
`.trim();

  return { subject: lang.subject, text, html };
}

/**
 * Enviar solicitud de reseña de Google al completar una reserva
 * (Como fallback si WhatsApp falla)
 */
export async function sendGoogleReviewRequest(
  customerEmail: string,
  customerName: string,
  bookingNumber: string,
  customerCountry?: string | null
): Promise<void> {
  const config = await prisma.companyConfig.findFirst({
    where: { active: true }
  });

  if (!config) {
    throw new Error('No se encontró configuración de empresa activa');
  }

  const companyName = config.company_name || 'Alquilo Scooter';
  const companyPhone = config.company_phone || '';
  const googleReviewLink = config.google_review_link;
  const primaryColor = config.primary_color || '#2563eb';

  if (!googleReviewLink) {
    console.log('⚠️ No hay enlace de Google Reviews configurado. No se enviará email de solicitud de reseña.');
    return;
  }

  // Detectar idioma del cliente
  const language = detectCustomerLanguage(customerCountry);
  console.log(`🌍 Idioma detectado para ${customerName} (email): ${language} (País: ${customerCountry || 'N/A'})`);

  // Obtener contenido en el idioma correspondiente
  const { subject, text, html } = getReviewEmailContent(
    language,
    customerName,
    companyName,
    companyPhone,
    googleReviewLink,
    bookingNumber,
    primaryColor
  );

  await sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
  });

  console.log(`✅ Email de solicitud de reseña enviado a ${customerEmail} (idioma: ${language})`);
}

/**
 * Detectar idioma del cliente basado en el país
 */
function detectCustomerLanguage(country?: string | null): string {
  if (!country) return 'es'; // Español por defecto

  const countryLower = country.toLowerCase();

  // Mapeo de países a idiomas
  if (countryLower.includes('españa') || countryLower.includes('spain')) return 'es';
  if (countryLower.includes('reino unido') || countryLower.includes('united kingdom') || countryLower.includes('uk')) return 'en';
  if (countryLower.includes('francia') || countryLower.includes('france')) return 'fr';
  if (countryLower.includes('alemania') || countryLower.includes('germany') || countryLower.includes('deutschland')) return 'de';
  if (countryLower.includes('italia') || countryLower.includes('italy')) return 'it';
  if (countryLower.includes('portugal')) return 'pt';

  // Inglés para otros países
  return 'en';
}
