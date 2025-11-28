
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de fecha de la query string
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Configurar filtros de fecha
    let fechaDesdeDate: Date | undefined
    let fechaHastaDate: Date | undefined

    if (fechaDesde) {
      fechaDesdeDate = new Date(fechaDesde)
      fechaDesdeDate.setHours(0, 0, 0, 0)
    }

    if (fechaHasta) {
      fechaHastaDate = new Date(fechaHasta)
      fechaHastaDate.setHours(23, 59, 59, 999)
    }

    // Construir el filtro de fecha para las consultas
    const buildDateFilter = () => {
      if (fechaDesdeDate && fechaHastaDate) {
        return {
          fecha: {
            gte: fechaDesdeDate,
            lte: fechaHastaDate
          }
        }
      } else if (fechaDesdeDate) {
        return {
          fecha: {
            gte: fechaDesdeDate
          }
        }
      } else if (fechaHastaDate) {
        return {
          fecha: {
            lte: fechaHastaDate
          }
        }
      }
      return {}
    }

    const dateFilter = buildDateFilter()

    // Obtener todas las facturas (incluyendo tickets) con filtro de fecha
    const todasFacturas = await prisma.carRentalFacturas.findMany({
      where: dateFilter,
      select: {
        tipo: true,
        total: true,
        estado: true,
        fecha: true,
        metodo_pago: true
      }
    })

    // Calcular estadísticas de facturas
    const totalFacturas = todasFacturas.filter((f: any) => f.tipo === 'FACTURA').length
    const totalTickets = todasFacturas.filter((f: any) => f.tipo === 'TICKET').length
    
    // Ingresos (facturas pagadas)
    const ingresosMes = todasFacturas
      .filter((f: any) => f.estado === 'PAGADA')
      .reduce((sum: number, f: any) => sum + parseFloat(f.total.toString()), 0)

    // Pendientes de cobro
    const pendientesCobro = todasFacturas
      .filter((f: any) => f.estado === 'PENDIENTE' || f.estado === 'VENCIDA')
      .reduce((sum: number, f: any) => sum + parseFloat(f.total.toString()), 0)

    // ====== DESGLOSE POR MÉTODO DE PAGO ======
    const facturasPagadas = todasFacturas.filter((f: any) => f.estado === 'PAGADA')
    
    const ventasEfectivo = facturasPagadas
      .filter((f: any) => f.metodo_pago === 'EFECTIVO')
      .reduce((sum: number, f: any) => sum + parseFloat(f.total.toString()), 0)
    
    const ventasTPVSumup = facturasPagadas
      .filter((f: any) => f.metodo_pago === 'TPV_SUMUP')
      .reduce((sum: number, f: any) => sum + parseFloat(f.total.toString()), 0)
    
    const ventasTPVUnicaja = facturasPagadas
      .filter((f: any) => f.metodo_pago === 'TPV_UNICAJA')
      .reduce((sum: number, f: any) => sum + parseFloat(f.total.toString()), 0)

    const totalVentas = ventasEfectivo + ventasTPVSumup + ventasTPVUnicaja

    // ====== OBTENER GASTOS PARA RESTAR DEL EFECTIVO ======
    const todosGastos = await prisma.carRentalGastos.findMany({
      where: dateFilter,
      select: {
        total: true,
        metodo_pago: true
      }
    })

    // Gastos pagados en efectivo
    const gastosEfectivo = todosGastos
      .filter((g: any) => g.metodo_pago === 'EFECTIVO')
      .reduce((sum: number, g: any) => sum + parseFloat(g.importe.toString()), 0)

    // Efectivo real en caja = Ventas en efectivo - Gastos en efectivo
    const efectivoEnCaja = ventasEfectivo - gastosEfectivo

    const stats = {
      totalFacturas,
      totalTickets,
      ingresosMes,
      pendientesCobro,
      // Desglose por método de pago
      totalVentas,
      ventasEfectivo,
      ventasTPVSumup,
      ventasTPVUnicaja,
      // Gastos
      gastosEfectivo,
      efectivoEnCaja, // Efectivo real que debe haber en caja
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
