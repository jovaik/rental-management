
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const users = await prisma.carRentalUsers.findMany({
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        created: true,
      },
      orderBy: {
        created: "desc",
      },
    });

    // Transform to expected format
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email,
      role: user.role || 'operator',
      createdAt: user.created || new Date(),
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.carRentalUsers.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split name into firstname and lastname
    const nameParts = name.split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    // Create user
    const newUser = await prisma.carRentalUsers.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: `${newUser.firstname || ''} ${newUser.lastname || ''}`.trim() || newUser.email,
      role: newUser.role,
      createdAt: newUser.created,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
