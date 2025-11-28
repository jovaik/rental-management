
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * API endpoint para obtener detalles de un vehículo específico del propietario
 * GET /api/propietarios/vehiculos/[vehicleId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const vehicleId = parseInt(params.vehicleId);

    // Verificar que el vehículo pertenece al propietario
    const vehiculo = await prisma.carRentalCars.findFirst({
      where: {
        id: vehicleId,
        owner_user_id: userId
      },
      include: {
        pricingGroup: true
      }
    });

    if (!vehiculo) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o no tienes acceso' },
        { status: 404 }
      );
    }

    // Obtener todas las reservas del vehículo (sin datos personales)
    const reservas = await prisma.bookingVehicles.findMany({
      where: {
        car_id: vehicleId,
        booking: {
          status: {
            notIn: ['cancelled', 'request']
          }
        }
      },
      include: {
        booking: {
          select: {
            id: true,
            booking_number: true,
            pickup_date: true,
            return_date: true,
            status: true,
            total_price: true,
            actual_pickup_datetime: true,
            actual_return_datetime: true
          }
        }
      },
      orderBy: {
        booking: {
          pickup_date: 'desc'
        }
      }
    });

    // Obtener todos los gastos del vehículo
    const gastos = await prisma.carRentalGastos.findMany({
      where: {
        vehicle_id: vehicleId
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Calcular totales
    const ingresosTotales = reservas.reduce((sum, r) => {
      return sum + parseFloat(r.booking.total_price?.toString() || '0');
    }, 0);

    const comisionPorcentaje = parseFloat(vehiculo.commission_percentage?.toString() || '50');
    const comisionTotal = (ingresosTotales * comisionPorcentaje) / 100;

    const totalGastos = gastos.reduce((sum, g) => {
      return sum + parseFloat(g.total.toString());
    }, 0);

    return NextResponse.json({
      success: true,
      vehiculo: {
        ...vehiculo,
        estadisticas: {
          totalReservas: reservas.length,
          reservasActivas: reservas.filter(r => 
            r.booking.status === 'confirmed' || 
            r.booking.status === 'in_progress'
          ).length,
          ingresosTotales: ingresosTotales.toFixed(2),
          comisionPorcentaje,
          comisionTotal: comisionTotal.toFixed(2),
          totalGastos: totalGastos.toFixed(2),
          balance: (comisionTotal - totalGastos).toFixed(2)
        }
      },
      reservas: reservas.map(r => ({
        id: r.booking.id,
        booking_number: r.booking.booking_number,
        pickup_date: r.booking.pickup_date,
        return_date: r.booking.return_date,
        actual_pickup: r.booking.actual_pickup_datetime,
        actual_return: r.booking.actual_return_datetime,
        status: r.booking.status,
        total_price: r.booking.total_price,
        comision: ((parseFloat(r.booking.total_price?.toString() || '0') * comisionPorcentaje) / 100).toFixed(2)
      })),
      gastos
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/propietarios/vehiculos/[vehicleId]:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del vehículo', details: error.message },
      { status: 500 }
    );
  }
}
