
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const updatedUser = await prisma.carRentalUsers.update({
      where: { email: session.user.email },
      data: { 
        firstname: name.trim().split(' ')[0] || name.trim(),
        lastname: name.trim().split(' ').slice(1).join(' ') || null
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        name: `${updatedUser.firstname || ''} ${updatedUser.lastname || ''}`.trim(),
        email: updatedUser.email,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
