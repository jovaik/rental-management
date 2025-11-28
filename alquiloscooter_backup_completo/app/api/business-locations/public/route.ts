
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener solo las ubicaciones públicas (puntos de recogida/devolución)
export async function GET() {
  try {
    const publicLocations = await prisma.businessLocations.findMany({
      where: {
        active: true,
        is_public_pickup_point: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        city: true,
        postal_code: true,
        country: true,
        contact_phone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(publicLocations);
  } catch (error) {
    console.error("Error fetching public locations:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicaciones públicas" },
      { status: 500 }
    );
  }
}
