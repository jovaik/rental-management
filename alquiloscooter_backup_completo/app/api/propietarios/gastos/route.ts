
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * API endpoint para gestionar gastos de vehículos del propietario
 * POST /api/propietarios/gastos - Crear nuevo gasto
 * GET /api/propietarios/gastos?vehicleId=X - Obtener gastos de un vehículo
 */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const body = await req.json();

    const {
      vehicle_id,
      fecha,
      tipo_documento,
      numero_factura,
      proveedor,
      proveedor_cif,
      categoria,
      descripcion,
      base_imponible,
      iva_porcentaje,
      iva_importe,
      total,
      metodo_pago
    } = body;

    // Verificar que el vehículo pertenece al propietario
    const vehiculo = await prisma.carRentalCars.findFirst({
      where: {
        id: parseInt(vehicle_id),
        owner_user_id: userId
      }
    });

    if (!vehiculo) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o no tienes acceso' },
        { status: 403 }
      );
    }

    // Crear el gasto
    const nuevoGasto = await prisma.carRentalGastos.create({
      data: {
        fecha: fecha ? new Date(fecha) : new Date(),
        tipo_documento: tipo_documento || 'TICKET',
        numero_factura: numero_factura || null,
        proveedor: proveedor || null,
        proveedor_cif: proveedor_cif || null,
        categoria,
        descripcion,
        base_imponible: base_imponible ? parseFloat(base_imponible) : null,
        iva_porcentaje: iva_porcentaje ? parseFloat(iva_porcentaje) : null,
        iva_importe: iva_importe ? parseFloat(iva_importe) : null,
        total: parseFloat(total),
        metodo_pago,
        vehicle_id: parseInt(vehicle_id)
      }
    });

    return NextResponse.json({
      success: true,
      gasto: nuevoGasto
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/propietarios/gastos:', error);
    return NextResponse.json(
      { error: 'Error al crear gasto', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Se requiere vehicleId' },
        { status: 400 }
      );
    }

    // Verificar que el vehículo pertenece al propietario
    const vehiculo = await prisma.carRentalCars.findFirst({
      where: {
        id: parseInt(vehicleId),
        owner_user_id: userId
      }
    });

    if (!vehiculo) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o no tienes acceso' },
        { status: 403 }
      );
    }

    // Obtener gastos del vehículo
    const gastos = await prisma.carRentalGastos.findMany({
      where: {
        vehicle_id: parseInt(vehicleId)
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      gastos
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/propietarios/gastos:', error);
    return NextResponse.json(
      { error: 'Error al obtener gastos', details: error.message },
      { status: 500 }
    );
  }
}
