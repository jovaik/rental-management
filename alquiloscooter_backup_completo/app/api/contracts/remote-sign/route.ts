
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/contracts/remote-sign?token=xxx - Obtener contrato por token (público)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado', errorCode: 'INVALID_TOKEN' },
        { status: 400 }
      );
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
        { error: 'Token inválido o no encontrado', errorCode: 'INVALID_TOKEN' },
        { status: 404 }
      );
    }

    // Verificar si el token ha expirado
    if (contract.remote_signature_token_expires && 
        new Date(contract.remote_signature_token_expires) < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de firma ha expirado', errorCode: 'TOKEN_EXPIRED' },
        { status: 410 }
      );
    }

    // Verificar si ya está firmado
    if (contract.signed_at) {
      return NextResponse.json(
        { error: 'Este contrato ya ha sido firmado', errorCode: 'ALREADY_SIGNED' },
        { status: 400 }
      );
    }

    // Obtener el HTML del contrato
    let contractText = contract.contract_text || '';

    // Si no hay HTML guardado, generar uno básico
    if (!contractText) {
      const customer = contract.booking.customer;
      const vehicles = contract.booking.vehicles.map((v: any) => 
        `${v.car.make} ${v.car.model} (${v.car.registration_number})`
      ).join(', ');

      contractText = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">
            CONTRATO DE ALQUILER DE VEHÍCULO
          </h1>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #666; font-size: 18px;">Información del Contrato</h2>
            <p><strong>Número de Contrato:</strong> ${contract.contract_number}</p>
            <p><strong>Fecha:</strong> ${contract.created_at ? new Date(contract.created_at).toLocaleDateString('es-ES') : 'N/A'}</p>
          </div>

          <div style="margin: 30px 0;">
            <h2 style="color: #666; font-size: 18px;">Datos del Cliente</h2>
            <p><strong>Nombre:</strong> ${customer?.first_name || ''} ${customer?.last_name || ''}</p>
            <p><strong>Email:</strong> ${customer?.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${customer?.phone || 'N/A'}</p>
          </div>

          <div style="margin: 30px 0;">
            <h2 style="color: #666; font-size: 18px;">Vehículo(s) Alquilado(s)</h2>
            <p>${vehicles}</p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #FF6B35;">
            <h2 style="color: #666; font-size: 18px; margin-top: 0;">Términos y Condiciones</h2>
            <p>El arrendatario declara haber recibido el vehículo en perfectas condiciones de funcionamiento y se compromete a:</p>
            <ul>
              <li>Devolver el vehículo en las mismas condiciones en que lo recibió</li>
              <li>No ceder el vehículo a terceros sin autorización expresa</li>
              <li>Utilizar el vehículo de acuerdo con las normas de tráfico vigentes</li>
              <li>Asumir la responsabilidad por daños, multas o sanciones durante el período de alquiler</li>
            </ul>
          </div>
        </div>
      `;
    }

    // Devolver datos del contrato
    return NextResponse.json({
      contractNumber: contract.contract_number,
      contractText: contractText,
      customer: {
        firstName: contract.booking.customer?.first_name || '',
        lastName: contract.booking.customer?.last_name || ''
      }
    });

  } catch (error) {
    console.error('❌ Error al cargar contrato para firma remota:', error);
    return NextResponse.json(
      { error: 'Error al cargar el contrato' },
      { status: 500 }
    );
  }
}

// POST /api/contracts/remote-sign - Firmar contrato remotamente (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signatureData } = body;

    if (!token || !signatureData) {
      return NextResponse.json(
        { error: 'Token o firma no proporcionados' },
        { status: 400 }
      );
    }

    // Buscar contrato por token
    const contract = await prisma.carRentalContracts.findFirst({
      where: {
        remote_signature_token: token
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 404 }
      );
    }

    // Verificar si el token ha expirado
    if (contract.remote_signature_token_expires && 
        new Date(contract.remote_signature_token_expires) < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de firma ha expirado' },
        { status: 410 }
      );
    }

    // Verificar si ya está firmado
    if (contract.signed_at) {
      return NextResponse.json(
        { error: 'Este contrato ya ha sido firmado' },
        { status: 400 }
      );
    }

    // Obtener IP del cliente (para registro de auditoría)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 
               request.headers.get('x-real-ip') || 'unknown';

    // Actualizar contrato con la firma
    await prisma.carRentalContracts.update({
      where: { id: contract.id },
      data: {
        signature_data: signatureData,
        signed_at: new Date(),
        ip_address: ip,
        // Invalidar el token después de usarlo
        remote_signature_token: null,
        remote_signature_token_expires: null
      }
    });

    console.log('✅ Contrato firmado remotamente:', {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      ip
    });

    return NextResponse.json({
      success: true,
      message: 'Contrato firmado correctamente'
    });

  } catch (error) {
    console.error('❌ Error al firmar contrato remotamente:', error);
    return NextResponse.json(
      { error: 'Error al firmar el contrato' },
      { status: 500 }
    );
  }
}
