
/**
 * Sistema de Numeración de Expedientes
 * Formato: YYYYMMDD0001
 * - YYYY: Año completo (4 dígitos, ej: 2025)
 * - MM: Mes (01-12)
 * - DD: Día (01-31)
 * - 0001: Número secuencial diario (0001-9999)
 * 
 * Ejemplo: 20251022 0001 = Primera reserva del 22 de octubre de 2025
 */

import { prisma } from './db';

/**
 * Genera el siguiente número de expediente para una fecha específica
 * @param date - Fecha para la cual generar el expediente (por defecto: fecha actual)
 * @returns string - Número de expediente en formato YYYYMMDD0001
 */
export async function generateBookingNumber(date?: Date): Promise<string> {
  const targetDate = date || new Date();
  
  // Obtener componentes de fecha
  const year = targetDate.getFullYear().toString(); // Año completo (4 dígitos)
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`;
  
  // Buscar el último número de expediente del día
  const lastBooking = await prisma.carRentalBookings.findFirst({
    where: {
      booking_number: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      booking_number: 'desc'
    }
  });
  
  let sequentialNumber = 1;
  
  if (lastBooking && lastBooking.booking_number) {
    // Extraer el número secuencial del último expediente
    const lastSequential = parseInt(lastBooking.booking_number.slice(-4));
    sequentialNumber = lastSequential + 1;
  }
  
  // Formatear el número secuencial con ceros a la izquierda (4 dígitos)
  const sequentialStr = sequentialNumber.toString().padStart(4, '0');
  
  return `${datePrefix}${sequentialStr}`;
}

/**
 * Genera un número de expediente para una fecha específica
 * @param date - Fecha para la cual generar el expediente
 * @returns string - Número de expediente
 */
export async function generateBookingNumberForDate(date: Date): Promise<string> {
  const year = date.getFullYear().toString(); // Año completo (4 dígitos)
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const datePrefix = `${year}${month}${day}`;
  
  const lastBooking = await prisma.carRentalBookings.findFirst({
    where: {
      booking_number: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      booking_number: 'desc'
    }
  });
  
  let sequentialNumber = 1;
  
  if (lastBooking && lastBooking.booking_number) {
    const lastSequential = parseInt(lastBooking.booking_number.slice(-4));
    sequentialNumber = lastSequential + 1;
  }
  
  const sequentialStr = sequentialNumber.toString().padStart(4, '0');
  
  return `${datePrefix}${sequentialStr}`;
}

/**
 * Obtiene la ruta del expediente para almacenar archivos
 * @param bookingNumber - Número de expediente
 * @returns string - Ruta del expediente en S3
 */
export function getBookingFilePath(bookingNumber: string, fileType: string): string {
  return `expedientes/${bookingNumber}/${fileType}/`;
}

/**
 * Valida el formato de un número de expediente
 * @param bookingNumber - Número de expediente a validar
 * @returns boolean - True si el formato es válido
 */
export function validateBookingNumber(bookingNumber: string): boolean {
  // Formato: YYYYMMDD0001 (12 caracteres)
  const regex = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{4}$/;
  return regex.test(bookingNumber);
}

/**
 * Extrae información de un número de expediente
 * @param bookingNumber - Número de expediente
 * @returns object - Información del expediente
 */
export function parseBookingNumber(bookingNumber: string): {
  year: number;
  month: number;
  day: number;
  sequential: number;
  date: Date;
} | null {
  if (!validateBookingNumber(bookingNumber)) {
    return null;
  }
  
  const year = parseInt(bookingNumber.slice(0, 4)); // Año completo (YYYY)
  const month = parseInt(bookingNumber.slice(4, 6));
  const day = parseInt(bookingNumber.slice(6, 8));
  const sequential = parseInt(bookingNumber.slice(8, 12));
  
  const date = new Date(year, month - 1, day);
  
  return {
    year,
    month,
    day,
    sequential,
    date
  };
}
