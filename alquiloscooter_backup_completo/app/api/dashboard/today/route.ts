
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBookingWhereClause } from '@/lib/role-filters';
import { UserRole } from '@/lib/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);

    // Obtener la fecha de hoy (solo fecha, sin hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Obtener filtros basados en el rol del usuario
    const roleBasedWhere = getBookingWhereClause({ userId, userRole });

    // Obtener reservas con salida hoy
    const pickups = await prisma.carRentalBookings.findMany({
      where: {
        ...roleBasedWhere,
        status: { in: ['confirmed', 'pending'] },
        pickup_date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        vehicles: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      },
      orderBy: {
        pickup_date: 'asc'
      }
    });

    // Obtener reservas con devolución hoy
    const returns = await prisma.carRentalBookings.findMany({
      where: {
        ...roleBasedWhere,
        status: { in: ['confirmed', 'pending'] },
        return_date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        vehicles: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      },
      orderBy: {
        return_date: 'asc'
      }
    });

    // Obtener peticiones de reservas nuevas (pending) - últimas 10
    const pendingRequests = await prisma.carRentalBookings.findMany({
      where: {
        ...roleBasedWhere,
        status: 'pending'
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        vehicles: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      pickups,
      returns,
      pendingRequests
    });
  } catch (error) {
    console.error('Error fetching today summary:', error);
    return NextResponse.json(
      { error: 'Error fetching today summary' },
      { status: 500 }
    );
  }
}
