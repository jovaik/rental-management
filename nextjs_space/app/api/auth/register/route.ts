import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    // Get tenant from headers
    const tenant = await getTenantFromHeaders();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado en este tenant" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Check if this is the first user of the tenant (make them OWNER)
    const userCount = await prisma.user.count({
      where: { tenantId: tenant.id },
    });

    const role = userCount === 0 ? "OWNER" : "OPERATOR";

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId: tenant.id,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
