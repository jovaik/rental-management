
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('❌ [Bulk Assign] No hay sesión activa');
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role;
    console.log(`✅ [Bulk Assign] Usuario autenticado: ${session.user.email} (Rol: ${userRole})`);

    // Solo super_admin puede hacer asignaciones masivas
    if (userRole !== "super_admin") {
      console.log(`❌ [Bulk Assign] Permiso denegado para rol: ${userRole}`);
      return NextResponse.json(
        { error: "No tienes permisos para realizar asignaciones masivas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      vehicle_ids,
      owner_user_id,
      commission_percentage,
      monthly_fixed_costs,
      current_business_location_id,
    } = body;

    console.log('📋 [Bulk Assign] Datos recibidos:', {
      vehicle_ids,
      owner_user_id,
      commission_percentage,
      monthly_fixed_costs,
      current_business_location_id
    });

    // Validar datos requeridos
    if (!vehicle_ids || !Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
      console.log('❌ [Bulk Assign] No se seleccionaron vehículos');
      return NextResponse.json(
        { error: "Debes seleccionar al menos un vehículo" },
        { status: 400 }
      );
    }

    if (!owner_user_id) {
      console.log('❌ [Bulk Assign] No se seleccionó propietario');
      return NextResponse.json(
        { error: "Debes seleccionar un propietario" },
        { status: 400 }
      );
    }

    if (commission_percentage === undefined || commission_percentage < 0 || commission_percentage > 100) {
      console.log(`❌ [Bulk Assign] Porcentaje de comisión inválido: ${commission_percentage}`);
      return NextResponse.json(
        { error: "El porcentaje de comisión debe estar entre 0 y 100" },
        { status: 400 }
      );
    }

    // Verificar que el propietario existe
    const owner = await prisma.carRentalUsers.findUnique({
      where: { id: parseInt(owner_user_id) },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (!owner) {
      console.log(`❌ [Bulk Assign] Propietario no encontrado con ID: ${owner_user_id}`);
      return NextResponse.json(
        { error: `No se encontró el propietario con ID: ${owner_user_id}` },
        { status: 404 }
      );
    }

    if (owner.role !== 'propietario') {
      console.log(`❌ [Bulk Assign] Usuario no es propietario. Rol actual: ${owner.role}`);
      return NextResponse.json(
        { error: `El usuario seleccionado no tiene rol de propietario (Rol actual: ${owner.role})` },
        { status: 400 }
      );
    }

    if (owner.status !== 'T') {
      console.log(`❌ [Bulk Assign] Propietario no está activo. Estado: ${owner.status}`);
      return NextResponse.json(
        { error: `El propietario seleccionado no está activo` },
        { status: 400 }
      );
    }

    console.log(`✅ [Bulk Assign] Propietario verificado: ${owner.firstname} ${owner.lastname} (${owner.email})`);

    // Verificar cuántos vehículos existen
    const vehicleIdsInt = vehicle_ids.map((id: any) => parseInt(id));
    const existingVehicles = await prisma.carRentalCars.findMany({
      where: {
        id: {
          in: vehicleIdsInt
        }
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true
      }
    });

    console.log(`📊 [Bulk Assign] Vehículos encontrados: ${existingVehicles.length} de ${vehicle_ids.length}`);
    
    if (existingVehicles.length === 0) {
      console.log('❌ [Bulk Assign] No se encontraron vehículos con los IDs proporcionados');
      return NextResponse.json(
        { error: "No se encontraron vehículos con los IDs proporcionados" },
        { status: 404 }
      );
    }

    // Actualizar todos los vehículos seleccionados
    console.log('🔄 [Bulk Assign] Actualizando vehículos...');
    const result = await prisma.carRentalCars.updateMany({
      where: {
        id: {
          in: vehicleIdsInt,
        },
      },
      data: {
        ownership_type: "commission",
        owner_user_id: parseInt(owner_user_id),
        commission_percentage: parseFloat(commission_percentage),
        monthly_fixed_costs: monthly_fixed_costs ? parseFloat(monthly_fixed_costs) : 0,
        current_business_location_id: current_business_location_id
          ? parseInt(current_business_location_id)
          : null,
        updated_at: new Date(),
      },
    });

    console.log(`✅ [Bulk Assign] Asignación completada: ${result.count} vehículos actualizados`);

    return NextResponse.json({
      success: true,
      message: `Se han asignado ${result.count} vehículos correctamente al propietario ${owner.firstname} ${owner.lastname}`,
      count: result.count,
      owner: {
        name: `${owner.firstname} ${owner.lastname}`,
        email: owner.email
      }
    });
  } catch (error: any) {
    console.error("❌ [Bulk Assign] Error completo:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { 
        error: "Error al asignar vehículos masivamente",
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
