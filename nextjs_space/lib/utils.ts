import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
  }).format(dateObj);
}

/**
 * Calculate days between two dates
 */
export function calculateDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(tenantId: string, count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count + 1).padStart(5, '0');
  const tenantPrefix = tenantId.substring(0, 4).toUpperCase();
  return `INV-${tenantPrefix}-${year}-${paddedCount}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Split by dots
  const parts = host.split('.');
  
  // If localhost or IP, no subdomain
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }
  
  // If we have at least 3 parts (subdomain.domain.tld), return the first part
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

/**
 * Slugify string for URLs
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Check if dates overlap
 */
export function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Parse JSON safely
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
