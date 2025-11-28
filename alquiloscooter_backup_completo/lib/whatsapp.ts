
/**
 * Servicio de WhatsApp para envío de mensajes
 * Sistema principal para solicitudes de reseñas
 */

import { prisma } from '@/lib/db';

interface WhatsAppMessageOptions {
  to: string; // Número de teléfono en formato internacional (ej: +34600123456)
  message: string; // Mensaje a enviar
}

/**
 * Detectar idioma del cliente basado en el país del contrato
 */
export function detectCustomerLanguage(country?: string | null): string {
  if (!country) return 'es'; // Español por defecto

  const countryLower = country.toLowerCase();

  // Mapeo de países a idiomas
  if (countryLower.includes('españa') || countryLower.includes('spain')) return 'es';
  if (countryLower.includes('reino unido') || countryLower.includes('united kingdom') || countryLower.includes('uk')) return 'en';
  if (countryLower.includes('francia') || countryLower.includes('france')) return 'fr';
  if (countryLower.includes('alemania') || countryLower.includes('germany') || countryLower.includes('deutschland')) return 'de';
  if (countryLower.includes('italia') || countryLower.includes('italy')) return 'it';
  if (countryLower.includes('portugal')) return 'pt';
  if (countryLower.includes('países bajos') || countryLower.includes('netherlands') || countryLower.includes('holanda')) return 'nl';

  // Inglés para otros países no especificados
  return 'en';
}

/**
 * Obtener mensaje de reseña en el idioma del cliente
 */
function getReviewMessage(language: string, companyName: string, reviewLink: string): string {
  const messages: Record<string, string> = {
    es: `🎉 ¡Gracias por alquilar con ${companyName}!

¿Nos dejas tu opinión?
👉 ${reviewLink}

¡Tu feedback es muy valioso! ⭐⭐⭐⭐⭐`,

    en: `🎉 Thank you for renting with ${companyName}!

Would you leave us a review?
👉 ${reviewLink}

Your feedback is very valuable! ⭐⭐⭐⭐⭐`,

    fr: `🎉 Merci d'avoir loué avec ${companyName} !

Voulez-vous nous laisser un avis ?
👉 ${reviewLink}

Votre avis est très précieux ! ⭐⭐⭐⭐⭐`,

    de: `🎉 Vielen Dank, dass Sie bei ${companyName} gemietet haben!

Möchten Sie uns eine Bewertung hinterlassen?
👉 ${reviewLink}

Ihr Feedback ist sehr wertvoll! ⭐⭐⭐⭐⭐`,

    it: `🎉 Grazie per aver noleggiato con ${companyName}!

Vuoi lasciarci una recensione?
👉 ${reviewLink}

Il tuo feedback è molto prezioso! ⭐⭐⭐⭐⭐`,

    pt: `🎉 Obrigado por alugar com ${companyName}!

Quer nos deixar uma avaliação?
👉 ${reviewLink}

Seu feedback é muito valioso! ⭐⭐⭐⭐⭐`,

    nl: `🎉 Bedankt voor het huren bij ${companyName}!

Wilt u een review achterlaten?
👉 ${reviewLink}

Uw feedback is zeer waardevol! ⭐⭐⭐⭐⭐`,
  };

  return messages[language] || messages.es; // Español por defecto
}

/**
 * Enviar mensaje por WhatsApp usando la API configurada
 */
