
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/company-config
 * Obtener configuración de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener la primera (y única) configuración
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    })

    if (!config) {
      // Si no existe, crear una por defecto
      const newConfig = await prisma.companyConfig.create({
        data: {
          company_name: 'Alquilo Scooter',
          company_nif: 'B12345678',
          company_address: 'Calle Ejemplo 123',
          company_city: 'Málaga, 29001',
          company_phone: '+34 600 000 000',
          company_email: 'info@alquiloscooter.com',
          primary_color: '#2563eb',
          secondary_color: '#1e40af',
          factura_prefix: 'FACT',
          ticket_prefix: 'TICK',
          factura_series: '2025',
          iva_rate: 0.21,
          active: true,
        }
      })
      return NextResponse.json(newConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching company config:', error)
    return NextResponse.json(
      { error: 'Error al obtener la configuración' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/company-config
 * Actualizar configuración de la empresa
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede actualizar
    if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const data = await request.json()

    // Obtener la configuración actual
    const existingConfig = await prisma.companyConfig.findFirst({
      where: { active: true }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la configuración
    const updatedConfig = await prisma.companyConfig.update({
      where: { id: existingConfig.id },
      data: {
        company_name: data.company_name,
        company_nif: data.company_nif,
        company_address: data.company_address,
        company_city: data.company_city,
        company_phone: data.company_phone,
        company_email: data.company_email,
        company_website: data.company_website,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        factura_prefix: data.factura_prefix,
        ticket_prefix: data.ticket_prefix,
        factura_series: data.factura_series,
        iva_rate: data.iva_rate,
        bank_name: data.bank_name,
        bank_iban: data.bank_iban,
        bank_swift: data.bank_swift,
        invoice_footer_text: data.invoice_footer_text,
        terms_and_conditions: data.terms_and_conditions,
        // Configuración SMTP
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port,
        smtp_secure: data.smtp_secure,
        smtp_user: data.smtp_user,
        smtp_password: data.smtp_password,
        smtp_from_name: data.smtp_from_name,
        smtp_from_email: data.smtp_from_email,
        // Configuración WhatsApp
        whatsapp_business_phone: data.whatsapp_business_phone,
        whatsapp_api_key: data.whatsapp_api_key,
        whatsapp_api_url: data.whatsapp_api_url,
        // Configuración de Google Reviews
        google_review_link: data.google_review_link,
      }
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Error updating company config:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la configuración' },
      { status: 500 }
    )
  }
}
