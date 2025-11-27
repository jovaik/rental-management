import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Tenant context storage
export let currentTenantId: string | null = null;

export function setTenantId(tenantId: string | null) {
  currentTenantId = tenantId;
}

export function getTenantId(): string | null {
  return currentTenantId;
}

// Create Prisma Client with multi-tenant middleware
function createPrismaClient() {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Models that require tenant isolation
  const TENANT_MODELS = [
    'user',
    'item',
    'booking',
    'customer',
    'invoice',
  ];

  // Middleware for automatic tenant_id injection
  prisma.$use(async (params, next) => {
    const tenantId = getTenantId();

    // Skip tenant isolation for Tenant model itself
    if (params.model === 'Tenant') {
      return next(params);
    }

    // Check if this is a tenant-isolated model
    if (TENANT_MODELS.includes(params.model?.toLowerCase() || '')) {
      // CREATE operations
      if (params.action === 'create') {
        if (!tenantId) {
          throw new Error('Tenant ID is required for creating records');
        }
        params.args.data = {
          ...params.args.data,
          tenantId,
        };
      }

      // CREATE MANY operations
      if (params.action === 'createMany') {
        if (!tenantId) {
          throw new Error('Tenant ID is required for creating records');
        }
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId,
          }));
        } else {
          params.args.data = {
            ...params.args.data,
            tenantId,
          };
        }
      }

      // READ operations (findMany, findFirst, findUnique, count, aggregate)
      if (
        ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(
          params.action
        )
      ) {
        if (tenantId) {
          params.args.where = {
            ...params.args.where,
            tenantId,
          };
        }
      }

      // UPDATE operations
      if (params.action === 'update' || params.action === 'updateMany') {
        if (tenantId) {
          params.args.where = {
            ...params.args.where,
            tenantId,
          };
        }
      }

      // DELETE operations
      if (params.action === 'delete' || params.action === 'deleteMany') {
        if (tenantId) {
          params.args.where = {
            ...params.args.where,
            tenantId,
          };
        }
      }

      // UPSERT operations
      if (params.action === 'upsert') {
        if (!tenantId) {
          throw new Error('Tenant ID is required for upsert operations');
        }
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
        params.args.create = {
          ...params.args.create,
          tenantId,
        };
        params.args.update = {
          ...params.args.update,
        };
      }
    }

    return next(params);
  });

  return prisma;
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
