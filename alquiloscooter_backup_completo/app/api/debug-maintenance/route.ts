
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const userId = parseInt(session.user.id);

    // Solo admin y taller pueden acceder a este endpoint de diagnóstico
    if (userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'taller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const diagnostics: any = {
      user: {
        id: userId,
        name: session.user.name,
        email: session.user.email,
        role: userRole
      },
      businessLocations: [],
      visibleVehicles: [],
      allMaintenanceRecords: [],
      visibleMaintenanceRecords: []
    };

    // 1. Obtener ubicaciones de negocio del usuario (si es taller)
    if (userRole === 'taller') {
      const locations = await prisma.businessLocations.findMany({
        where: {
          user_id: userId,
          active: true
        }
      });
      diagnostics.businessLocations = locations;
      const locationIds = locations.map(l => l.id);

      // 2. Obtener vehículos visibles para este usuario
      if (locationIds.length > 0) {
        const vehicles = await prisma.carRentalCars.findMany({
          where: {
            current_business_location_id: {
              in: locationIds
            }
          },
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true,
            current_business_location_id: true
          }
        });
        diagnostics.visibleVehicles = vehicles;

        // 3. Obtener TODOS los mantenimientos de los vehículos visibles
        const vehicleIds = vehicles.map((v: any) => v.id);
        if (vehicleIds.length > 0) {
          const allMaintenance = await prisma.carRentalVehicleMaintenance.findMany({
            where: {
              car_id: {
                in: vehicleIds
              }
            },
            include: {
              car: {
                select: {
                  id: true,
                  registration_number: true,
                  make: true,
                  model: true,
                  current_business_location_id: true
                }
              }
            },
            orderBy: {
              scheduled_date: 'desc'
            }
          });
          diagnostics.allMaintenanceRecords = allMaintenance;

          // 4. Filtrar solo los que pasarían el filtro actual
          const visibleMaintenance = allMaintenance.filter(m => 
            locationIds.includes(m.car?.current_business_location_id || 0)
          );
          diagnostics.visibleMaintenanceRecords = visibleMaintenance;
        }
      }
    } else if (userRole === 'admin' || userRole === 'super_admin') {
      // Para admin, mostrar todos los vehículos y mantenimientos
      const allVehicles = await prisma.carRentalCars.findMany({
        select: {
          id: true,
          registration_number: true,
          make: true,
          model: true,
          current_business_location_id: true
        }
      });
      diagnostics.visibleVehicles = allVehicles;

      const allMaintenance = await prisma.carRentalVehicleMaintenance.findMany({
        include: {
          car: {
            select: {
              id: true,
              registration_number: true,
              make: true,
              model: true,
              current_business_location_id: true
            }
          }
        },
        orderBy: {
          scheduled_date: 'desc'
        }
      });
      diagnostics.allMaintenanceRecords = allMaintenance;
      diagnostics.visibleMaintenanceRecords = allMaintenance;
    }

    // 5. Buscar específicamente el vehículo N°6 Piaggio Zip
    const n6Vehicle = await prisma.carRentalCars.findFirst({
      where: {
        OR: [
          { registration_number: { contains: 'N6', mode: 'insensitive' } },
          { registration_number: { contains: 'N 6', mode: 'insensitive' } }
        ],
        model: { contains: 'ZIP', mode: 'insensitive' }
      },
      include: {
        businessLocation: true
      }
    });

    if (n6Vehicle) {
      diagnostics.n6Vehicle = {
        id: n6Vehicle.id,
        registration_number: n6Vehicle.registration_number,
        make: n6Vehicle.make,
        model: n6Vehicle.model,
        current_business_location_id: n6Vehicle.current_business_location_id,
        business_location: n6Vehicle.businessLocation
      };

      // Obtener todos los mantenimientos del N°6
      const n6Maintenance = await prisma.carRentalVehicleMaintenance.findMany({
        where: {
          car_id: n6Vehicle.id
        },
        include: {
          expenses: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      diagnostics.n6MaintenanceRecords = n6Maintenance;

      // Verificar si el usuario de taller puede verlos
      if (userRole === 'taller') {
        const locationIds = diagnostics.businessLocations.map((l: any) => l.id);
        const canSeeN6 = locationIds.includes(n6Vehicle.current_business_location_id || 0);
        diagnostics.n6Visibility = {
          canSee: canSeeN6,
          reason: canSeeN6 
            ? 'El vehículo está en una ubicación asignada al usuario'
            : `El vehículo está en ubicación ${n6Vehicle.current_business_location_id}, pero el usuario solo tiene acceso a ubicaciones: ${locationIds.join(', ')}`
        };
      }
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    console.error('Debug maintenance error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
