
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/contracts/[id]/remote-signature
 * Genera el enlace de firma remota y opcionalmente lo envía
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

    const body = await req.json();
    const { method, sendTo } = body; // method: 'whatsapp' | 'email', sendTo: destinatario

    // Verificar que el contrato existe y no está firmado
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId },
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
        remote_signature_sent_to: sendTo || null
      }
    });

    // Generar enlace de firma
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const signatureUrl = `${baseUrl}/sign/${token}`;

    const customerName = contract.booking?.customer?.first_name || 'Cliente';
    const message = `Hola ${customerName}, por favor firma tu contrato de alquiler aquí: ${signatureUrl}`;

    console.log('🔗 Enlace de firma generado:', signatureUrl);
    console.log('📧 Método de envío:', method);
    console.log('📧 Destinatario:', sendTo);

    // TODO: Aquí se podría integrar con servicio de email/SMS
    // Por ahora devolvemos el enlace para que se envíe manualmente

    return NextResponse.json({
      success: true,
      signatureUrl,
      expiresAt,
      message,
      token
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
