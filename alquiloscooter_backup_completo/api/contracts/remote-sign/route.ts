
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/contracts/remote-sign
 * Firma un contrato usando el token de firma remota
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, signatureData } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    if (!signatureData) {
      return NextResponse.json({ error: 'Firma requerida' }, { status: 400 });
    }

    // Buscar contrato por token
    const contract = await prisma.carRentalContracts.findFirst({
      where: {
        remote_signature_token: token
      },
      include: {
        booking: {
          include: {
            customer: true
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

    // Obtener IP y User Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Firmar el contrato y EXPIRAR el token inmediatamente
    await prisma.carRentalContracts.update({
      where: { id: contract.id },
      data: {
        signed_at: new Date(),
        signature_data: signatureData,
        ip_address: ip,
        user_agent: userAgent,
        // Expirar el token inmediatamente para que no se pueda volver a usar
        remote_signature_token: null,
        remote_signature_token_expires: null
      }
    });

    console.log('✅ Contrato firmado remotamente:', contract.id);
    console.log('🔒 Token expirado automáticamente');

    return NextResponse.json({
      success: true,
      message: 'Contrato firmado correctamente',
      contractId: contract.id
    });

  } catch (error: any) {
    console.error('❌ Error al firmar contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Error al firmar contrato' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
