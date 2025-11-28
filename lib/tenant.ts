import { headers } from 'next/headers';
import { prisma, setTenantId } from './prisma';
import type { Tenant } from '@prisma/client';

/**
 * Get tenant from subdomain in headers
 * Used in Server Components and API Routes
 */
export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const headersList = await headers();
  const subdomain = headersList.get('x-tenant-subdomain');

  if (!subdomain) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  return tenant;
}

/**
 * Get tenant and set context
 * Throws error if tenant not found
 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenantFromHeaders();

  if (!tenant) {
    throw new Error('Tenant not found or subdomain is missing');
  }

  // Set tenant context for Prisma middleware
  setTenantId(tenant.id);

  return tenant;
}

/**
 * Get tenant by subdomain directly
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { subdomain },
  });
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { id },
  });
}

/**
 * Create a new tenant
 */
export async function createTenant(data: {
  name: string;
  subdomain: string;
  businessTypes: Array<'SCOOTER_RENTAL' | 'VEHICLE_RENTAL' | 'PROPERTY_RENTAL' | 'BOAT_RENTAL' | 'EXPERIENCE_RENTAL' | 'EQUIPMENT_RENTAL'>;
  location?: string;
  logo?: string;
  colors?: any;
  config?: any;
}) {
  return prisma.tenant.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      subdomain: data.subdomain,
      businessTypes: data.businessTypes,
      location: data.location,
      logo: data.logo,
      colors: data.colors,
      config: data.config,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update tenant
 */
export async function updateTenant(
  id: string,
  data: Partial<{
    name: string;
    location: string;
    logo: string;
    colors: any;
    config: any;
  }>
) {
  return prisma.tenant.update({
    where: { id },
    data,
  });
}

/**
 * Check if subdomain is available
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const existing = await prisma.tenant.findUnique({
    where: { subdomain },
  });
  return !existing;
}
