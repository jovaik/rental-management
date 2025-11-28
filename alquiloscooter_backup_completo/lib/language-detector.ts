
/**
 * Detección automática de idioma basada en el país del cliente
 * 
 * Reglas:
 * - Países de habla hispana → español (es)
 * - Alemania → alemán (de)
 * - Francia → francés (fr)
 * - Italia → italiano (it)
 * - Portugal/Brasil → portugués (pt)
 * - Resto → inglés (en)
 */

export type SupportedLanguage = 'es' | 'en' | 'de' | 'fr' | 'it' | 'pt';

// Mapeo de países a idiomas
const COUNTRY_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  // Países de habla hispana
  'España': 'es',
  'Spain': 'es',
  'México': 'es',
  'Mexico': 'es',
  'Argentina': 'es',
  'Colombia': 'es',
  'Chile': 'es',
  'Perú': 'es',
  'Peru': 'es',
  'Venezuela': 'es',
  'Ecuador': 'es',
  'Guatemala': 'es',
  'Cuba': 'es',
  'República Dominicana': 'es',
  'Honduras': 'es',
  'Paraguay': 'es',
  'El Salvador': 'es',
  'Nicaragua': 'es',
  'Costa Rica': 'es',
  'Panamá': 'es',
  'Panama': 'es',
  'Uruguay': 'es',
  'Bolivia': 'es',
  
  // Alemán
  'Alemania': 'de',
  'Germany': 'de',
  'Deutschland': 'de',
  'Austria': 'de',
  'Österreich': 'de',
  'Suiza': 'de', // Nota: Suiza tiene varios idiomas oficiales
  'Switzerland': 'de',
  'Schweiz': 'de',
  
  // Francés
  'Francia': 'fr',
  'France': 'fr',
  'Bélgica': 'fr',
  'Belgium': 'fr',
  'Belgique': 'fr',
  'Luxemburgo': 'fr',
  'Luxembourg': 'fr',
  'Mónaco': 'fr',
  'Monaco': 'fr',
  
  // Italiano
  'Italia': 'it',
  'Italy': 'it',
  
  // Portugués
  'Portugal': 'pt',
  'Brasil': 'pt',
  'Brazil': 'pt',
  
  // Inglés (explícito)
  'Reino Unido': 'en',
  'United Kingdom': 'en',
  'UK': 'en',
  'Inglaterra': 'en',
  'England': 'en',
  'Irlanda': 'en',
  'Ireland': 'en',
  'Estados Unidos': 'en',
  'United States': 'en',
  'USA': 'en',
  'Canadá': 'en',
  'Canada': 'en',
  'Australia': 'en',
  'Nueva Zelanda': 'en',
  'New Zealand': 'en',
};

/**
 * Detecta el idioma preferido basándose en el país del cliente
 * @param country - País del cliente
 * @param defaultLanguage - Idioma por defecto si no se encuentra el país
 * @returns Código de idioma (es, en, de, fr, it, pt)
 */
export function detectLanguageFromCountry(
  country?: string | null, 
  defaultLanguage: SupportedLanguage = 'en'
): SupportedLanguage {
  if (!country) {
    return defaultLanguage;
  }

  // Normalizar el país (eliminar espacios extras, capitalizar)
  const normalizedCountry = country.trim();

  // Buscar coincidencia exacta
  if (COUNTRY_TO_LANGUAGE[normalizedCountry]) {
    return COUNTRY_TO_LANGUAGE[normalizedCountry];
  }

  // Buscar coincidencia insensible a mayúsculas/minúsculas
  const countryLower = normalizedCountry.toLowerCase();
  for (const [key, value] of Object.entries(COUNTRY_TO_LANGUAGE)) {
    if (key.toLowerCase() === countryLower) {
      return value;
    }
  }

  // Si no se encuentra, devolver idioma por defecto
  return defaultLanguage;
}

/**
 * Obtiene el nombre del idioma en español
 */
export function getLanguageName(languageCode: SupportedLanguage): string {
  const names: Record<SupportedLanguage, string> = {
    'es': 'Español',
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    'it': 'Italiano',
    'pt': 'Português'
  };
  return names[languageCode] || names['en'];
}

/**
 * Lista de idiomas soportados para selectores
 */
export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; name: string }> = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch (Alemán)' },
  { code: 'fr', name: 'Français (Francés)' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }
];
