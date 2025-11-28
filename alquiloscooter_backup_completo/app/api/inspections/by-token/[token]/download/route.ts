
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getFileUrl } from '@/lib/s3';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando contrato con token de inspección:', token);

    // Buscar contrato por el signed_contract_token (que es el token que estamos usando)
    const contract = await prisma.carRentalContracts.findFirst({
      where: {
        remote_signature_token: token,
      },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o token inválido' },
        { status: 404 }
      );
    }

    console.log('✅ Contrato encontrado:', contract.contract_number);

    // Si el contrato tiene un PDF en S3, devolverlo
    if (contract.pdf_cloud_storage_path) {
      console.log('📄 Contrato tiene PDF en S3:', contract.pdf_cloud_storage_path);
      
      // Obtener URL firmada del PDF en S3
      const pdfUrl = await getFileUrl(contract.pdf_cloud_storage_path);
      
      // Descargar el PDF desde S3
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error('No se pudo descargar el PDF desde S3');
      }

      const pdfBuffer = await response.arrayBuffer();
      
      console.log('✅ PDF descargado desde S3, tamaño:', pdfBuffer.byteLength, 'bytes');

      // Retornar el PDF
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Contrato_${contract.contract_number}_${new Date().toISOString().split('T')[0]}.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Si no hay PDF en S3, redirigir al endpoint HTML
    console.log('📄 PDF no encontrado en S3, redirigiendo a HTML...');
    return NextResponse.redirect(
      new URL(`/api/contracts/${contract.id}/html`, request.url)
    );

  } catch (error: any) {
    console.error('❌ Error descargando PDF del contrato:', error);
    return NextResponse.json(
      {
        error: 'Error al descargar el PDF del contrato',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
