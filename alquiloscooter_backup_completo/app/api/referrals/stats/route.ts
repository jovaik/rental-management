
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

    const userId = parseInt(session.user.id);
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "all";

    // Calculate date range
    let startDate: Date | undefined;
    if (period !== "all") {
      startDate = new Date();
      if (period === "month") {
        startDate.setMonth(startDate.getMonth());
        startDate.setDate(1);
      } else if (period === "year") {
        startDate.setMonth(0);
        startDate.setDate(1);
      }
      startDate.setHours(0, 0, 0, 0);
    }

    // Get bookings referred by this user
    const bookings = await prisma.carRentalBookings.findMany({
      where: {
        referred_by_user_id: userId,
        ...(startDate && { pickup_date: { gte: startDate } }),
      },
      include: {
        car: true,
        vehicles: {
          include: {
            car: true,
          },
        },
      },
      orderBy: {
        pickup_date: "desc",
      },
    });

    // Calculate statistics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + (Number(booking.total_price) || 0),
      0
    );

    // Calculate potential commission (10% as example, can be customized per user)
    const commissionPercentage = 10;
    const totalCommission = (totalRevenue * commissionPercentage) / 100;

    // Group by status
    const statusCounts = bookings.reduce(
      (acc, booking) => {
        const status = booking.status || "pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      totalBookings,
      totalRevenue,
      totalCommission,
      commissionPercentage,
      statusCounts,
      bookings: bookings.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.booking_number,
        customerName: booking.customer_name,
        pickupDate: booking.pickup_date,
        returnDate: booking.return_date,
        totalPrice: Number(booking.total_price),
        status: booking.status,
        vehicle: booking.car
          ? `${booking.car.make} ${booking.car.model}`
          : booking.vehicles && booking.vehicles[0]
          ? `${booking.vehicles[0].car.make} ${booking.vehicles[0].car.model}`
          : "N/A",
      })),
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
