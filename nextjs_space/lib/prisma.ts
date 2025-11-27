import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

// Tenant context storage
export let currentTenantId: string | null = null;

export function setTenantId(tenantId: string | null) {
  currentTenantId = tenantId;
}

export function getTenantId(): string | null {
  return currentTenantId;
}

// Create Prisma Client - no middleware needed for now
// We'll handle tenant isolation manually in API routes
function createPrismaClient() {
  // Skip during build if DATABASE_URL is not set
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
    console.warn('DATABASE_URL not set, using mock Prisma client for build');
    return new PrismaClient();
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return client;
}

// Singleton pattern for Prisma Client
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper function to execute queries with tenant context
export async function withTenant<T>(
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  const previousTenantId = getTenantId();
  try {
    setTenantId(tenantId);
    return await callback();
  } finally {
    setTenantId(previousTenantId);
  }
}

// Helper function to get tenant by subdomain
export async function getTenantBySubdomain(subdomain: string) {
  return prisma.tenant.findUnique({
    where: { subdomain },
  });
}

// Helper function to validate tenant access
export function requireTenantId(): string {
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new Error('Tenant context is required but not set');
  }
  return tenantId;
}
