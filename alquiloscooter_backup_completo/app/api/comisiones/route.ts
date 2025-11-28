
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
    const userId = parseInt(session.user.id);

    // Check permissions
    if (!["super_admin", "propietario", "colaborador"].includes(userRole || "")) {
      return NextResponse.json({ error: "No tienes permisos para acceder a esta información" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month") || "all"; // "all" o "0"-"11"
    const ownerIdParam = searchParams.get("ownerId"); // Filtro por propietario/cesionario

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

    // Build vehicle filter based on role
    let vehicleFilter: any = {
      ownership_type: "commission", // SOLO vehículos en comisión
    };
    
    if (userRole === "propietario") {
      vehicleFilter.owner_user_id = userId;
    } else if (userRole === "cesionario") {
      vehicleFilter.depositor_user_id = userId;
    } else if (userRole === "super_admin" && ownerIdParam) {
      // super_admin puede filtrar por propietario específico
      const ownerId = parseInt(ownerIdParam);
      vehicleFilter.OR = [
        { owner_user_id: ownerId },
        { depositor_user_id: ownerId },
      ];
    }
    // super_admin without filter sees all commission vehicles

    // Get vehicles with their bookings
    // SOLO vehículos que tengan al menos 1 reserva confirmada en el período
    const vehicles = await prisma.carRentalCars.findMany({
      where: {
        ...vehicleFilter,
        status: "T",
        bookings: {
          some: {
            pickup_date: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ["confirmed", "completed"],
            },
          },
        },
      },
      include: {
        bookings: {
          where: {
            pickup_date: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ["confirmed", "completed"],
            },
          },
        },
        ownerUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    // Calculate commissions for each vehicle
    const commissionsData = vehicles.map((vehicle: any) => {
      const totalRevenue = vehicle.bookings.reduce((sum: number, booking: any) => {
        return sum + (booking.total_price ? Number(booking.total_price) : 0);
      }, 0);

      const totalDaysRented = vehicle.bookings.reduce((sum: number, booking: any) => {
        if (booking.pickup_date && booking.return_date) {
          const days = Math.ceil(
            (new Date(booking.return_date).getTime() - new Date(booking.pickup_date).getTime()) /
            (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);

      // Calculate correctly: 
      // 1. Net Income = Revenue - Fixed Costs
      // 2. Commission = Net Income * %
      // 3. Our Share = Net Income - Commission
      
      const fixedCosts = vehicle.monthly_fixed_costs ? Number(vehicle.monthly_fixed_costs) : 0;
      const netIncome = totalRevenue - fixedCosts; // Beneficio Neto
      
      let commissionAmount = 0;
      if (vehicle.commission_percentage && netIncome > 0) {
        commissionAmount = (netIncome * Number(vehicle.commission_percentage)) / 100;
      }
      
      const ourShare = netIncome - commissionAmount; // Lo que nos queda

      return {
        id: vehicle.id,
        registration_number: vehicle.registration_number,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        ownership_type: vehicle.ownership_type,
        commission_percentage: vehicle.commission_percentage ? Number(vehicle.commission_percentage) : null,
        monthly_fixed_costs: fixedCosts,
        total_revenue: totalRevenue,
        total_days_rented: totalDaysRented,
        commission_amount: commissionAmount,
        net_income: netIncome,
        our_share: ourShare,
        owner_name: vehicle.ownerUser 
          ? `${vehicle.ownerUser.firstname || ''} ${vehicle.ownerUser.lastname || ''}`.trim() || vehicle.ownerUser.email
          : 'Sin propietario',
        bookings_count: vehicle.bookings.length,
      };
    });

    return NextResponse.json(commissionsData);
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de comisiones" },
      { status: 500 }
    );
  }
}
