
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { getFileAsBase64 } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const factura = await prisma.carRentalFacturas.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        items: true,
        booking: {
          include: {
            vehicles: {
              include: {
                car: true
              }
            }
          }
        }
      }
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Obtener configuración de la empresa
    const companyConfig = await prisma.companyConfig.findFirst({
      where: { active: true }
    })

    if (!companyConfig) {
      return NextResponse.json(
        { error: 'Configuración de empresa no encontrada' },
        { status: 500 }
      )
    }

    // Preparar datos para el generador de PDF
    const invoiceData = {
      numero: factura.numero,
      tipo: factura.tipo,
      fecha: factura.fecha,
      customer: {
        name: factura.customer.first_name || '',
        surname: factura.customer.last_name || null,
        dni: factura.customer.dni_nie,
        email: factura.customer.email,
        phone: factura.customer.phone,
        address: factura.customer.address,
      },
      items: factura.items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        total: Number(item.total),
      })),
      subtotal: Number(factura.subtotal),
      iva: Number(factura.iva),
      total: Number(factura.total),
      metodo_pago: factura.metodo_pago,
      estado: factura.estado,
    }

    // Obtener el logo en base64 si existe
    let logoBase64: string | null = null
    if (companyConfig.logo_url) {
      try {
        logoBase64 = await getFileAsBase64(companyConfig.logo_url)
      } catch (error) {
        console.error('Error loading logo for PDF:', error)
        // Continuar sin logo si hay error
      }
    }

    // Generar PDF con Puppeteer
    const pdfBuffer = await generateInvoicePDF(invoiceData, companyConfig, logoBase64)

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${factura.tipo}-${factura.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar el documento' },
      { status: 500 }
    )
  }
}
