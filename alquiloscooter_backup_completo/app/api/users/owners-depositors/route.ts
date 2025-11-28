
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get users with role "propietario"
    const owners = await prisma.carRentalUsers.findMany({
      where: {
        role: "propietario",
        status: "T",
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
      orderBy: {
        firstname: "asc",
      },
    });

    // Get users with role "cesionario"
    const depositors = await prisma.carRentalUsers.findMany({
      where: {
        role: "cesionario",
        status: "T",
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
      orderBy: {
        firstname: "asc",
      },
    });

    return NextResponse.json({
      owners,
      depositors,
    });
  } catch (error) {
    console.error("Error fetching owners/depositors:", error);
    return NextResponse.json(
      { error: "Error al obtener propietarios y cesionarios" },
      { status: 500 }
    );
  }
}
