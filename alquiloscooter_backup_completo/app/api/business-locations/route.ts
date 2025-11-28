
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener todas las ubicaciones
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const locations = await prisma.businessLocations.findMany({
      where: {
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching business locations:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva ubicación
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const location = await prisma.businessLocations.create({
      data: {
        name: data.name,
        type: data.type || "office",
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country || "España",
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        user_id: data.user_id || null,
        notes: data.notes,
        active: true,
        is_public_pickup_point: data.is_public_pickup_point || false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error creating business location:", error);
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    );
  }
}
