
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Generar código de afiliado único
function generateReferralCode(firstName: string, lastName: string): string {
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  if (cleanFirst && cleanLast) {
    return `${cleanFirst.substring(0, 3)}${cleanLast.substring(0, 3)}${random}`;
  } else if (cleanFirst) {
    return `${cleanFirst.substring(0, 6)}${random}`;
  }
  return `USER${random}`;
}

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

    // Obtener todos los usuarios que son o pueden ser afiliados CON su perfil
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
        phone: true,
        role: true,
        referral_code: true,
        referral_enabled: true,
        affiliateProfile: {
          select: {
            id: true,
            business_name: true,
            contact_person_primary: true,
            contact_person_secondary: true,
            email_primary: true,
            email_secondary: true,
            phone_primary: true,
            phone_secondary: true,
            address_street: true,
            address_city: true,
            address_state: true,
            address_postal_code: true,
            address_country: true,
            tax_id: true,
            legal_name: true,
            affiliate_type: true,
            affiliate_category: true,
            commission_percentage: true,
            payment_method: true,
            bank_account: true,
            paypal_email: true,
            status: true,
            notes: true,
            created_at: true,
            updated_at: true,
          },
        },
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

      // Usar comisión del perfil o valor por defecto
      const commissionPercentage = user.affiliateProfile
        ? Number(user.affiliateProfile.commission_percentage)
        : 10;

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email,
        role: user.role,
        referralCode: user.referral_code,
        referralEnabled: user.referral_enabled,
        commissionPercentage,
        totalBookings,
        completedBookings,
        totalRevenue,
        conversionRate:
          totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        // Agregar datos del perfil si existen
        profile: user.affiliateProfile
          ? {
              businessName: user.affiliateProfile.business_name,
              contactPrimary: user.affiliateProfile.contact_person_primary,
              contactSecondary: user.affiliateProfile.contact_person_secondary,
              phonePrimary: user.affiliateProfile.phone_primary,
              phoneSecondary: user.affiliateProfile.phone_secondary,
              emailSecondary: user.affiliateProfile.email_secondary,
              address: {
                street: user.affiliateProfile.address_street,
                city: user.affiliateProfile.address_city,
                state: user.affiliateProfile.address_state,
                postalCode: user.affiliateProfile.address_postal_code,
                country: user.affiliateProfile.address_country,
              },
              fiscal: {
                taxId: user.affiliateProfile.tax_id,
                legalName: user.affiliateProfile.legal_name,
              },
              type: user.affiliateProfile.affiliate_type,
              category: user.affiliateProfile.affiliate_category,
              status: user.affiliateProfile.status,
              paymentMethod: user.affiliateProfile.payment_method,
              bankAccount: user.affiliateProfile.bank_account,
              paypalEmail: user.affiliateProfile.paypal_email,
              notes: user.affiliateProfile.notes,
            }
          : null,
      };
    });

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching affiliate users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios afiliados" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Datos básicos de usuario
      email,
      firstName,
      lastName,
      phone,
      role,
      
      // Datos del perfil de afiliado
      businessName,
      affiliateType,
      commissionPercentage,
      
      // Dirección
      addressStreet,
      addressCity,
      addressPostalCode,
      addressCountry,
      
      // Datos fiscales
      taxId,
      legalName,
      fiscalAddressStreet,
    } = body;

    // Validar campos obligatorios
    if (!email || !firstName || !phone) {
      return NextResponse.json(
        { error: "Email, nombre y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.carRentalUsers.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 400 }
      );
    }

    // Generar código de afiliado único
    let referralCode = generateReferralCode(
      firstName,
      lastName || ""
    );
    
    // Asegurar que el código es único
    let codeExists = await prisma.carRentalUsers.findUnique({
      where: { referral_code: referralCode },
    });
    
    while (codeExists) {
      referralCode = generateReferralCode(
        firstName,
        lastName || ""
      ) + Math.floor(Math.random() * 99);
      codeExists = await prisma.carRentalUsers.findUnique({
        where: { referral_code: referralCode },
      });
    }

    // Generar contraseña temporal
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Determinar el tipo de afiliado
    const affiliateTypeValue = affiliateType ? affiliateType.toUpperCase() : "INDIVIDUAL";

    // Crear usuario con perfil de afiliado en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const newUser = await tx.carRentalUsers.create({
        data: {
          email,
          password: hashedPassword,
          firstname: firstName,
          lastname: lastName || null,
          phone: phone,
          role: role || "colaborador",
          referral_code: referralCode,
          referral_enabled: true,
          status: "T",
        },
      });

      // Crear perfil de afiliado
      const affiliateProfile = await tx.affiliateProfile.create({
        data: {
          user_id: newUser.id,
          business_name: businessName || `${firstName} ${lastName || ""}`.trim(),
          contact_person_primary: firstName + (lastName ? ` ${lastName}` : ""),
          contact_person_secondary: null,
          email_primary: email,
          email_secondary: null,
          phone_primary: phone,
          phone_secondary: null,
          address_street: addressStreet || null,
          address_city: addressCity || null,
          address_state: null,
          address_postal_code: addressPostalCode || null,
          address_country: addressCountry || "España",
          tax_id: taxId || null,
          legal_name: legalName || null,
          fiscal_address_street: fiscalAddressStreet || null,
          fiscal_address_city: null,
          fiscal_address_state: null,
          fiscal_address_postal_code: null,
          fiscal_address_country: null,
          affiliate_type: affiliateTypeValue,
          affiliate_category: "STANDARD",
          commission_percentage: commissionPercentage || 10.0,
          payment_method: null,
          bank_account: null,
          paypal_email: null,
          status: "ACTIVE",
          notes: null,
          created_by: session.user.id ? parseInt(session.user.id) : null,
        },
      });

      return { newUser, affiliateProfile };
    });

    console.log(`
    ✅ Nuevo afiliado creado:
    🏢 Negocio: ${businessName || `${firstName} ${lastName || ""}`}
    📧 Email: ${email}
    📞 Teléfono: ${phone}
    🔑 Contraseña temporal: ${tempPassword}
    👤 Código de afiliado: ${referralCode}
    💰 Comisión: ${commissionPercentage || 10}%
    `);

    return NextResponse.json({
      success: true,
      user: {
        id: result.newUser.id,
        email: result.newUser.email,
        name: `${result.newUser.firstname} ${result.newUser.lastname || ""}`.trim(),
        businessName: businessName,
        referralCode: result.newUser.referral_code,
        tempPassword, // En producción, esto se enviaría por email
      },
    });
  } catch (error: any) {
    console.error("Error creating affiliate:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear afiliado" },
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
    const { userId, role, referralEnabled, commissionPercentage } = body;

    const updateData: any = {};
    
    if (role !== undefined) updateData.role = role;
    if (referralEnabled !== undefined) updateData.referral_enabled = referralEnabled;
    // Nota: commissionPercentage se guarda en otra tabla si es necesario

    await prisma.carRentalUsers.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating affiliate:", error);
    return NextResponse.json(
      { error: "Error al actualizar afiliado" },
      { status: 500 }
    );
  }
}
