
/**
 * API para convertir un TICKET a FACTURA
 * 
 * Usado cuando el cliente solicita factura después de haber recibido ticket
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { facturaId } = await request.json()

    if (!facturaId) {
      return NextResponse.json(
        { error: 'facturaId es requerido' },
        { status: 400 }
      )
    }

    // Obtener el ticket
    const ticket = await prisma.carRentalFacturas.findUnique({
      where: { id: parseInt(facturaId) },
      include: {
        customer: true,
        items: true
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    if (ticket.tipo !== 'TICKET') {
      return NextResponse.json(
        { error: 'El documento ya es una factura' },
        { status: 400 }
      )
    }

    // Generar nuevo número de factura
    const año = new Date().getFullYear()
    const prefijo = 'FACT'
    
    const ultimaFactura = await prisma.carRentalFacturas.findFirst({
      where: {
        numero: {
          startsWith: `${prefijo}-${año}-`
        },
        tipo: 'FACTURA'
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    let siguienteNumero = 1
    if (ultimaFactura) {
      const partes = ultimaFactura.numero.split('-')
      if (partes.length === 3 && partes[0] === prefijo) {
        siguienteNumero = parseInt(partes[2]) + 1
      }
    }

    const nuevoNumero = `${prefijo}-${año}-${siguienteNumero.toString().padStart(4, '0')}`

    // Convertir a factura
    const factura = await prisma.carRentalFacturas.update({
      where: { id: ticket.id },
      data: {
        tipo: 'FACTURA',
        numero: nuevoNumero,
        updated_at: new Date()
      },
      include: {
        customer: true,
        items: true,
        booking: true
      }
    })

    return NextResponse.json({
      success: true,
      factura,
      message: `Ticket convertido a factura: ${nuevoNumero}`,
      numeroAnterior: ticket.numero
    })

  } catch (error) {
    console.error('Error al convertir ticket a factura:', error)
    return NextResponse.json(
      { error: 'Error al convertir ticket a factura' },
      { status: 500 }
    )
  }
}
