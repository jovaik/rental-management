
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener vehículos de una ubicación (para usuarios tipo "taller")
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario no especificado" },
        { status: 400 }
      );
    }

    // Buscar la ubicación asociada a este usuario
    const location = await prisma.businessLocations.findFirst({
      where: {
        user_id: parseInt(userId),
        active: true,
      },
    });

    if (!location) {
      return NextResponse.json([]);
    }

    // Obtener vehículos en esa ubicación
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        current_business_location_id: location.id,
      },
      include: {
        businessLocation: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        maintenance: {
          where: {
            status: {
              in: ["pending", "in_progress"],
            },
          },
          orderBy: {
            scheduled_date: "asc",
          },
          take: 5,
        },
      },
      orderBy: {
        registration_number: "asc",
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching location vehicles:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 }
    );
  }
}
