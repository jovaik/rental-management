
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateReferralCode(name: string): string {
  const cleanName = name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .substring(0, 6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${cleanName}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const user = await prisma.carRentalUsers.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        firstname: true,
        lastname: true,
        referral_code: true,
        referral_enabled: true 
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // If user already has a referral code, return it
    if (user.referral_code) {
      return NextResponse.json({
        referralCode: user.referral_code,
        enabled: user.referral_enabled,
      });
    }

    // Generate new referral code
    const name = user.firstname || user.lastname || "USER";
    let referralCode = generateReferralCode(name);

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.carRentalUsers.findUnique({
        where: { referral_code: referralCode },
      });

      if (!existing) break;

      referralCode = generateReferralCode(name);
      attempts++;
    }

    // Update user with referral code
    await prisma.carRentalUsers.update({
      where: { id: userId },
      data: {
        referral_code: referralCode,
        referral_enabled: true,
      },
    });

    return NextResponse.json({
      referralCode,
      enabled: true,
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    return NextResponse.json(
      { error: "Error al generar código de afiliado" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { enabled } = body;

    await prisma.carRentalUsers.update({
      where: { id: userId },
      data: { referral_enabled: enabled },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating referral status:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de afiliado" },
      { status: 500 }
    );
  }
}
