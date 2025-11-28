
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const trimestre = searchParams.get('trimestre') || 'Q1'
    const anio = parseInt(searchParams.get('anio') || new Date().getFullYear().toString())

    // Calcular fechas del trimestre
    let startMonth = 0
    let endMonth = 2

    switch (trimestre) {
      case 'Q1':
        startMonth = 0
        endMonth = 2
        break
      case 'Q2':
        startMonth = 3
        endMonth = 5
        break
      case 'Q3':
        startMonth = 6
        endMonth = 8
        break
      case 'Q4':
        startMonth = 9
        endMonth = 11
        break
    }

    const startDate = new Date(anio, startMonth, 1)
    const endDate = new Date(anio, endMonth + 1, 0, 23, 59, 59)

    console.log(`Exportando IVA para ${trimestre} ${anio}`)
    console.log(`Rango de fechas: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // Obtener SOLO FACTURAS de ventas (no tickets)
    const ventas = await prisma.carRentalFacturas.findMany({
      where: {
        tipo: 'FACTURA',
        fecha: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        fecha: 'asc'
      }
    })

    console.log(`Facturas encontradas: ${ventas.length}`)

    // Obtener SOLO FACTURAS de gastos (no tickets)
    const compras = await prisma.carRentalGastos.findMany({
      where: {
        tipo_documento: 'FACTURA',
        fecha: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    })

    console.log(`Gastos (facturas) encontrados: ${compras.length}`)

    // Preparar datos para Excel - VENTAS
    const ventasData = ventas.length > 0 ? ventas.map((v: any) => {
      const base = parseFloat(v.subtotal.toString()) || 0
      const ivaAmount = parseFloat(v.iva.toString()) || 0
      return {
        'Número': v.numero,
        'Fecha': new Date(v.fecha).toLocaleDateString('es-ES'),
        'Cliente': `${v.customer?.first_name || ''} ${v.customer?.last_name || ''}`.trim() || 'Sin cliente',
        'Base Imponible': base.toFixed(2),
        'IVA': ivaAmount.toFixed(2),
        'Total': (parseFloat(v.total.toString()) || 0).toFixed(2)
      }
    }) : [{
      'Número': '',
      'Fecha': '',
      'Cliente': 'No hay datos para el período seleccionado',
      'Base Imponible': '0.00',
      'IVA': '0.00',
      'Total': '0.00'
    }]

    // Preparar datos para Excel - COMPRAS
    const comprasData = compras.length > 0 ? compras.map((c: any) => {
      const ivaRate = (parseFloat(c.iva.toString()) || 0) / 100
      const importe = parseFloat(c.importe.toString()) || 0
      const base = importe / (1 + ivaRate)
      const ivaAmount = importe - base
      return {
        'Fecha': new Date(c.fecha).toLocaleDateString('es-ES'),
        'Proveedor': c.proveedor || 'Sin proveedor',
        'Concepto': c.concepto,
        'Base Imponible': base.toFixed(2),
        'IVA': ivaAmount.toFixed(2),
        'Total': importe.toFixed(2)
      }
    }) : [{
      'Fecha': '',
      'Proveedor': '',
      'Concepto': 'No hay datos para el período seleccionado',
      'Base Imponible': '0.00',
      'IVA': '0.00',
      'Total': '0.00'
    }]

    // Calcular totales
    const totalVentasBase = ventas.reduce((sum: number, v: any) => sum + (parseFloat(v.subtotal.toString()) || 0), 0)
    const totalVentasIVA = ventas.reduce((sum: number, v: any) => sum + (parseFloat(v.iva.toString()) || 0), 0)
    const totalVentasTotal = ventas.reduce((sum: number, v: any) => sum + (parseFloat(v.total.toString()) || 0), 0)

    const totalComprasBase = compras.reduce((sum: number, c: any) => {
      const ivaRate = (parseFloat(c.iva.toString()) || 0) / 100
      const importe = parseFloat(c.importe.toString()) || 0
      return sum + (importe / (1 + ivaRate))
    }, 0)
    const totalComprasIVA = compras.reduce((sum: number, c: any) => {
      const ivaRate = (parseFloat(c.iva.toString()) || 0) / 100
      const importe = parseFloat(c.importe.toString()) || 0
      const base = importe / (1 + ivaRate)
      return sum + (importe - base)
    }, 0)
    const totalComprasTotal = compras.reduce((sum: number, c: any) => sum + (parseFloat(c.importe.toString()) || 0), 0)

    // Agregar totales solo si hay datos reales
    if (ventas.length > 0) {
      ventasData.push({
        'Número': '',
        'Fecha': '',
        'Cliente': 'TOTAL',
        'Base Imponible': totalVentasBase.toFixed(2),
        'IVA': totalVentasIVA.toFixed(2),
        'Total': totalVentasTotal.toFixed(2)
      })
    }

    if (compras.length > 0) {
      comprasData.push({
        'Fecha': '',
        'Proveedor': '',
        'Concepto': 'TOTAL',
        'Base Imponible': totalComprasBase.toFixed(2),
        'IVA': totalComprasIVA.toFixed(2),
        'Total': totalComprasTotal.toFixed(2)
      })
    }

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new()

    // Hoja de Ventas
    const ventasSheet = XLSX.utils.json_to_sheet(ventasData)
    XLSX.utils.book_append_sheet(workbook, ventasSheet, 'Ventas (Facturas)')

    // Hoja de Compras
    const comprasSheet = XLSX.utils.json_to_sheet(comprasData)
    XLSX.utils.book_append_sheet(workbook, comprasSheet, 'Compras (Facturas)')

    // Hoja de Resumen
    const resumenData = [
      { 'Concepto': 'IVA REPERCUTIDO (Ventas)', 'Importe': totalVentasIVA.toFixed(2) },
      { 'Concepto': 'IVA SOPORTADO (Compras)', 'Importe': totalComprasIVA.toFixed(2) },
      { 'Concepto': '', 'Importe': '' },
      { 
        'Concepto': 'IVA A INGRESAR / DEVOLVER', 
        'Importe': (totalVentasIVA - totalComprasIVA).toFixed(2) 
      }
    ]
    const resumenSheet = XLSX.utils.json_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen IVA')

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Enviar respuesta
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=IVA_${trimestre}_${anio}_AlquiloScooter.xlsx`
      }
    })
  } catch (error) {
    console.error('Error exporting IVA:', error)
    return NextResponse.json({ error: 'Error al exportar IVA' }, { status: 500 })
  }
}
