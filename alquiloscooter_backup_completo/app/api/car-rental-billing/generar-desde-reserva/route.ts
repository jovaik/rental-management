
/**
 * API para generar factura/ticket automáticamente desde una reserva completada
 * 
 * Lógica de negocio (igual que ServyAuto):
 * - Si metodo_pago = EFECTIVO o TPV_SUMUP → genera TICKET
 * - Si metodo_pago = TPV_UNICAJA → genera FACTURA
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [API] Iniciando generación de factura desde reserva')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('❌ [API] No autorizado - sin sesión')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { bookingId, metodoPago } = await request.json()
    console.log('📥 [API] Datos recibidos:', { bookingId, metodoPago })

    if (!bookingId || !metodoPago) {
      console.error('❌ [API] Faltan parámetros requeridos')
      return NextResponse.json(
        { error: 'bookingId y metodoPago son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la reserva existe y está completada
    console.log('🔍 [API] Buscando reserva:', bookingId)
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        }
      }
    })

    if (!booking) {
      console.error('❌ [API] Reserva no encontrada:', bookingId)
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ [API] Reserva encontrada:', {
      id: booking.id,
      status: booking.status,
      customer_id: booking.customer_id,
      total_price: booking.total_price
    })

    if (booking.status !== 'completed') {
      console.error('❌ [API] Reserva no completada, estado actual:', booking.status)
      return NextResponse.json(
        { error: `La reserva debe estar completada para generar factura. Estado actual: ${booking.status}` },
        { status: 400 }
      )
    }

    // Verificar si ya tiene factura
    console.log('🔍 [API] Verificando factura existente para booking_id:', booking.id)
    const facturaExistente = await prisma.carRentalFacturas.findFirst({
      where: { booking_id: booking.id }
    })

    if (facturaExistente) {
      console.warn('⚠️ [API] Ya existe factura para esta reserva:', facturaExistente.numero)
      return NextResponse.json(
        { error: 'Esta reserva ya tiene una factura generada', factura: facturaExistente },
        { status: 400 }
      )
    }

    if (!booking.customer_id) {
      console.error('❌ [API] La reserva no tiene customer_id asociado')
      return NextResponse.json(
        { 
          error: 'Esta reserva no tiene un cliente asociado. Por favor, edita la reserva y selecciona un cliente antes de completarla.',
          help: 'En Planning → Clic en la reserva → Editar → Seleccionar Cliente → Guardar'
        },
        { status: 400 }
      )
    }

    // Determinar tipo de documento según método de pago
    const tipo = (metodoPago === 'TPV_UNICAJA') ? 'FACTURA' : 'TICKET'
    console.log('📋 [API] Tipo de documento a generar:', tipo)

    // Generar número único con prefijo
    const año = new Date().getFullYear()
    const prefijo = tipo === 'FACTURA' ? 'FACT' : 'TICK'
    console.log('🔢 [API] Generando número de factura para año:', año, 'con prefijo:', prefijo)
    
    const ultimaFactura = await prisma.carRentalFacturas.findFirst({
      where: {
        numero: {
          startsWith: `${prefijo}-${año}-`
        }
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
      console.log('📊 [API] Última factura encontrada:', ultimaFactura.numero, '→ siguiente:', siguienteNumero)
    } else {
      console.log('📊 [API] No hay facturas previas, iniciando en 1')
    }

    const numero = `${prefijo}-${año}-${siguienteNumero.toString().padStart(4, '0')}`
    console.log('✅ [API] Número de factura generado:', numero)

    // Preparar ítems de la factura
    const items = []
    
    // Agregar alquiler de vehículos
    if (booking.vehicles && booking.vehicles.length > 0) {
      console.log('🚗 [API] Agregando', booking.vehicles.length, 'vehículos a la factura')
      for (const vehicle of booking.vehicles) {
        const precioVehiculo = parseFloat(booking.total_price?.toString() || '0') / booking.vehicles.length
        items.push({
          descripcion: `Alquiler ${vehicle.car.make} ${vehicle.car.model} (${vehicle.car.registration_number})`,
          cantidad: 1,
          precio_unitario: precioVehiculo,
          total: precioVehiculo
        })
      }
    } else {
      // Fallback: usar concepto genérico
      console.log('🚗 [API] No hay vehículos específicos, usando concepto genérico')
      const precioTotal = parseFloat(booking.total_price?.toString() || '0')
      items.push({
        descripcion: 'Alquiler de vehículo',
        cantidad: 1,
        precio_unitario: precioTotal,
        total: precioTotal
      })
    }

    // Agregar cargos adicionales si existen
    if (booking.additional_charges && parseFloat(booking.additional_charges.toString()) > 0) {
      const cargosAdicionales = parseFloat(booking.additional_charges.toString())
      console.log('💰 [API] Agregando cargos adicionales:', cargosAdicionales)
      items.push({
        descripcion: booking.additional_charges_description || 'Cargos adicionales',
        cantidad: 1,
        precio_unitario: cargosAdicionales,
        total: cargosAdicionales
      })
    }

    // Calcular totales
    const subtotalCalculado = items.reduce((sum, item) => sum + item.total, 0)
    const subtotal = subtotalCalculado / 1.21 // Extraer IVA del total
    const iva = subtotalCalculado - subtotal
    const total = subtotalCalculado

    console.log('💵 [API] Totales calculados:', { subtotal, iva, total })
    console.log('📝 [API] Items a crear:', items.length)

    // Crear factura
    console.log('💾 [API] Creando factura en base de datos...')
    const factura = await prisma.carRentalFacturas.create({
      data: {
        numero,
        tipo,
        customer_id: booking.customer_id!,
        booking_id: booking.id,
        subtotal,
        iva,
        total,
        estado: 'PAGADA',
        metodo_pago: metodoPago,
        items: {
          create: items
        }
      },
      include: {
        customer: true,
        items: true,
        booking: true
      }
    })

    console.log('✅ [API] Factura creada exitosamente:', factura.id)

    // Actualizar método de pago en la reserva
    console.log('🔄 [API] Actualizando método de pago en reserva...')
    await prisma.carRentalBookings.update({
      where: { id: booking.id },
      data: { metodo_pago: metodoPago }
    })

    console.log('🎉 [API] Proceso completado exitosamente')

    return NextResponse.json({
      success: true,
      factura,
      message: `${tipo} generado automáticamente: ${numero}`
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ [API] Error al generar factura desde reserva:', error)
    console.error('❌ [API] Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error al generar factura', details: error.message },
      { status: 500 }
    )
  }
}
