
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 [API] Cargando facturas...')
    const facturas = await prisma.carRentalFacturas.findMany({
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            dni_nie: true
          }
        },
        items: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    console.log(`✅ [API] ${facturas.length} facturas encontradas`)
    
    // Transformar datos para asegurar que todos los campos necesarios estén presentes
    const facturasFormateadas = facturas.map(factura => ({
      id: factura.id.toString(),
      numero: factura.numero || 'SIN-NUMERO',
      tipo: factura.tipo || 'TICKET',
      fecha: factura.created_at.toISOString(),
      cliente: {
        nombre: factura.customer?.first_name || 'Cliente',
        apellido: factura.customer?.last_name || '',
        email: factura.customer?.email || undefined,
        telefono: factura.customer?.phone || 'N/A'
      },
      total: parseFloat(factura.total?.toString() || '0'),
      estado: factura.estado || 'PENDIENTE',
      metodoPago: factura.metodo_pago || undefined,
      pdfPath: factura.pdf_path || undefined
    }))

    console.log('📊 [API] Ejemplo de factura formateada:', facturasFormateadas[0])
    return NextResponse.json(facturasFormateadas)
  } catch (error) {
    console.error('❌ [API] Error fetching facturas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Datos recibidos para crear factura:', body)

    const {
      customerId,
      bookingId,
      items,
      metodoPago,
      solicitaFactura,
      datosFacturacion
    } = body

    // Validar campos requeridos
    if (!customerId) {
      return NextResponse.json(
        { error: 'Falta el campo requerido: customerId' },
        { status: 400 }
      )
    }

    if (!metodoPago || metodoPago === '' || metodoPago === 'undefined') {
      return NextResponse.json(
        { error: 'Falta el campo requerido: metodoPago. Debe seleccionar un método de pago' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un item en la factura' },
        { status: 400 }
      )
    }

    // Validar que los items tengan descripción y precio
    const itemsInvalidos = items.filter((item: any) => !item.descripcion || item.precio <= 0)
    if (itemsInvalidos.length > 0) {
      return NextResponse.json(
        { error: 'Todos los items deben tener descripción y precio mayor a 0' },
        { status: 400 }
      )
    }

    // Calcular totales
    // Los precios ya incluyen IVA, hay que desglosarlo
    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.cantidad * item.precio)
    }, 0)
    const subtotal = total / 1.21  // Base imponible (desglosando IVA 21%)
    const iva = total - subtotal    // IVA desglosado

    // Determinar tipo de documento
    let tipo: 'TICKET' | 'FACTURA' = 'TICKET'
    if (solicitaFactura || metodoPago === 'TPV_UNICAJA') {
      tipo = 'FACTURA'
    }

    // Generar número de documento
    const año = new Date().getFullYear()
    const prefijo = tipo === 'FACTURA' ? 'FACT' : 'TICK'
    
    // Buscar el último documento del año con ese prefijo
    const ultimoDocumento = await prisma.carRentalFacturas.findFirst({
      where: { 
        numero: {
          startsWith: `${prefijo}-${año}-`
        }
      },
      orderBy: { created_at: 'desc' }
    })

    let numeroSecuencia = 1
    if (ultimoDocumento) {
      const partes = ultimoDocumento.numero.split('-')
      if (partes.length === 3 && partes[0] === prefijo) {
        const ultimoNumero = parseInt(partes[2]) || 0
        numeroSecuencia = ultimoNumero + 1
      }
    }

    const numero = `${prefijo}-${año}-${numeroSecuencia.toString().padStart(4, '0')}`

    // Preparar datos de facturación
    let datosFacturacionString = null
    if (tipo === 'FACTURA' && datosFacturacion) {
      datosFacturacionString = JSON.stringify(datosFacturacion)
    }

    // Crear factura con items
    const factura = await prisma.carRentalFacturas.create({
      data: {
        numero,
        tipo,
        subtotal,
        iva,
        total,
        metodo_pago: metodoPago as any,
        datos_facturacion: datosFacturacionString,
        customer_id: customerId,
        booking_id: bookingId || null,
        estado: 'PAGADA', // Al crear se marca como pagada
        items: {
          create: items.map((item: any) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            total: item.cantidad * item.precio
          }))
        }
      },
      include: {
        customer: true,
        items: true
      }
    })

    console.log('Factura creada exitosamente:', factura.numero)
    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    console.error('Error creating factura:', error)
    console.error('Error completo:', JSON.stringify(error, null, 2))
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear la factura'
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
      console.error('Stack trace:', error.stack)
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
