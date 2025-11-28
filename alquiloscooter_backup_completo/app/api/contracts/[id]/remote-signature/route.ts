

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendRemoteSignatureEmail } from '@/lib/email';
import crypto from 'crypto';

// POST /api/contracts/[id]/remote-signature - Generar y enviar enlace de firma remota
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contractId = parseInt(params.id);
    const body = await request.json();
    const { sendTo, method } = body; // sendTo: email o teléfono, method: 'email' o 'whatsapp'

    console.log('📋 Generando enlace de firma remota:', { contractId, sendTo, method });

    // Buscar el contrato
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId },
      include: {
        booking: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar si ya está firmado
    if (contract.signed_at) {
      return NextResponse.json({ 
        error: 'El contrato ya está firmado' 
      }, { status: 400 });
    }

    // Generar token único y seguro (32 caracteres hexadecimal)
    const token = crypto.randomBytes(32).toString('hex');
    
    // El token expira en 30 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Actualizar contrato con el token
    await prisma.carRentalContracts.update({
      where: { id: contractId },
      data: {
        remote_signature_token: token,
        remote_signature_token_expires: expiresAt,
        remote_signature_sent_at: new Date(),
        remote_signature_sent_to: sendTo
      }
    });

    // Generar URL de firma remota
    let baseUrl = process.env.NEXTAUTH_URL || 'https://alqm.abacusai.app';
    // Eliminar trailing slash si existe
    baseUrl = baseUrl.replace(/\/$/, '');
    const signatureUrl = `${baseUrl}/sign/${token}`;

    // Obtener datos del cliente
    const customerName = `${contract.booking.customer?.first_name || ''} ${contract.booking.customer?.last_name || ''}`.trim() || 'Cliente';
    const companyConfig = await prisma.companyConfig.findFirst({
      where: { active: true }
    });
    const companyName = companyConfig?.company_name || 'Alquilo Scooter';

    // Preparar mensaje según el método
    let message = '';
    let emailSent = false;
    let whatsappUrl = '';

    if (method === 'email') {
      // ENVÍO AUTOMÁTICO DE EMAIL
      try {
        await sendRemoteSignatureEmail(
          sendTo,
          customerName,
          signatureUrl,
          contract.contract_number
        );
        emailSent = true;
        console.log('✅ Email enviado automáticamente a:', sendTo);
        
        // Preparar mensaje de confirmación para el usuario
        message = `Email enviado automáticamente a: ${sendTo}\n\n` +
                  `El cliente recibirá el enlace de firma en su bandeja de entrada.`;
      } catch (error: any) {
        console.error('❌ Error enviando email automático:', error);
        // Si falla el envío automático, devolver el mensaje para envío manual
        message = `⚠️ No se pudo enviar el email automáticamente: ${error.message}\n\n` +
                  `Por favor, envía este email manualmente:\n\n` +
                  `Para: ${sendTo}\n` +
                  `Asunto: Firma de Contrato - ${companyName}\n\n` +
                  `Estimado/a ${customerName},\n\n` +
                  `Su reserva ha sido confirmada. Para completar el proceso, por favor firme el contrato de alquiler accediendo al siguiente enlace:\n\n` +
                  `${signatureUrl}\n\n` +
                  `Este enlace expirará en 30 días o cuando el contrato sea firmado.\n\n` +
                  `Número de contrato: ${contract.contract_number}\n\n` +
                  `Si tiene alguna pregunta, no dude en contactarnos.\n\n` +
                  `Atentamente,\n${companyName}`;
      }
    } else if (method === 'whatsapp') {
      // WHATSAPP - Generar mensaje y URL
      message = `🔐 *FIRMA DE CONTRATO - ${companyName.toUpperCase()}*\n\n` +
        `Hola ${customerName},\n\n` +
        `Tu reserva está confirmada. Por favor firma el contrato de alquiler haciendo clic en este enlace:\n\n` +
        `${signatureUrl}\n\n` +
        `⏰ Este enlace expirará en 30 días.\n\n` +
        `*IMPORTANTE:* El contrato debe estar firmado antes de retirar el vehículo.\n\n` +
        `Gracias por confiar en nosotros.\n` +
        `${companyName}`;

      // Generar URL de WhatsApp Web
      const cleanPhone = sendTo.replace(/[^0-9+]/g, '');
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      console.log('📱 WhatsApp URL generada:', whatsappUrl);
    }

    return NextResponse.json({
      success: true,
      token,
      signatureUrl,
      expiresAt,
      method,
      message,
      emailSent,
      whatsappUrl: whatsappUrl || undefined
    });

  } catch (error) {
    console.error('❌ Error generando enlace de firma remota:', error);
    return NextResponse.json(
      { error: 'Error generando enlace de firma remota' },
      { status: 500 }
    );
  }
}

// GET /api/contracts/[id]/remote-signature - Verificar estado del enlace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contractId = parseInt(params.id);

    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: contractId },
      select: {
        remote_signature_token: true,
        remote_signature_token_expires: true,
        remote_signature_sent_at: true,
        remote_signature_sent_to: true,
        signed_at: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    const hasActiveToken = contract.remote_signature_token && 
                          contract.remote_signature_token_expires &&
                          new Date(contract.remote_signature_token_expires) > new Date();

    return NextResponse.json({
      hasActiveToken,
      tokenExpires: contract.remote_signature_token_expires,
      sentAt: contract.remote_signature_sent_at,
      sentTo: contract.remote_signature_sent_to,
      isSigned: !!contract.signed_at
    });

  } catch (error) {
    console.error('Error verificando enlace de firma remota:', error);
    return NextResponse.json(
      { error: 'Error verificando enlace' },
      { status: 500 }
    );
  }
}
