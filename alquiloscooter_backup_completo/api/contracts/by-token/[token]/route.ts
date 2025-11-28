
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/contracts/by-token/[token]
 * Obtiene un contrato por su token de firma remota
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Buscar contrato por token
    const contract = await prisma.carRentalContracts.findFirst({
      where: {
        remote_signature_token: token
      },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: {
              include: {
                car: true
              }
            }
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Enlace de firma inválido o expirado' },
        { status: 404 }
      );
    }

    // Verificar si ya está firmado
    if (contract.signed_at) {
      return NextResponse.json(
        { error: 'Este contrato ya ha sido firmado' },
        { status: 400 }
      );
    }

    // Verificar si el token ha expirado
    if (contract.remote_signature_token_expires && new Date() > contract.remote_signature_token_expires) {
      return NextResponse.json(
        { error: 'El enlace de firma ha expirado' },
        { status: 400 }
      );
    }

    // Devolver el contrato (sin datos sensibles)
    return NextResponse.json({
      id: contract.id,
      contract_number: contract.contract_number,
      contract_text: contract.contract_text,
      booking: {
        customer: {
          first_name: contract.booking?.customer?.first_name,
          last_name: contract.booking?.customer?.last_name
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error al cargar contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar contrato' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
