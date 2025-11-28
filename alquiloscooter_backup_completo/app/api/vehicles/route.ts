

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getVehicleWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);
    
    // Obtener parámetro para incluir archivados
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    console.log('🔐 Usuario autenticado:', {
      id: userId,
      email: session.user.email,
      role: userRole,
      includeArchived
    });
    
    // Obtener información adicional del usuario para filtros
    const userInfo = await prisma.carRentalUsers.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true,
        email: true
      }
    });
    
    console.log('👤 Info del usuario desde BD:', userInfo);

    // Para usuarios tipo "taller", obtener sus ubicaciones de negocio asociadas
    let businessLocationIds: number[] = [];
    if (userRole === 'taller') {
      const userLocations = await prisma.businessLocations.findMany({
        where: { 
          user_id: userId,
          active: true
        },
        select: { id: true, name: true }
      });
      businessLocationIds = userLocations.map((loc: any) => loc.id);
      console.log('🏢 Ubicaciones del taller (user_id:', userId, '):', userLocations);
      console.log('🔢 IDs de ubicaciones:', businessLocationIds);
    }

    // Obtener la cláusula WHERE según el rol del usuario
    const baseWhereClause = getVehicleWhereClause({
      userId,
      userRole,
      businessLocationIds
    });
    
    // SIMPLIFICADO: Mostrar TODOS los vehículos por defecto
    // Solo filtrar archivados si el usuario EXPLÍCITAMENTE pide NO verlos
    const whereClause = includeArchived === false
      ? { ...baseWhereClause, archived_status: null }
      : baseWhereClause;
    
    console.log('🔍 WHERE clause generada:', JSON.stringify(whereClause, null, 2));

    // Get vehicles filtered by user role
    const now = new Date();
    const vehicles = await prisma.carRentalCars.findMany({
      where: whereClause,
      include: {
        pricingGroup: {
          select: {
            id: true,
            name: true,
            description: true,
            price_1_3_days: true,
            price_4_7_days: true,
            price_8_plus_days: true
          }
        },
        ownerUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        },
        depositorUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        },
        // Usar la nueva relación de muchos-a-muchos para reservas
        bookingVehicles: {
          where: {
            booking: {
              status: { in: ['confirmed', 'pending'] },
              pickup_date: { lte: now },
              return_date: { gte: now }
            }
          },
          include: {
            booking: {
              select: {
                id: true,
                customer_name: true,
                pickup_date: true,
                return_date: true,
                status: true
              }
            }
          }
        },
        maintenance: {
          where: {
            status: { in: ['scheduled', 'in_progress', 'overdue'] }
          },
          select: {
            id: true,
            title: true,
            scheduled_date: true,
            status: true
          }
        },
        documents: {
          where: {
            document_type: { in: ['photo', 'image', 'vehicle_photo'] }
          },
          take: 3,
          orderBy: {
            created_at: 'desc'
          }
        }
      },
      orderBy: { registration_number: 'asc' }
    });
    
    console.log(`✅ Se encontraron ${vehicles.length} vehículos para el usuario ${userId} (${userRole})`);
    if (vehicles.length > 0) {
      console.log('🚗 Matrículas:', vehicles.map((v: any) => v.registration_number).join(', '));
    }

    // Return all vehicle data including new fields
    const vehiclesWithAllData = vehicles.map((vehicle: any) => ({
      id: vehicle.id,
      registration_number: vehicle.registration_number || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year,
      color: vehicle.color,
      vin: vehicle.vin,
      mileage: vehicle.mileage,
      fuel_type: vehicle.fuel_type,
      condition_rating: vehicle.condition_rating,
      notes: vehicle.notes,
      status: vehicle.status,
      pricing_group_id: vehicle.pricing_group_id,
      pricingGroup: vehicle.pricingGroup,
      
      // Insurance
      insurance_policy: vehicle.insurance_policy,
      insurance_start_date: vehicle.insurance_start_date,
      insurance_expiry: vehicle.insurance_expiry,
      insurance_policy_type: vehicle.insurance_policy_type,
      insurance_active: vehicle.insurance_active,
      
      // ITV
      itv_valid: vehicle.itv_valid,
      last_itv_date: vehicle.last_itv_date,
      itv_expiry: vehicle.itv_expiry,
      
      // Ownership
      ownership_type: vehicle.ownership_type,
      owner_user_id: vehicle.owner_user_id,
      depositor_user_id: vehicle.depositor_user_id,
      owner_name: vehicle.ownerUser 
        ? `${vehicle.ownerUser.firstname} ${vehicle.ownerUser.lastname}`
        : null,
      depositor_name: vehicle.depositorUser
        ? `${vehicle.depositorUser.firstname} ${vehicle.depositorUser.lastname}`
        : null,
      rental_contract_end: vehicle.rental_contract_end,
      rental_monthly_payment: vehicle.rental_monthly_payment,
      commission_percentage: vehicle.commission_percentage,
      monthly_fixed_costs: vehicle.monthly_fixed_costs,
      rental_conditions: vehicle.rental_conditions,
      
      // Valuation
      purchase_price: vehicle.purchase_price,
      market_value: vehicle.market_value,
      sale_price: vehicle.sale_price,
      
      // Additional
      document_status: vehicle.document_status,
      spare_keys: vehicle.spare_keys,
      assigned_to: vehicle.assigned_to,
      current_location: vehicle.current_location,
      
      // Documentos (fotos)
      documents: vehicle.documents || [],
      
      // Extraer la reserva activa de la relación muchos-a-muchos
      currentBooking: vehicle.bookingVehicles && vehicle.bookingVehicles.length > 0 
        ? vehicle.bookingVehicles[0].booking 
        : null,
      activeMaintenance: vehicle.maintenance[0] || null
    }));

    return NextResponse.json(vehiclesWithAllData);

  } catch (error) {
    console.error('Vehicles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Datos recibidos para crear vehículo:', JSON.stringify(body, null, 2));
    
    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);

    // Prepare data for database - only include fields that exist in schema
    const vehicleData: any = {
      registration_number: body.registration_number,
      make: body.make,
      model: body.model,
      year: body.year ? parseInt(body.year.toString()) : null,
      color: body.color,
      vin: body.vin || null,
      mileage: body.mileage ? parseInt(body.mileage.toString()) : null,
      fuel_type: body.fuel_type,
      status: body.status || 'T',
      condition_rating: body.condition_rating,
      notes: body.notes || null,
      
      // Insurance
      insurance_policy: body.insurance_policy || null,
      insurance_start_date: body.insurance_start_date ? new Date(body.insurance_start_date) : null,
      insurance_expiry: body.insurance_expiry ? new Date(body.insurance_expiry) : null,
      insurance_policy_type: body.insurance_policy_type || 'daily',
      insurance_active: body.insurance_active || false,
      
      // ITV
      itv_valid: body.itv_valid || false,
      last_itv_date: body.last_itv_date ? new Date(body.last_itv_date) : null,
      itv_expiry: body.itv_expiry ? new Date(body.itv_expiry) : null,
      
      // Ownership
      ownership_type: body.ownership_type || 'owned',
      rental_contract_end: body.rental_contract_end ? new Date(body.rental_contract_end) : null,
      rental_monthly_payment: body.rental_monthly_payment ? parseFloat(body.rental_monthly_payment.toString()) : null,
      commission_percentage: body.commission_percentage ? parseFloat(body.commission_percentage.toString()) : null,
      monthly_fixed_costs: body.monthly_fixed_costs ? parseFloat(body.monthly_fixed_costs.toString()) : null,
      rental_conditions: body.rental_conditions || null,
      
      // Valuation
      purchase_price: body.purchase_price ? parseFloat(body.purchase_price.toString()) : null,
      market_value: body.market_value ? parseFloat(body.market_value.toString()) : null,
      sale_price: body.sale_price ? parseFloat(body.sale_price.toString()) : null,
      
      // Additional
      document_status: body.document_status || null,
      spare_keys: body.spare_keys || false,
      assigned_to: body.assigned_to || null,
      current_location: body.current_location || null,
      
      // Business Location (NEW)
      current_business_location_id: body.current_business_location_id || null,
      location_reason: body.location_reason || null,
      location_since: body.location_since ? new Date(body.location_since) : null
    };

    // Asignación automática de propietario/depositario según el rol
    // Si el usuario es propietario, asignarlo automáticamente como owner_user_id
    if (userRole === 'propietario') {
      vehicleData.owner_user_id = userId;
      console.log('🔑 Asignando automáticamente propietario:', userId);
    } else if (userRole === 'colaborador') {
      // Si es colaborador, asignarlo como depositario
      vehicleData.depositor_user_id = userId;
      console.log('🔑 Asignando automáticamente colaborador depositario:', userId);
    } else {
      // Para admin/super_admin, usar los valores del formulario si se proporcionan
      if (body.owner_user_id) vehicleData.owner_user_id = parseInt(body.owner_user_id.toString());
      if (body.depositor_user_id) vehicleData.depositor_user_id = parseInt(body.depositor_user_id.toString());
    }

    // Add optional fields if provided
    if (body.transmission_type) vehicleData.transmission_type = body.transmission_type;
    if (body.engine_size) vehicleData.engine_size = body.engine_size;
    if (body.seating_capacity) vehicleData.seating_capacity = parseInt(body.seating_capacity.toString());
    if (body.pricing_group_id) vehicleData.pricing_group_id = parseInt(body.pricing_group_id.toString());
    if (body.location_id) vehicleData.location_id = parseInt(body.location_id.toString());
    if (body.registration_expiry) vehicleData.registration_expiry = new Date(body.registration_expiry);

    console.log('💾 Guardando en BD:', JSON.stringify(vehicleData, null, 2));
    
    const vehicle = await prisma.carRentalCars.create({
      data: vehicleData
    });

    console.log('✅ Vehículo creado exitosamente:', vehicle.id);
    return NextResponse.json(vehicle, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error al crear vehículo:', error);
    console.error('Detalles del error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Error al crear el vehículo',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

