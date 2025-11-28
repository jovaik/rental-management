
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/contracts/[id]/send-remote-signature
 * Envía o re-envía el enlace de firma remota al cliente
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID de contrato inválido' }, { status: 400 });
    }

    // Obtener datos del cuerpo
    const body = await req.json();
    const { customerEmail, customerPhone, customerName } = body;

    if (!customerEmail && !customerPhone) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un email o teléfono del cliente' },
        { status: 400 }
      );
    }

    // Verificar que el contrato existe y no está firmado
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId },
      include: {
        booking: true,
        customer: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.signed_at) {
      return NextResponse.json(
        { error: 'El contrato ya está firmado' },
        { status: 400 }
      );
    }

    // Generar token único para firma remota
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expira en 30 días

    // Actualizar contrato con token de firma remota
    await prisma.carRentalContracts.update({
      where: { id: contractId },
      data: {
        remote_signature_token: token,
        remote_signature_token_expires: expiresAt,
        remote_signature_sent_at: new Date(),
        remote_signature_sent_to: customerEmail || customerPhone
      }
    });

    // Generar enlace de firma
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const signatureLink = `${baseUrl}/sign/${token}`;

    console.log('🔗 Enlace de firma generado:', signatureLink);
    console.log('📧 Destinatario:', customerEmail || customerPhone);

    // TODO: Aquí se podría integrar con servicio de email/SMS para enviar el enlace
    // Por ahora, el enlace se genera y está disponible para compartir manualmente

    return NextResponse.json({
      success: true,
      message: 'Enlace de firma generado correctamente',
      signatureLink,
      token,
      expiresAt
    });

  } catch (error: any) {
    console.error('❌ Error al generar enlace de firma:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar enlace de firma' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
