
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

    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta información" },
        { status: 403 }
      );
    }

    // Get all users with referral tracking
    const users = await prisma.carRentalUsers.findMany({
      where: {
        OR: [
          { referral_code: { not: null } },
          { role: { in: ["propietario", "colaborador"] } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        referral_code: true,
        referral_enabled: true,
        referredBookings: {
          select: {
            id: true,
            total_price: true,
            status: true,
            pickup_date: true,
          },
        },
      },
      orderBy: {
        firstname: "asc",
      },
    });

    const usersWithStats = users.map((user) => {
      const totalBookings = user.referredBookings.length;
      const totalRevenue = user.referredBookings.reduce(
        (sum, booking) => sum + (Number(booking.total_price) || 0),
        0
      );
      const completedBookings = user.referredBookings.filter(
        (b) => b.status === "completed"
      ).length;

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email,
        role: user.role,
        referralCode: user.referral_code,
        referralEnabled: user.referral_enabled,
        totalBookings,
        completedBookings,
        totalRevenue,
        conversionRate:
          totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      };
    });

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching referral users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios afiliados" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, referralCode, referralEnabled } = body;

    await prisma.carRentalUsers.update({
      where: { id: userId },
      data: {
        referral_code: referralCode || undefined,
        referral_enabled: referralEnabled !== undefined ? referralEnabled : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user referral:", error);
    return NextResponse.json(
      { error: "Error al actualizar afiliado" },
      { status: 500 }
    );
  }
}