async function sendWhatsAppMessage({ to, message }: WhatsAppMessageOptions): Promise<boolean> {
  const config = await prisma.companyConfig.findFirst({
    where: { active: true }
  });

  if (!config) {
    console.error('❌ No se encontró configuración de empresa activa');
    return false;
  }

  const { whatsapp_api_url, whatsapp_api_key, whatsapp_business_phone } = config;

  if (!whatsapp_api_url || !whatsapp_api_key || !whatsapp_business_phone) {
    console.log('⚠️ Configuración de WhatsApp incompleta. No se puede enviar mensaje.');
    return false;
  }

  // Limpiar número de teléfono (quitar espacios, guiones, etc.)
  const cleanPhone = to.replace(/[\s\-\(\)]/g, '');

  console.log('📱 Enviando WhatsApp:', {
    from: whatsapp_business_phone,
    to: cleanPhone,
    messageLength: message.length,
  });

  try {
    // Llamada a la API de WhatsApp Business
    // Nota: Esto puede variar según el proveedor (Twilio, WhatsApp Cloud API, etc.)
    const response = await fetch(whatsapp_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsapp_api_key}`,
      },
      body: JSON.stringify({
        to: cleanPhone,
        from: whatsapp_business_phone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error enviando WhatsApp:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ WhatsApp enviado correctamente:', result);
    return true;
  } catch (error) {
    console.error('❌ Error en la llamada a WhatsApp API:', error);
    return false;
  }
}

/**
 * Enviar mensaje de bienvenida por WhatsApp al crear/registrar un cliente
 */
export async function sendWelcomeMessage(
  customerPhone: string,
  customerName: string
): Promise<{ success: boolean; method: string }> {
  const config = await prisma.companyConfig.findFirst({
    where: { active: true }
  });

  if (!config) {
    console.error('❌ No se encontró configuración de empresa activa');
    return { success: false, method: 'none' };
  }

  const { company_name, company_phone, whatsapp_business_phone } = config;

  if (!customerPhone) {
    console.log('⚠️ Cliente sin número de teléfono. No se puede enviar WhatsApp.');
    return { success: false, method: 'none' };
  }

  // Construir mensaje de bienvenida
  const phoneDisplay = company_phone || whatsapp_business_phone || '952 XXX XXX';
  const whatsappLink = whatsapp_business_phone ? `https://wa.me/${whatsapp_business_phone.replace(/[\s\-\(\)]/g, '')}` : '';
  
  const message = `¡Hola${customerName ? ' ' + customerName : ''}! 👋

Muchas gracias por confiar en ${company_name}.

Estamos a tu disposición:
📞 ${phoneDisplay}${whatsappLink ? `\n💬 WhatsApp: ${whatsappLink}` : ''}

¡Disfruta de tu experiencia con nosotros! 🛵

---
${company_name}
www.alquiloscooter.com`;

  console.log('📱 Enviando mensaje de bienvenida:', {
    to: customerPhone,
    name: customerName,
    messageLength: message.length,
  });

  // Enviar mensaje
  const success = await sendWhatsAppMessage({
    to: customerPhone,
    message: message,
  });

  if (success) {
    console.log(`✅ Mensaje de bienvenida enviado a ${customerName} (${customerPhone})`);
  } else {
    console.log(`⚠️ No se pudo enviar mensaje a ${customerName} (${customerPhone})`);
  }

  return { success, method: 'whatsapp' };
}

/**
 * Enviar solicitud de reseña por WhatsApp al completar una reserva
 */
export async function sendGoogleReviewRequestWhatsApp(
  customerPhone: string,
  customerName: string,
  customerCountry?: string | null
): Promise<boolean> {
  const config = await prisma.companyConfig.findFirst({
    where: { active: true }
  });

  if (!config) {
    console.error('❌ No se encontró configuración de empresa activa');
    return false;
  }

  const { company_name, google_review_link } = config;

  if (!google_review_link) {
    console.log('⚠️ No hay enlace de Google Reviews configurado. No se enviará WhatsApp.');
    return false;
  }

  if (!customerPhone) {
    console.log('⚠️ Cliente sin número de teléfono. No se puede enviar WhatsApp.');
    return false;
  }

  // Detectar idioma del cliente
  const language = detectCustomerLanguage(customerCountry);
  console.log(`🌍 Idioma detectado para ${customerName}: ${language} (País: ${customerCountry || 'N/A'})`);

  // Obtener mensaje en el idioma correspondiente
  const message = getReviewMessage(language, company_name, google_review_link);

  // Enviar mensaje
  const success = await sendWhatsAppMessage({
    to: customerPhone,
    message: message,
  });

  if (success) {
    console.log(`✅ Solicitud de reseña enviada por WhatsApp a ${customerName} (${customerPhone})`);
  } else {
    console.log(`⚠️ No se pudo enviar WhatsApp a ${customerName} (${customerPhone})`);
  }

  return success;
}
