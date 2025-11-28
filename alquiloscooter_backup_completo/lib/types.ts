import { Decimal } from '@prisma/client/runtime/library';

// Dashboard and Statistics
export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  activeBookings: number;
  totalBookings: number;
  pendingMaintenance: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  maintenanceCosts: number;
  vehicleUtilization: number;
}

export interface VehicleWithDetails {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  status: string;
  fuel_type: string;
  transmission_type: string;
  condition_rating: string;
  insurance_expiry: Date;
  registration_expiry: Date;
  next_service_due: Date;
  location: {
    id: number;
    name: string;
  };
  maintenance: MaintenanceRecord[];
  documents: VehicleDocument[];
  bookings: BookingRecord[];
}

export interface MaintenanceRecord {
  id: number;
  title: string;
  maintenance_type: string;
  scheduled_date: Date;
  completed_date?: Date;
  status: string;
  priority: string;
  estimated_duration_hours?: Decimal;
  workshop_location?: string;
  notes?: string;
  expenses: MaintenanceExpense[];
}

export interface MaintenanceExpense {
  id: number;
  expense_category: string;
  item_name: string;
  quantity: Decimal;
  unit_price: Decimal;
  total_price: Decimal;
  supplier?: string;
  purchase_date?: Date;
  notes?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  event_type: string;
  start_datetime: Date;
  end_datetime: Date;
  color: string;
  status: string;
  priority: string;
  car?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
  description?: string;
}

export interface VehicleDocument {
  id: number;
  document_type: string;
  title: string;
  file_path: string;
  file_name: string;
  issue_date?: Date;
  expiry_date?: Date;
  is_expired: string;
}

export interface BookingRecord {
  id: number;
  customer_name: string;
  customer_email: string;
  pickup_date: Date;
  return_date: Date;
  total_price: Decimal;
  status: string;
  actual_pickup_datetime?: Date;
  actual_return_datetime?: Date;
}

export interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: string;
  created_at: Date;
}

export interface ConfigData {
  [key: string]: string | number | boolean;
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type MaintenanceType = 'preventive' | 'corrective' | 'emergency' | 'inspection';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type EventType = 'booking' | 'maintenance' | 'inspection' | 'unavailable' | 'blocked' | 'custom';
export type DocumentType = 'registration' | 'insurance' | 'inspection' | 'manual' | 'warranty' | 'receipt' | 'photo' | 'other';

// User Role Types
export type UserRole = 'super_admin' | 'admin' | 'propietario' | 'colaborador' | 'operador' | 'taller';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// Role Permissions
interface RolePermissions {
  name: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageVehicles: boolean;
  canManagePricing: boolean;
  canManageBookings: boolean;
  canManageMaintenance: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canDeleteData: boolean;
  canViewOwnVehicles: boolean;
  canViewCommissions: boolean;
  canRequestBookings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    name: 'Super Administrador',
    canManageUsers: true,
    canManageRoles: true,
    canManageVehicles: true,
    canManagePricing: true,
    canManageBookings: true,
    canManageMaintenance: true,
    canViewReports: true,
    canManageSettings: true,
    canDeleteData: true,
    canViewOwnVehicles: true,
    canViewCommissions: true,
    canRequestBookings: false,
  },
  admin: {
    name: 'Administrador',
    canManageUsers: false,
    canManageRoles: false,
    canManageVehicles: true,
    canManagePricing: true,
    canManageBookings: true,
    canManageMaintenance: true,
    canViewReports: true,
    canManageSettings: true,
    canDeleteData: false,
    canViewOwnVehicles: true,
    canViewCommissions: true,
    canRequestBookings: false,
  },
  propietario: {
    name: 'Propietario',
    canManageUsers: false,
    canManageRoles: false,
    canManageVehicles: false,
    canManagePricing: false,
    canManageBookings: false,
    canManageMaintenance: false,
    canViewReports: true,
    canManageSettings: false,
    canDeleteData: false,
    canViewOwnVehicles: true,
    canViewCommissions: true,
    canRequestBookings: false,
  },
  colaborador: {
    name: 'Colaborador',
    canManageUsers: false,
    canManageRoles: false,
    canManageVehicles: false,
    canManagePricing: false,
    canManageBookings: false,
    canManageMaintenance: false,
    canViewReports: true,
    canManageSettings: false,
    canDeleteData: false,
    canViewOwnVehicles: true,
    canViewCommissions: true,
    canRequestBookings: true,
  },
  operador: {
    name: 'Operador',
    canManageUsers: false,
    canManageRoles: false,
    canManageVehicles: false,
    canManagePricing: false,
    canManageBookings: true,
    canManageMaintenance: false,
    canViewReports: false,
    canManageSettings: false,
    canDeleteData: false,
    canViewOwnVehicles: false,
    canViewCommissions: false,
    canRequestBookings: false,
  },
  taller: {
    name: 'Taller',
    canManageUsers: false,
    canManageRoles: false,
    canManageVehicles: false,
    canManagePricing: false,
    canManageBookings: false,
    canManageMaintenance: true,
    canViewReports: false,
    canManageSettings: false,
    canDeleteData: false,
    canViewOwnVehicles: false,
    canViewCommissions: false,
    canRequestBookings: false,
  }
};

// Helper function to check permissions
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions ? rolePermissions[permission] as boolean : false;
}

// Helper function to check if user has any of the required roles
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}
