import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createTenant, isSubdomainAvailable } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { BusinessType, UserRole } from '@prisma/client';

// Validation schema
const createTenantSchema = z.object({
  // Step 1: Basic info
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminName: z.string().min(2, 'Name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Subdomain must contain only lowercase letters, numbers, and hyphens'
    ),

  // Step 2: Business config
  location: z.string().min(2, 'Location is required'),
  businessType: z.nativeEnum(BusinessType),

  // Step 3: Customization (optional)
  logo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  publishToMarbella4Rent: z.boolean().optional(),
});

/**
 * API Route: Create new tenant with admin user
 * POST /api/tenants/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createTenantSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check subdomain availability
    const available = await isSubdomainAvailable(data.subdomain);
    if (!available) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subdomain is already taken',
        },
        { status: 409 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is already registered',
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          subdomain: data.subdomain,
          businessTypes: [data.businessType],
          location: data.location,
          logo: data.logo || null,
          colors: (data.primaryColor || data.secondaryColor)
            ? {
                primary: data.primaryColor || '#3b82f6',
                secondary: data.secondaryColor || '#8b5cf6',
              }
            : undefined,
          config: data.publishToMarbella4Rent
            ? {
                publishToMarbella4Rent: true,
              }
            : undefined,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          name: data.adminName,
          password: hashedPassword,
          role: UserRole.OWNER,
          isActive: true,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenantId: result.tenant.id,
        subdomain: result.tenant.subdomain,
        userId: result.user.id,
      },
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
