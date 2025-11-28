
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { regenerateSignedContract } from '@/lib/contract-regeneration';

/**
 * POST /api/contracts/:id/regenerate
 * Regenera un contrato INCLUSO si está firmado (para cambios operativos)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'ID de reserva inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { changeReason } = body;

    if (!changeReason) {
      return NextResponse.json(
        { error: 'Se requiere especificar el motivo del cambio' },
        { status: 400 }
      );
    }

    // Regenerar el contrato firmado
    const regenerated = await regenerateSignedContract(
      bookingId,
      changeReason,
      session.user.email || session.user.name || 'Usuario'
    );

    if (!regenerated) {
      return NextResponse.json(
        { error: 'No se pudo regenerar el contrato' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contrato regenerado exitosamente con el historial de cambios'
    });

  } catch (error) {
    console.error('Error regenerando contrato:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
