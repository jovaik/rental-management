
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * API endpoint para generar enlaces públicos de inspección
 * POST /api/inspections/generate-link
 * Body: { booking_id: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id requerido' }, { status: 400 });
    }

    // Verificar si ya existe un enlace para esta reserva
    let inspectionLink = await prisma.inspectionLink.findFirst({
      where: {
        booking_id: booking_id,
        expires_at: {
          gte: new Date() // Solo enlaces que no han expirado
        }
      }
    });

    // Si no existe o ha expirado, crear uno nuevo
    if (!inspectionLink) {
      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      
      // Crear enlace con expiración de 30 días
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      inspectionLink = await prisma.inspectionLink.create({
        data: {
          booking_id: booking_id,
          token: token,
          expires_at: expiresAt
        }
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
    const inspectionUrl = `${baseUrl}/inspeccion/${inspectionLink.token}`;

    return NextResponse.json({
      success: true,
      token: inspectionLink.token,
      url: inspectionUrl,
      expires_at: inspectionLink.expires_at
    });

  } catch (error) {
    console.error('Error generando enlace de inspección:', error);
    return NextResponse.json(
      { error: 'Error al generar enlace de inspección' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/inspections/generate-link?booking_id=xxx
 * Obtener enlace existente sin crear uno nuevo
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const booking_id = parseInt(searchParams.get('booking_id') || '0');

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id requerido' }, { status: 400 });
    }

    const inspectionLink = await prisma.inspectionLink.findFirst({
      where: {
        booking_id: booking_id,
        expires_at: {
          gte: new Date()
        }
      }
    });

    if (!inspectionLink) {
      return NextResponse.json({ error: 'No se encontró enlace válido' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.alquiloscooter.com';
    const inspectionUrl = `${baseUrl}/inspeccion/${inspectionLink.token}`;

    return NextResponse.json({
      success: true,
      token: inspectionLink.token,
      url: inspectionUrl,
      expires_at: inspectionLink.expires_at
    });

  } catch (error) {
    console.error('Error obteniendo enlace de inspección:', error);
    return NextResponse.json(
      { error: 'Error al obtener enlace de inspección' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
