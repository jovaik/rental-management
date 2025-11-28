import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { ItemType, ItemStatus } from '@prisma/client';

// Validation schema for updating item
const updateItemSchema = z.object({
  type: z.nativeEnum(ItemType).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  basePrice: z.number().positive().optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  attributes: z.any().optional(),
  photos: z.array(z.string()).optional(),
});

/**
 * GET /api/items/[id]
 * Get a single item by ID (with tenant verification)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const item = await prisma.item.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/items/[id]
 * Update an item (with tenant verification)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Verify item belongs to tenant
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateItemSchema.parse(body);

    // Special validation for vehicles
    if (validatedData.type === ItemType.VEHICLE || existingItem.type === ItemType.VEHICLE) {
      const attributes = validatedData.attributes || existingItem.attributes || {};
      if (!attributes.licensePlate) {
        return NextResponse.json(
          { error: 'License plate is required for vehicles' },
          { status: 400 }
        );
      }
    }

    // Update item
    const item = await prisma.item.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating item:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update item', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/items/[id]
 * Delete an item (with tenant verification)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Verify item belongs to tenant
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        Booking: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if item has bookings
    if (existingItem.Booking && existingItem.Booking.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item with existing bookings' },
        { status: 400 }
      );
    }

    // Delete item
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item', details: error.message },
      { status: 500 }
    );
  }
}
