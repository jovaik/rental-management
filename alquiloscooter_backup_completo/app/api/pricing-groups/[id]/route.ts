
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pricingGroup = await prisma.carRentalPricingGroups.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicles: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      }
    });

    if (!pricingGroup) {
      return NextResponse.json({ error: 'Pricing group not found' }, { status: 404 });
    }

    return NextResponse.json(pricingGroup);
  } catch (error) {
    console.error('Error fetching pricing group:', error);
    return NextResponse.json({ error: 'Error fetching pricing group' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const groupId = parseInt(id);

    console.log('📝 Datos recibidos para actualizar grupo de precios:', JSON.stringify(data, null, 2));

    // Prepare update data - convert and validate fields
    const updateData: any = {
      name: data.name,
      description: data.description,
    };

    // Handle numeric fields - convert strings to Decimal/numbers
    if (data.price_1_3_days !== undefined) {
      updateData.price_1_3_days = data.price_1_3_days ? parseFloat(data.price_1_3_days.toString()) : null;
    }
    if (data.price_4_7_days !== undefined) {
      updateData.price_4_7_days = data.price_4_7_days ? parseFloat(data.price_4_7_days.toString()) : null;
    }
    if (data.price_8_plus_days !== undefined) {
      updateData.price_8_plus_days = data.price_8_plus_days ? parseFloat(data.price_8_plus_days.toString()) : null;
    }
    if (data.price_monthly_high !== undefined) {
      updateData.price_monthly_high = data.price_monthly_high ? parseFloat(data.price_monthly_high.toString()) : null;
    }
    if (data.price_monthly_low !== undefined) {
      updateData.price_monthly_low = data.price_monthly_low ? parseFloat(data.price_monthly_low.toString()) : null;
    }
    if (data.price_annual_full !== undefined) {
      updateData.price_annual_full = data.price_annual_full ? parseFloat(data.price_annual_full.toString()) : null;
    }
    if (data.low_season_multiplier !== undefined) {
      updateData.low_season_multiplier = data.low_season_multiplier ? parseFloat(data.low_season_multiplier.toString()) : null;
    }
    if (data.deposit_amount !== undefined) {
      updateData.deposit_amount = data.deposit_amount ? parseFloat(data.deposit_amount.toString()) : null;
    }
    if (data.extra_km_charge !== undefined) {
      updateData.extra_km_charge = data.extra_km_charge ? parseFloat(data.extra_km_charge.toString()) : null;
    }

    // Handle integer fields
    if (data.included_km_per_day !== undefined) {
      updateData.included_km_per_day = data.included_km_per_day ? parseInt(data.included_km_per_day.toString()) : null;
    }
    if (data.min_months_high_season !== undefined) {
      updateData.min_months_high_season = data.min_months_high_season ? parseInt(data.min_months_high_season.toString()) : null;
    }
    if (data.min_months_low_season !== undefined) {
      updateData.min_months_low_season = data.min_months_low_season ? parseInt(data.min_months_low_season.toString()) : null;
    }
    if (data.min_months_full_year !== undefined) {
      updateData.min_months_full_year = data.min_months_full_year ? parseInt(data.min_months_full_year.toString()) : null;
    }

    // Handle vehicle_category_id - must be Int or null
    if (data.vehicle_category_id !== undefined) {
      const categoryId = parseInt(data.vehicle_category_id?.toString() || '0');
      updateData.vehicle_category_id = categoryId > 0 ? categoryId : null;
    }

    console.log('💾 Actualizando grupo de precios en BD:', JSON.stringify(updateData, null, 2));

    // Update pricing group data
    const pricingGroup = await prisma.carRentalPricingGroups.update({
      where: { id: groupId },
      data: updateData,
    });

    // Handle vehicle assignments if vehicle_ids is provided
    if (data.vehicle_ids !== undefined && Array.isArray(data.vehicle_ids)) {
      // First, remove this group from all vehicles currently assigned to it
      await prisma.carRentalCars.updateMany({
        where: { pricing_group_id: groupId },
        data: { pricing_group_id: null }
      });

      // Then assign the new selected vehicles to this group
      if (data.vehicle_ids.length > 0) {
        await prisma.carRentalCars.updateMany({
          where: { 
            id: { in: data.vehicle_ids }
            // Removed status filter to allow all vehicles
          },
          data: { pricing_group_id: groupId }
        });
      }
    }

    // Return updated pricing group with vehicles
    const updatedGroup = await prisma.carRentalPricingGroups.findUnique({
      where: { id: groupId },
      include: {
        vehicles: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      }
    });

    console.log('✅ Grupo de precios actualizado exitosamente:', updatedGroup?.id);
    return NextResponse.json(updatedGroup);
  } catch (error: any) {
    console.error('❌ Error al actualizar grupo de precios:', error);
    console.error('Detalles del error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ 
      error: 'Error al actualizar el grupo de precios',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Soft delete - just mark as inactive
    await prisma.carRentalPricingGroups.update({
      where: { id: parseInt(id) },
      data: { status: 'inactive' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing group:', error);
    return NextResponse.json({ error: 'Error deleting pricing group' }, { status: 500 });
  }
}
