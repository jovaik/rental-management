
import { detectLanguageFromCountry, type SupportedLanguage } from './language-detector'

/**
 * Plantillas de mensajes de solicitud de reseña en diferentes idiomas
 */
const REVIEW_REQUEST_MESSAGES: Record<SupportedLanguage, string> = {
  es: `¡Hola {customerName}! 👋

Gracias por confiar en nosotros para tu alquiler. Esperamos que hayas disfrutado de la experiencia.

¿Podrías dedicar un momento a compartir tu opinión? Tu reseña nos ayuda mucho a mejorar nuestro servicio.

👉 {reviewLink}

¡Muchas gracias por tu tiempo! 🙏`,

  en: `Hello {customerName}! 👋

Thank you for choosing us for your rental. We hope you enjoyed the experience.

Would you mind taking a moment to share your feedback? Your review helps us improve our service.

👉 {reviewLink}

Thank you so much for your time! 🙏`,

  de: `Hallo {customerName}! 👋

Vielen Dank, dass Sie uns für Ihre Anmietung gewählt haben. Wir hoffen, Sie hatten eine tolle Erfahrung.

Könnten Sie sich einen Moment Zeit nehmen, um Ihr Feedback zu teilen? Ihre Bewertung hilft uns sehr, unseren Service zu verbessern.

👉 {reviewLink}

Vielen Dank für Ihre Zeit! 🙏`,

  fr: `Bonjour {customerName}! 👋

Merci d'avoir choisi nos services pour votre location. Nous espérons que vous avez apprécié l'expérience.

Pourriez-vous prendre un moment pour partager votre avis? Votre évaluation nous aide beaucoup à améliorer notre service.

👉 {reviewLink}

Merci beaucoup pour votre temps! 🙏`,

  it: `Ciao {customerName}! 👋

Grazie per aver scelto i nostri servizi per il tuo noleggio. Speriamo che tu abbia apprezzato l'esperienza.

Potresti dedicare un momento a condividere la tua opinione? La tua recensione ci aiuta molto a migliorare il nostro servizio.

👉 {reviewLink}

Grazie mille per il tuo tempo! 🙏`,

  pt: `Olá {customerName}! 👋

Obrigado por escolher nossos serviços para o seu aluguel. Esperamos que tenha aproveitado a experiência.

Você poderia dedicar um momento para compartilhar sua opinião? Sua avaliação nos ajuda muito a melhorar nosso serviço.

👉 {reviewLink}

Muito obrigado pelo seu tempo! 🙏`
}

interface GenerateWhatsAppLinkOptions {
  customerName: string
  customerPhone: string
  customerCountry?: string | null
  reviewLink: string
}

/**
 * Genera un enlace de WhatsApp con el mensaje pre-rellenado
 * @param options - Datos del cliente y configuración
 * @returns URL de WhatsApp (wa.me) con el mensaje codificado
 */
export function generateWhatsAppReviewLink(options: GenerateWhatsAppLinkOptions): string {
  const { customerName, customerPhone, customerCountry, reviewLink } = options

  // Detectar idioma basado en el país del cliente
  const language = detectLanguageFromCountry(customerCountry, 'es')

  // Obtener plantilla del mensaje
  let message = REVIEW_REQUEST_MESSAGES[language]

  // Reemplazar placeholders
  message = message
    .replace('{customerName}', customerName)
    .replace('{reviewLink}', reviewLink)

  // Limpiar el número de teléfono (eliminar espacios, guiones, paréntesis)
  const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, '')

  // Codificar el mensaje para URL
  const encodedMessage = encodeURIComponent(message)

  // Generar URL de WhatsApp
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Genera un mensaje de reseña sin el enlace de WhatsApp
 * (útil para mostrar en la interfaz)
 */
export function generateReviewMessage(
  customerName: string,
  customerCountry: string | null | undefined,
  reviewLink: string
): string {
  const language = detectLanguageFromCountry(customerCountry, 'es')
  let message = REVIEW_REQUEST_MESSAGES[language]
  
  message = message
    .replace('{customerName}', customerName)
    .replace('{reviewLink}', reviewLink)

  return message
}

