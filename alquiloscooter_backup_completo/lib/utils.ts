
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number | string, currency: string = '€'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num?.toLocaleString?.('es-ES', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) ?? '0.00'} ${currency}`;
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toLocaleDateString?.('es-ES') ?? '-';
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toLocaleString?.('es-ES') ?? '-';
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800', 
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'overdue': 'bg-red-100 text-red-800',
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'T': 'bg-green-100 text-green-800',
    'F': 'bg-red-100 text-red-800',
    'available': 'bg-green-100 text-green-800',
    'rented': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-orange-100 text-orange-800',
    'inactive': 'bg-gray-100 text-gray-800',
  };
  return statusColors?.[status] ?? 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800',
  };
  return priorityColors?.[priority] ?? 'bg-gray-100 text-gray-800';
};

export const getMaintenanceTypeIcon = (type: string): string => {
  const typeIcons: Record<string, string> = {
    'preventive': '🔧',
    'corrective': '⚙️',
    'emergency': '🚨',
    'inspection': '🔍',
  };
  return typeIcons?.[type] ?? '🔧';
};

export const calculateDaysUntil = (date: Date | string | null | undefined): number => {
  if (!date) return 0;
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpiring = (date: Date | string | null | undefined, daysThreshold: number = 30): boolean => {
  const daysUntil = calculateDaysUntil(date);
  return daysUntil <= daysThreshold && daysUntil >= 0;
};

export const isOverdue = (date: Date | string | null | undefined): boolean => {
  const daysUntil = calculateDaysUntil(date);
  return daysUntil < 0;
};

export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'hace un momento' : `hace ${diffInMinutes} minutos`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? 'hace 1 hora' : `hace ${diffInHours} horas`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? 'ayer' : `hace ${diffInDays} días`;
  } else {
    return formatDate(d);
  }
};
