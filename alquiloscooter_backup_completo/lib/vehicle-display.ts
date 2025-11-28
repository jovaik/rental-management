
/**
 * Utilidad para extraer y mostrar el número visual del vehículo
 * desde la matrícula (ej: "N 07 3807GHX" → "N° 07")
 */

export function getVehicleVisualNumber(registration_number: string | null | undefined): string {
  if (!registration_number) return 'S/N';
  
  // Extraer el número que viene después de "N " al inicio
  // Ejemplos: "N 07 ...", "N 56 ...", "N 46 ..."
  const match = registration_number.match(/N\s+(\d+)/);
  
  if (match && match[1]) {
    return `N° ${match[1]}`;
  }
  
  // Si no coincide con el patrón, devolver la matrícula completa
  return registration_number;
}

/**
 * Extrae la matrícula real del vehículo
 * Ej: "N 56 6933NGT" → "6933NGT"
 */
export function getVehiclePlate(registration_number: string | null | undefined): string {
  if (!registration_number) return '';
  
  // Extraer la matrícula que viene después de "N XX "
  // Patrón: "N 56 6933NGT" → "6933NGT"
  const match = registration_number.match(/N\s+\d+\s+(.+)/);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Si no coincide con el patrón, devolver la matrícula completa
  return registration_number;
}

export function getVehicleFullDisplay(vehicle: {
  registration_number: string | null;
  make?: string | null;
  model?: string | null;
}): string {
  const visualNumber = getVehicleVisualNumber(vehicle.registration_number);
  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
  
  if (makeModel) {
    return `${visualNumber} - ${makeModel}`;
  }
  
  return visualNumber;
}

export function getBookingVisualNumber(booking_number: string | null): string {
  if (!booking_number) return 'Sin número';
  return `#${booking_number}`;
}
