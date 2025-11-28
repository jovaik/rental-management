
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cierre = await prisma.carRentalCierresCaja.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!cierre) {
      return NextResponse.json(
        { error: 'Cierre no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cierre)
  } catch (error) {
    console.error('Error fetching cierre:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.carRentalCierresCaja.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ message: 'Cierre eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting cierre:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el cierre' },
      { status: 500 }
    )
  }
}
