
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener una ubicación específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const location = await prisma.businessLocations.findUnique({
      where: {
        id: parseInt(params.id),
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
        vehicles: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true,
            location_reason: true,
            location_since: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error fetching business location:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicación" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar ubicación
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const location = await prisma.businessLocations.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        user_id: data.user_id || null,
        notes: data.notes,
        active: data.active,
        is_public_pickup_point: data.is_public_pickup_point !== undefined ? data.is_public_pickup_point : false,
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
    console.error("Error updating business location:", error);
    return NextResponse.json(
      { error: "Error al actualizar ubicación" },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar ubicación (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si hay vehículos asignados
    const vehiclesCount = await prisma.carRentalCars.count({
      where: {
        current_business_location_id: parseInt(params.id),
      },
    });

    if (vehiclesCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Hay ${vehiclesCount} vehículo(s) asignado(s) a esta ubicación.`,
        },
        { status: 400 }
      );
    }

    // Soft delete
    const location = await prisma.businessLocations.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error deleting business location:", error);
    return NextResponse.json(
      { error: "Error al eliminar ubicación" },
      { status: 500 }
    );
  }
}
