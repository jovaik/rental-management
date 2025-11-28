
import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      affiliateType,
      businessName,
      firstName,
      lastName,
      email,
      phone,
      addressStreet,
      addressCity,
      addressPostalCode,
      addressCountry,
      taxId,
      legalName,
      fiscalAddressStreet,
      notes,
    } = body;

    // Validar campos obligatorios
    if (!email || !firstName || !phone) {
      return NextResponse.json(
        { error: "Email, nombre y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    if (affiliateType === "business" && !businessName) {
      return NextResponse.json(
        { error: "El nombre de la empresa es obligatorio para establecimientos" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.carRentalUsers.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email. Si ya eres afiliado, contacta con soporte." },
        { status: 400 }
      );
    }

    // Generar código de afiliado único
    let referralCode = generateReferralCode(firstName, lastName || "");
    
    // Asegurar que el código es único
    let codeExists = await prisma.carRentalUsers.findUnique({
      where: { referral_code: referralCode },
    });
    
    while (codeExists) {
      referralCode = generateReferralCode(firstName, lastName || "") + Math.floor(Math.random() * 99);
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
      // Crear usuario con status pendiente
      const newUser = await tx.carRentalUsers.create({
        data: {
          email,
          password: hashedPassword,
          firstname: firstName,
          lastname: lastName || null,
          phone: phone,
          role: "colaborador", // Por defecto colaborador
          referral_code: referralCode,
          referral_enabled: false, // Deshabilitado hasta que el admin lo active
          status: "T", // Activo pero sin permisos de referral hasta aprobación
        },
      });

      // Crear perfil de afiliado con status PENDING
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
          commission_percentage: 10.0, // Comisión por defecto, el admin puede cambiarla
          payment_method: null,
          bank_account: null,
          paypal_email: null,
          status: "PENDING", // Estado pendiente de aprobación
          notes: notes || null,
          created_by: null, // Auto-registro
        },
      });

      return { user: newUser, profile: affiliateProfile };
    });

    // TODO: Enviar email de confirmación al afiliado y notificación al admin

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada correctamente. Te contactaremos pronto.",
      referralCode: result.user.referral_code,
    });

  } catch (error: any) {
    console.error("Error en registro de afiliado:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
