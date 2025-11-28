
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFileUrl } from '@/lib/s3'

/**
 * GET /api/company-config/logo
 * Obtener URL firmada del logo de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener la configuración actual
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    })

    if (!config || !config.logo_url) {
      return NextResponse.json({ logo_url: null })
    }

    // Generar URL firmada con validez de 7 días
    const signedUrl = await getFileUrl(config.logo_url, 604800)

    return NextResponse.json({ logo_url: signedUrl })
  } catch (error) {
    console.error('Error fetching logo URL:', error)
    return NextResponse.json(
      { error: 'Error al obtener la URL del logo' },
      { status: 500 }
    )
  }
}
