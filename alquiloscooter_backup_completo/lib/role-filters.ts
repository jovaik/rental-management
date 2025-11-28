
/**
 * Role-based data filtering utilities
 * Implements compartmentalization: each role sees only their own data
 */

import { UserRole } from './types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface FilterOptions {
  userId?: number;
  userRole?: UserRole;
  locationId?: number;
  workshopLocation?: string;
  businessLocationIds?: number[];
}

/**
 * Get Prisma where clause for vehicles based on user role
 */
export function getVehicleWhereClause(options: FilterOptions) {
  const { userId, userRole, locationId, workshopLocation, businessLocationIds } = options;

  // Super Admin y Admin ven todos los vehículos
  if (userRole === 'super_admin' || userRole === 'admin') {
    return {};
  }

  // Propietario: solo sus vehículos
  if (userRole === 'propietario') {
    return {
      owner_user_id: userId
    };
  }

  // Colaborador: solo vehículos que tiene en depósito
  if (userRole === 'colaborador') {
    return {
      depositor_user_id: userId
    };
  }

  // Operador: solo vehículos de su ubicación
  if (userRole === 'operador' && locationId) {
    return {
      location_id: locationId
    };
  }

  // Taller: solo vehículos en ubicaciones de negocio asociadas a este usuario
  if (userRole === 'taller') {
    if (businessLocationIds && businessLocationIds.length > 0) {
      return {
        current_business_location_id: {
          in: businessLocationIds
        }
      };
    }
    // Si no tiene ubicaciones asignadas, no mostrar nada
    return {
      id: -1
    };
  }

  // Por defecto, no mostrar nada si no cumple ningún criterio
  return {
    id: -1 // Esto asegura que no se muestre nada
  };
}

/**
 * Get Prisma where clause for bookings based on user role
 * CORREGIDO: Ahora incluye vehículos adicionales (multivehículo)
 */
export function getBookingWhereClause(options: FilterOptions) {
  const { userId, userRole, locationId, workshopLocation } = options;

  // Super Admin y Admin ven todas las reservas
  if (userRole === 'super_admin' || userRole === 'admin') {
    return {};
  }

  // Propietario: reservas donde el vehículo principal O algún vehículo adicional es suyo
  if (userRole === 'propietario') {
    return {
      OR: [
        // Vehículo principal
        {
          car: {
            owner_user_id: userId
          }
        },
        // Vehículos adicionales
        {
          vehicles: {
            some: {
              car: {
                owner_user_id: userId
              }
            }
          }
        }
      ]
    };
  }

  // Colaborador: reservas donde el vehículo principal O algún vehículo adicional está en depósito con él
  if (userRole === 'colaborador') {
    return {
      OR: [
        // Vehículo principal
        {
          car: {
            depositor_user_id: userId
          }
        },
        // Vehículos adicionales
        {
          vehicles: {
            some: {
              car: {
                depositor_user_id: userId
              }
            }
          }
        }
      ]
    };
  }

  // Operador: reservas donde el vehículo principal O algún vehículo adicional es de su ubicación
  if (userRole === 'operador' && locationId) {
    return {
      OR: [
        // Vehículo principal
        {
          car: {
            location_id: locationId
          }
        },
        // Vehículos adicionales
        {
          vehicles: {
            some: {
              car: {
                location_id: locationId
              }
            }
          }
        }
      ]
    };
  }

  // Taller: no debería ver reservas
  return {
    id: -1
  };
}

/**
 * Get Prisma where clause for maintenance records based on user role
 */
export function getMaintenanceWhereClause(options: FilterOptions) {
  const { userId, userRole, locationId, businessLocationIds } = options;

  // Super Admin y Admin ven todo el mantenimiento
  if (userRole === 'super_admin' || userRole === 'admin') {
    return {};
  }

  // Propietario: solo mantenimiento de sus vehículos
  if (userRole === 'propietario') {
    return {
      car: {
        owner_user_id: userId
      }
    };
  }

  // Colaborador: mantenimiento de vehículos que tiene en depósito
  if (userRole === 'colaborador') {
    return {
      car: {
        depositor_user_id: userId
      }
    };
  }

  // Taller: solo mantenimiento asignado a su workshop
  if (userRole === 'taller') {
    if (businessLocationIds && businessLocationIds.length > 0) {
      return {
        workshop_id: {
          in: businessLocationIds
        }
      };
    }
    return {
      id: -1
    };
  }

  // Operador: no debería gestionar mantenimiento
  return {
    id: -1
  };
}

/**
 * Get Prisma where clause for documents based on user role
 */
export function getDocumentWhereClause(options: FilterOptions) {
  const { userId, userRole, locationId, businessLocationIds } = options;

  // Super Admin y Admin ven todos los documentos
  if (userRole === 'super_admin' || userRole === 'admin') {
    return {};
  }

  // Propietario: solo documentos de sus vehículos
  if (userRole === 'propietario') {
    return {
      car: {
        owner_user_id: userId
      }
    };
  }

  // Colaborador: documentos de vehículos que tiene en depósito
  if (userRole === 'colaborador') {
    return {
      car: {
        depositor_user_id: userId
      }
    };
  }

  // Taller: documentos de vehículos en ubicaciones asociadas
  if (userRole === 'taller') {
    if (businessLocationIds && businessLocationIds.length > 0) {
      return {
        car: {
          current_business_location_id: {
            in: businessLocationIds
          }
        }
      };
    }
    return {
      id: -1
    };
  }

  // Operador: no debería ver documentos
  return {
    id: -1
  };
}

/**
 * Check if user has access to a specific vehicle
 */
export function canAccessVehicle(
  vehicle: any,
  userRole: UserRole,
  userId?: number,
  locationId?: number,
  businessLocationIds?: number[]
): boolean {
  // Super Admin y Admin tienen acceso a todo
  if (userRole === 'super_admin' || userRole === 'admin') {
    return true;
  }

  // Propietario: solo sus vehículos
  if (userRole === 'propietario') {
    return vehicle.owner_user_id === userId;
  }

  // Colaborador: solo vehículos en depósito
  if (userRole === 'colaborador') {
    return vehicle.depositor_user_id === userId;
  }

  // Operador: solo vehículos de su ubicación
  if (userRole === 'operador') {
    return vehicle.location_id === locationId;
  }

  // Taller: solo vehículos en ubicaciones asociadas
  if (userRole === 'taller') {
    if (!businessLocationIds || businessLocationIds.length === 0) {
      return false;
    }
    return businessLocationIds.includes(vehicle.current_business_location_id);
  }

  return false;
}

/**
 * Get user info from session for filtering
 */
export async function getUserFilterInfo() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  return {
    userId: parseInt(session.user.id),
    userRole: session.user.role as UserRole,
    email: session.user.email || '',
  };
}
