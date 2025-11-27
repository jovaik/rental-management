import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateTenant } from '@/lib/tenant';
import { UserRole, BusinessType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Validation schema
const updateTenantSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  location: z.string().min(2, 'Location is required').optional(),
  businessTypes: z.array(z.nativeEnum(BusinessType)).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  publishToMarbella4Rent: z.boolean().optional(),
});

/**
 * API Route: Update tenant settings
 * PUT /api/tenants/update
 * Only accessible by OWNER and ADMIN roles
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role permissions
    if (
      session.user.role !== UserRole.OWNER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only OWNER and ADMIN can update tenant settings' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = updateTenantSchema.safeParse(body);
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
    const tenantId = session.user.tenant_id;

    // Prepare update data
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.location) updateData.location = data.location;
    if (data.logo !== undefined) updateData.logo = data.logo || null;

    // Handle colors
    if (data.primaryColor || data.secondaryColor) {
      updateData.colors = {
        primary: data.primaryColor || '#3b82f6',
        secondary: data.secondaryColor || '#8b5cf6',
      };
    }

    // Handle config
    if (data.publishToMarbella4Rent !== undefined) {
      updateData.config = {
        publishToMarbella4Rent: data.publishToMarbella4Rent,
      };
    }

    // Update tenant
    const updatedTenant = await updateTenant(tenantId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant,
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: Get current tenant details
 * GET /api/tenants/update
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant data
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenant_id },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
