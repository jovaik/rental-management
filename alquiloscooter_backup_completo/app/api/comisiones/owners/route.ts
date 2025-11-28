
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role;

    // Solo super_admin puede ver la lista de propietarios
    if (userRole !== "super_admin") {
      return NextResponse.json({ error: "No tienes permisos para acceder a esta información" }, { status: 403 });
    }

    // Obtener todos los propietarios/cesionarios únicos de vehículos en comisión
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        ownership_type: "commission",
        status: "T",
      },
      select: {
        owner_user_id: true,
        depositor_user_id: true,
        ownerUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        depositorUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    // Crear un mapa para evitar duplicados
    const ownersMap = new Map<number, string>();

    vehicles.forEach((vehicle: any) => {
      // Añadir owner_user_id si existe
      if (vehicle.ownerUser) {
        const name = `${vehicle.ownerUser.firstname || ''} ${vehicle.ownerUser.lastname || ''}`.trim() || vehicle.ownerUser.email;
        ownersMap.set(vehicle.ownerUser.id, name);
      }
      // Añadir depositor_user_id si existe
      if (vehicle.depositorUser && !ownersMap.has(vehicle.depositorUser.id)) {
        const name = `${vehicle.depositorUser.firstname || ''} ${vehicle.depositorUser.lastname || ''}`.trim() || vehicle.depositorUser.email;
        ownersMap.set(vehicle.depositorUser.id, name);
      }
    });

    // Convertir el mapa a un array
    const owners = Array.from(ownersMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));

    // Ordenar alfabéticamente por nombre
    owners.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(owners);
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json(
      { error: "Error al obtener propietarios" },
      { status: 500 }
    );
  }
}
