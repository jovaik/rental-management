
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// PATCH update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!role) {
      return NextResponse.json(
        { error: "El rol es obligatorio" },
        { status: 400 }
      );
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: "El nombre y email son obligatorios" },
        { status: 400 }
      );
    }

    const userId = parseInt((await params).id);

    // Log para debugging
    console.log('🔍 Actualizando usuario:', {
      userId,
      emailNuevo: email,
      nombre: name,
      rol: role
    });

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.carRentalUsers.findFirst({
        where: {
          email,
          NOT: { id: userId }
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true
        }
      });

      if (existingUser) {
        const errorMsg = `El email "${email}" ya está en uso por ${existingUser.firstname} ${existingUser.lastname} (ID: ${existingUser.id})`;
        console.error('❌', errorMsg);
        return NextResponse.json(
          { error: errorMsg },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      role,
    };

    // Update name - split into firstname and lastname
    if (name) {
      const nameParts = name.trim().split(' ');
      updateData.firstname = nameParts[0] || '';
      updateData.lastname = nameParts.slice(1).join(' ') || '';
    }

    // Update email
    if (email) {
      updateData.email = email;
    }

    // Update password only if provided
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await prisma.carRentalUsers.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: `${updatedUser.firstname || ''} ${updatedUser.lastname || ''}`.trim() || updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.created,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const userId = parseInt((await params).id);

    // Prevent deleting yourself
    if (session.user.id === userId.toString()) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.carRentalUsers.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
