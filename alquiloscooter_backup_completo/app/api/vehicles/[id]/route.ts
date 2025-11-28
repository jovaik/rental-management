
export const dynamic = "force-dynamic";

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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleId = parseInt((await params).id);
    
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: vehicleId },
      include: {
        location: {
          select: { id: true, name: true, address: true }
        },
        pricingGroup: {
          select: { 
            id: true, 
            name: true, 
            description: true,
            price_1_3_days: true,
            price_4_7_days: true,
            price_8_plus_days: true,
            price_monthly_high: true,
            price_monthly_low: true,
            price_annual_full: true,
            low_season_multiplier: true
          }
        },
        maintenance: {
          orderBy: { created_at: 'desc' },
          include: {
            expenses: true,
            workshop: true
          }
        },
        bookings: {
          orderBy: { pickup_date: 'desc' },
          take: 10
        },
        documents: {
          orderBy: { created_at: 'desc' }
        },
        vehicleHistory: {
          orderBy: { event_date: 'desc' },
          take: 20,
          include: {
            creator: {
              select: { id: true, firstname: true, lastname: true }
            }
          }
        }
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);

  } catch (error) {
    console.error('Vehicle fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleId = parseInt((await params).id);
    const body = await request.json();
    console.log('📝 Datos recibidos para actualizar vehículo:', JSON.stringify(body, null, 2));
    
    // Prepare data for database - only include fields that exist in schema
    const vehicleData: any = {};

    // Basic fields
    if (body.registration_number !== undefined) vehicleData.registration_number = body.registration_number;
    if (body.make !== undefined) vehicleData.make = body.make;
    if (body.model !== undefined) vehicleData.model = body.model;
    if (body.year !== undefined) vehicleData.year = body.year ? parseInt(body.year.toString()) : null;
    if (body.color !== undefined) vehicleData.color = body.color;
    if (body.mileage !== undefined) vehicleData.mileage = body.mileage ? parseInt(body.mileage.toString()) : null;
    if (body.fuel_type !== undefined) vehicleData.fuel_type = body.fuel_type;
    if (body.condition_rating !== undefined) vehicleData.condition_rating = body.condition_rating;
    if (body.notes !== undefined) vehicleData.notes = body.notes;
    if (body.status !== undefined) vehicleData.status = body.status;

    // Optional fields
    if (body.vin !== undefined) vehicleData.vin = body.vin || null;
    if (body.transmission_type !== undefined) vehicleData.transmission_type = body.transmission_type || null;
    if (body.engine_size !== undefined) vehicleData.engine_size = body.engine_size || null;
    if (body.seating_capacity !== undefined) vehicleData.seating_capacity = body.seating_capacity ? parseInt(body.seating_capacity.toString()) : null;
    
    // Ownership fields
    if (body.ownership_type !== undefined) vehicleData.ownership_type = body.ownership_type || null;
    
    // Insurance fields
    if (body.insurance_policy !== undefined) vehicleData.insurance_policy = body.insurance_policy || null;
    if (body.insurance_policy_type !== undefined) vehicleData.insurance_policy_type = body.insurance_policy_type || 'daily';
    if (body.insurance_active !== undefined) vehicleData.insurance_active = body.insurance_active || false;
    
    // ITV fields
    if (body.itv_valid !== undefined) vehicleData.itv_valid = body.itv_valid || false;
    
    // Additional fields
    if (body.document_status !== undefined) vehicleData.document_status = body.document_status || null;
    if (body.spare_keys !== undefined) vehicleData.spare_keys = body.spare_keys || false;
    if (body.assigned_to !== undefined) vehicleData.assigned_to = body.assigned_to || null;
    if (body.current_location !== undefined) vehicleData.current_location = body.current_location || null;
    
    // Business Location fields (NEW)
    if (body.current_business_location_id !== undefined) {
      vehicleData.current_business_location_id = body.current_business_location_id || null;
    }
    if (body.location_reason !== undefined) {
      vehicleData.location_reason = body.location_reason || null;
    }
    if (body.location_since !== undefined) {
      vehicleData.location_since = body.location_since && body.location_since !== '' 
        ? new Date(body.location_since) 
        : null;
    }
    
    // Handle dates - convert empty strings to null
    if (body.rental_contract_end !== undefined) {
      vehicleData.rental_contract_end = body.rental_contract_end && body.rental_contract_end !== '' 
        ? new Date(body.rental_contract_end) 
        : null;
    }
    if (body.insurance_start_date !== undefined) {
      vehicleData.insurance_start_date = body.insurance_start_date && body.insurance_start_date !== '' 
        ? new Date(body.insurance_start_date) 
        : null;
    }
    if (body.insurance_expiry !== undefined) {
      vehicleData.insurance_expiry = body.insurance_expiry && body.insurance_expiry !== '' 
        ? new Date(body.insurance_expiry) 
        : null;
    }
    if (body.registration_expiry !== undefined) {
      vehicleData.registration_expiry = body.registration_expiry && body.registration_expiry !== '' 
        ? new Date(body.registration_expiry) 
        : null;
    }
    if (body.last_itv_date !== undefined) {
      vehicleData.last_itv_date = body.last_itv_date && body.last_itv_date !== '' 
        ? new Date(body.last_itv_date) 
        : null;
    }
    if (body.itv_expiry !== undefined) {
      vehicleData.itv_expiry = body.itv_expiry && body.itv_expiry !== '' 
        ? new Date(body.itv_expiry) 
        : null;
    }
    if (body.purchase_date !== undefined) {
      vehicleData.purchase_date = body.purchase_date && body.purchase_date !== '' 
        ? new Date(body.purchase_date) 
        : null;
    }
    if (body.last_service_date !== undefined) {
      vehicleData.last_service_date = body.last_service_date && body.last_service_date !== '' 
        ? new Date(body.last_service_date) 
        : null;
    }
    if (body.next_service_due !== undefined) {
      vehicleData.next_service_due = body.next_service_due && body.next_service_due !== '' 
        ? new Date(body.next_service_due) 
        : null;
    }
    
    // Handle numeric fields
    if (body.rental_monthly_payment !== undefined) {
      vehicleData.rental_monthly_payment = body.rental_monthly_payment && body.rental_monthly_payment !== '' 
        ? parseFloat(body.rental_monthly_payment.toString()) 
        : null;
    }
    if (body.commission_percentage !== undefined) {
      vehicleData.commission_percentage = body.commission_percentage && body.commission_percentage !== '' 
        ? parseFloat(body.commission_percentage.toString()) 
        : null;
    }
    if (body.monthly_fixed_costs !== undefined) {
      vehicleData.monthly_fixed_costs = body.monthly_fixed_costs && body.monthly_fixed_costs !== '' 
        ? parseFloat(body.monthly_fixed_costs.toString()) 
        : null;
    }
    if (body.rental_conditions !== undefined) {
      vehicleData.rental_conditions = body.rental_conditions || null;
    }
    if (body.purchase_price !== undefined) {
      vehicleData.purchase_price = body.purchase_price && body.purchase_price !== '' 
        ? parseFloat(body.purchase_price.toString()) 
        : null;
    }
    if (body.current_value !== undefined) {
      vehicleData.current_value = body.current_value && body.current_value !== '' 
        ? parseFloat(body.current_value.toString()) 
        : null;
    }
    if (body.market_value !== undefined) {
      vehicleData.market_value = body.market_value && body.market_value !== '' 
        ? parseFloat(body.market_value.toString()) 
        : null;
    }
    if (body.sale_price !== undefined) {
      vehicleData.sale_price = body.sale_price && body.sale_price !== '' 
        ? parseFloat(body.sale_price.toString()) 
        : null;
    }
    
    // Handle IDs
    if (body.pricing_group_id !== undefined) {
      vehicleData.pricing_group_id = body.pricing_group_id ? parseInt(body.pricing_group_id.toString()) : null;
    }
    if (body.location_id !== undefined) {
      vehicleData.location_id = body.location_id ? parseInt(body.location_id.toString()) : null;
    }
    
    // Handle owner and depositor assignments
    if (body.owner_user_id !== undefined) {
      const parsedOwnerId = body.owner_user_id ? parseInt(body.owner_user_id.toString()) : null;
      vehicleData.owner_user_id = parsedOwnerId;
      console.log(`🔍 [Asignación] owner_user_id - Valor recibido: "${body.owner_user_id}", Parseado: ${parsedOwnerId}, Tipo: ${typeof parsedOwnerId}`);
    }
    if (body.depositor_user_id !== undefined) {
      const parsedDepositorId = body.depositor_user_id ? parseInt(body.depositor_user_id.toString()) : null;
      vehicleData.depositor_user_id = parsedDepositorId;
      console.log(`🔍 [Asignación] depositor_user_id - Valor recibido: "${body.depositor_user_id}", Parseado: ${parsedDepositorId}, Tipo: ${typeof parsedDepositorId}`);
    }
    
    // Archive fields
    if (body.archived_status !== undefined) {
      vehicleData.archived_status = body.archived_status || null;
      console.log(`🗂️  [Archivo] archived_status - Valor: "${body.archived_status}"`);
    }
    if (body.archived_date !== undefined) {
      vehicleData.archived_date = body.archived_date && body.archived_date !== '' 
        ? new Date(body.archived_date) 
        : null;
      console.log(`🗂️  [Archivo] archived_date - Valor: "${body.archived_date}"`);
    }
    if (body.archived_reason !== undefined) {
      vehicleData.archived_reason = body.archived_reason || null;
      console.log(`🗂️  [Archivo] archived_reason - Valor: "${body.archived_reason}"`);
    }
    if (body.buyer_name !== undefined) {
      vehicleData.buyer_name = body.buyer_name || null;
      console.log(`🗂️  [Archivo] buyer_name - Valor: "${body.buyer_name}"`);
    }
    if (body.sale_amount !== undefined) {
      vehicleData.sale_amount = body.sale_amount && body.sale_amount !== '' 
        ? parseFloat(body.sale_amount.toString()) 
        : null;
      console.log(`🗂️  [Archivo] sale_amount - Valor: "${body.sale_amount}"`);
    }

    // Always update the timestamp
    vehicleData.updated_at = new Date();

    console.log('💾 [Asignación] Datos que se guardarán en BD:', JSON.stringify(vehicleData, null, 2));
    console.log(`🚗 [Asignación] Actualizando vehículo ID: ${vehicleId}`);
    
    const vehicle = await prisma.carRentalCars.update({
      where: { id: vehicleId },
      data: vehicleData
    });

    console.log(`✅ [Asignación] Vehículo ${vehicle.id} actualizado exitosamente`);
    console.log(`📋 [Asignación] Valores guardados - owner_user_id: ${vehicle.owner_user_id}, depositor_user_id: ${vehicle.depositor_user_id}`);
    
    // ✅ CRÍTICO: Leer el vehículo completo de la BD para devolverlo al frontend
    // Esto asegura que el frontend reciba TODOS los campos actualizados
    const fullVehicle = await prisma.carRentalCars.findUnique({
      where: { id: vehicleId },
      include: {
        location: {
          select: { id: true, name: true, address: true }
        },
        pricingGroup: {
          select: { 
            id: true, 
            name: true, 
            description: true
          }
        }
      }
    });
    console.log(`🔍 [Verificación] Vehículo completo devuelto al frontend:`, JSON.stringify({
      id: fullVehicle?.id,
      registration_number: fullVehicle?.registration_number,
      owner_user_id: fullVehicle?.owner_user_id,
      depositor_user_id: fullVehicle?.depositor_user_id
    }, null, 2));
    
    return NextResponse.json(fullVehicle);

  } catch (error: any) {
    console.error('❌ Error al actualizar vehículo:', error);
    console.error('Detalles del error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Error al actualizar el vehículo',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleId = parseInt((await params).id);
    
    // Eliminar el vehículo
    await prisma.carRentalCars.delete({
      where: { id: vehicleId }
    });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });

  } catch (error) {
    console.error('Vehicle delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
