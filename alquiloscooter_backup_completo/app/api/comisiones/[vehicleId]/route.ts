
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { vehicleId: vehicleIdParam } = await params;
    const userRole = session.user.role;
    const userId = parseInt(session.user.id);
    const vehicleId = parseInt(vehicleIdParam);

    // Check permissions
    if (!["super_admin", "propietario", "colaborador"].includes(userRole || "")) {
      return NextResponse.json({ error: "No tienes permisos para acceder a esta información" }, { status: 403 });
    }

    // Verify vehicle ownership
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    // Check if user has permission to view this vehicle's data
    if (userRole === "propietario" && vehicle.owner_user_id !== userId) {
      return NextResponse.json({ error: "No tienes permisos para ver este vehículo" }, { status: 403 });
    }

    if (userRole === "cesionario" && vehicle.depositor_user_id !== userId) {
      return NextResponse.json({ error: "No tienes permisos para ver este vehículo" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month") || "all";

    // Calculate date range
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate = new Date();
    let endDate = new Date();
    
    if (monthParam === "all") {
      // Todo el año
      startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    } else {
      // Mes específico (0-11)
      const monthIndex = parseInt(monthParam);
      startDate = new Date(currentYear, monthIndex, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999);
    }

    // Get bookings for this vehicle
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        car_id: vehicleId,
        pickup_date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["confirmed", "completed"],
        },
      },
      orderBy: {
        pickup_date: "desc",
      },
    });

    const bookingsWithDays = bookings.map((booking: any) => {
      const days = booking.pickup_date && booking.return_date
        ? Math.ceil(
            (new Date(booking.return_date).getTime() - new Date(booking.pickup_date).getTime()) /
            (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        id: booking.id,
        booking_number: booking.booking_number, // LOPD: Mostrar número de reserva en lugar de nombre de cliente
        pickup_date: booking.pickup_date,
        return_date: booking.return_date,
        total_price: booking.total_price ? Number(booking.total_price) : 0,
        status: booking.status,
        days,
      };
    });

    return NextResponse.json({ bookings: bookingsWithDays });
  } catch (error) {
    console.error("Error fetching vehicle bookings:", error);
    return NextResponse.json(
      { error: "Error al obtener alquileres del vehículo" },
      { status: 500 }
    );
  }
}
