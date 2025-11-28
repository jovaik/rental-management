
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * API endpoint para obtener los vehículos del propietario autenticado
 * GET /api/propietarios/vehiculos
 * 
 * Retorna:
 * - Lista de vehículos donde el usuario es propietario (owner_user_id)
 * - Información básica del vehículo
 * - Comisión pactada
 * - Estadísticas de reservas
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);

    // Obtener vehículos del propietario
    const vehiculos = await prisma.carRentalCars.findMany({
      where: {
        owner_user_id: userId,
        status: 'T' // Solo vehículos activos
      },
      select: {
        id: true,
        registration_number: true,
        make: true,
        model: true,
        year: true,
        color: true,
        commission_percentage: true,
        ownership_type: true,
        mileage: true,
        status: true,
        created_at: true,
        pricingGroup: {
          select: {
            id: true,
            name: true,
            price_1_3_days: true,
            price_4_7_days: true,
            price_8_plus_days: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Para cada vehículo, calcular estadísticas
    const vehiculosConStats = await Promise.all(
      vehiculos.map(async (vehiculo) => {
        // Obtener reservas del vehículo (excluyendo canceladas y requests)
        const reservas = await prisma.bookingVehicles.findMany({
          where: {
            car_id: vehiculo.id,
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
                total_price: true
              }
            }
          }
        });

        // Calcular estadísticas
        const totalReservas = reservas.length;
        const reservasActivas = reservas.filter(r => 
          r.booking.status === 'confirmed' || 
          r.booking.status === 'in_progress'
        ).length;

        // Calcular ingresos totales
        const ingresosTotales = reservas.reduce((sum, r) => {
          return sum + (parseFloat(r.booking.total_price?.toString() || '0'));
        }, 0);

        // Calcular comisión del propietario
        const comisionPorcentaje = parseFloat(vehiculo.commission_percentage?.toString() || '50');
        const comisionTotal = (ingresosTotales * comisionPorcentaje) / 100;

        // Obtener gastos del vehículo
        const gastos = await prisma.carRentalGastos.findMany({
          where: {
            vehicle_id: vehiculo.id
          },
          select: {
            id: true,
            fecha: true,
            categoria: true,
            descripcion: true,
            total: true,
            metodo_pago: true
          },
          orderBy: {
            fecha: 'desc'
          },
          take: 10 // Últimos 10 gastos
        });

        const totalGastos = gastos.reduce((sum, g) => {
          return sum + parseFloat(g.total.toString());
        }, 0);

        return {
          ...vehiculo,
          estadisticas: {
            totalReservas,
            reservasActivas,
            ingresosTotales: ingresosTotales.toFixed(2),
            comisionPorcentaje,
            comisionTotal: comisionTotal.toFixed(2),
            totalGastos: totalGastos.toFixed(2),
            balance: (comisionTotal - totalGastos).toFixed(2)
          },
          ultimosGastos: gastos
        };
      })
    );

    return NextResponse.json({
      success: true,
      vehiculos: vehiculosConStats
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/propietarios/vehiculos:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículos', details: error.message },
      { status: 500 }
    );
  }
}
