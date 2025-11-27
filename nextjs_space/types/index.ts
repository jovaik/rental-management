// Re-export Prisma generated types
export type {
  Tenant,
  User,
  Item,
  Customer,
  Booking,
  Invoice,
} from '@prisma/client';

// Re-export Prisma enums
export {
  BusinessType,
  UserRole,
  ItemType,
  ItemStatus,
  BookingStatus,
  InvoiceStatus,
  DocumentType,
} from '@prisma/client';

// Extended types with relations
export interface TenantWithCounts {
  id: string;
  name: string;
  subdomain: string;
  businessTypes: string[];
  location: string | null;
  logo: string | null;
  colors: any;
  config: any;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users?: number;
    items?: number;
    bookings?: number;
    customers?: number;
    invoices?: number;
  };
}

export interface UserWithTenant {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface ItemWithBookings {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  description: string | null;
  basePrice: number;
  status: string;
  attributes: any;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  bookings?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
  }>;
}

export interface BookingWithRelations {
  id: string;
  tenantId: string;
  itemId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  deposit: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  item: {
    id: string;
    name: string;
    type: string;
    photos: string[];
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
  }>;
}

export interface CustomerWithBookings {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  documents: any;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  bookings?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    status: string;
  }>;
}

export interface InvoiceWithRelations {
  id: string;
  tenantId: string;
  bookingId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  booking: {
    id: string;
    startDate: Date;
    endDate: Date;
    customer: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// Form types for creating/updating records
export interface CreateTenantInput {
  name: string;
  subdomain: string;
  businessTypes: string[];
  location?: string;
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  config?: any;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: string;
  phone?: string;
  avatar?: string;
}

export interface CreateItemInput {
  type: string;
  name: string;
  description?: string;
  basePrice: number;
  status?: string;
  attributes?: any;
  photos?: string[];
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  documents?: any;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export interface CreateBookingInput {
  itemId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  deposit?: number;
  notes?: string;
}

export interface CreateInvoiceInput {
  bookingId: string;
  invoiceNumber: string;
  amount: number;
  dueDate?: Date;
  pdfUrl?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Tenant context type
export interface TenantContext {
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    businessTypes: string[];
    logo: string | null;
    colors: any;
  };
}

// Session type for NextAuth
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

// Dashboard statistics type
export interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  availableItems: number;
  pendingInvoices: number;
  totalCustomers: number;
}

// Filter and search types
export interface BookingFilters {
  status?: string;
  itemId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ItemFilters {
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CustomerFilters {
  search?: string;
  city?: string;
  country?: string;
}
