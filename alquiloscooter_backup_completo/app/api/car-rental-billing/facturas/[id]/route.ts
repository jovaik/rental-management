
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

    const factura = await prisma.carRentalFacturas.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        items: true,
        booking: true
      }
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error fetching factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { estado, metodoPago, items } = body

    console.log('=== ACTUALIZANDO FACTURA ===')
    console.log('Factura ID:', params.id)
    console.log('Body completo:', JSON.stringify(body, null, 2))

    // Preparar datos de actualización
    const updateData: any = {}
    
    if (estado !== undefined) updateData.estado = estado
    if (metodoPago !== undefined) updateData.metodo_pago = metodoPago

    // Si hay items, actualizar los items de la factura
    if (items && Array.isArray(items) && items.length > 0) {
      console.log('=== ACTUALIZANDO ITEMS ===')
      console.log('Cantidad de items:', items.length)

      // Primero eliminar todos los items existentes
      await prisma.carRentalFacturaItems.deleteMany({
        where: { factura_id: parseInt(params.id) }
      })

      // Crear los nuevos items
      const itemsData = items.map((item: any) => ({
        factura_id: parseInt(params.id),
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        total: item.cantidad * item.precio,
      }))

      await prisma.carRentalFacturaItems.createMany({
        data: itemsData
      })

      // Recalcular totales basándose en los items
      // Los precios ya incluyen IVA, hay que desglosarlo
      const nuevoTotal = itemsData.reduce((sum: number, item: any) => sum + parseFloat(item.total.toString()), 0)
      const nuevoSubtotal = nuevoTotal / 1.21  // Base imponible (desglosando IVA 21%)
      const nuevoIva = nuevoTotal - nuevoSubtotal  // IVA desglosado

      updateData.subtotal = Math.round(nuevoSubtotal * 100) / 100
      updateData.iva = Math.round(nuevoIva * 100) / 100
      updateData.total = Math.round(nuevoTotal * 100) / 100

      console.log('Nuevos totales calculados:', {
        subtotal: updateData.subtotal,
        iva: updateData.iva,
        total: updateData.total
      })
    }

    // Actualizar factura
    const factura = await prisma.carRentalFacturas.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        customer: true,
        items: true,
      }
    })

    console.log('=== FACTURA ACTUALIZADA ===')

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error updating factura:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la factura' },
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

    // Verificar que la factura existe
    const factura = await prisma.carRentalFacturas.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar factura (los items se eliminan automáticamente por CASCADE)
    await prisma.carRentalFacturas.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ message: 'Factura eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting factura:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la factura' },
      { status: 500 }
    )
  }
}
