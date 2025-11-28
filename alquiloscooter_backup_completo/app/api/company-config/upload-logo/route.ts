
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

/**
 * POST /api/company-config/upload-logo
 * Subir logo de la empresa
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede subir logo
    if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar que sea una imagen
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten imágenes.' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Obtener la configuración actual
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    // Si ya existe un logo, eliminarlo
    if (config.logo_url) {
      try {
        // Extraer la key del S3 URL
        const url = new URL(config.logo_url)
        const key = url.pathname.substring(1) // Remover el / inicial
        await deleteFile(key)
      } catch (error) {
        console.warn('No se pudo eliminar el logo anterior:', error)
      }
    }

    // Subir el nuevo logo a S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const { folderPrefix } = getBucketConfig()
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const key = `${folderPrefix}company/logo-${timestamp}.${extension}`

    const logoUrl = await uploadFile(buffer, key)

    // Actualizar la configuración con la nueva URL del logo
    const updatedConfig = await prisma.companyConfig.update({
      where: { id: config.id },
      data: { logo_url: logoUrl }
    })

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      config: updatedConfig
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Error al subir el logo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/company-config/upload-logo
 * Eliminar logo de la empresa
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede eliminar logo
    if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    // Obtener la configuración actual
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    })

    if (!config || !config.logo_url) {
      return NextResponse.json(
        { error: 'No hay logo para eliminar' },
        { status: 404 }
      )
    }

    // Eliminar el logo de S3
    try {
      const url = new URL(config.logo_url)
      const key = url.pathname.substring(1)
      await deleteFile(key)
    } catch (error) {
      console.warn('No se pudo eliminar el logo de S3:', error)
    }

    // Actualizar la configuración
    const updatedConfig = await prisma.companyConfig.update({
      where: { id: config.id },
      data: { logo_url: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Logo eliminado correctamente',
      config: updatedConfig
    })
  } catch (error) {
    console.error('Error deleting logo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el logo' },
      { status: 500 }
    )
  }
}
