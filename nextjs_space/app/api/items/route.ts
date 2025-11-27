import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { z } from 'zod';
import { ItemType, ItemStatus } from '@prisma/client';

// Validation schema for creating item
const createItemSchema = z.object({
  type: z.nativeEnum(ItemType),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  basePrice: z.number().positive('Price must be greater than 0'),
  status: z.nativeEnum(ItemStatus).default(ItemStatus.AVAILABLE),
  attributes: z.any().optional(),
  photos: z.array(z.string()).default([]),
});

/**
 * GET /api/items
 * List all items for the current tenant with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = { tenantId };

    if (type && Object.values(ItemType).includes(type as ItemType)) {
      where.type = type;
    }

    if (status && Object.values(ItemStatus).includes(status as ItemStatus)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch items
    const items = await prisma.item.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items
 * Create a new item for the current tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createItemSchema.parse(body);

    // Special validation for vehicles
    if (validatedData.type === ItemType.VEHICLE) {
      const attributes = validatedData.attributes || {};
      if (!attributes.licensePlate) {
        return NextResponse.json(
          { error: 'License plate is required for vehicles' },
          { status: 400 }
        );
      }
    }

    // Create item
    const item = await prisma.item.create({
      data: {
        tenantId,
        type: validatedData.type,
        name: validatedData.name,
        description: validatedData.description,
        basePrice: validatedData.basePrice,
        status: validatedData.status,
        attributes: validatedData.attributes,
        photos: validatedData.photos,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: item,
        message: 'Item created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating item:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create item', details: error.message },
      { status: 500 }
    );
  }
}
