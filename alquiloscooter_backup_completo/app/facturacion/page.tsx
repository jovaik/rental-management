
'use client'

import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  FileText, 
  Euro, 
  TrendingUp, 
  Plus,
  Download,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NuevaFacturaDialog } from '@/components/modals/nueva-factura-dialog'
import { EditarFacturaDialog } from '@/components/modals/editar-factura-dialog'
import { EnviarFacturaDialog } from '@/components/modals/enviar-factura-dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

interface Factura {
  id: string
  numero: string
  tipo: 'TICKET' | 'FACTURA'
  fecha: string
  cliente: {
    nombre: string
    apellido?: string
    email?: string
    telefono: string
  }
  total: number
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA'
  metodoPago?: string
  pdfPath?: string
}

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'TICKET' | 'FACTURA'>('ALL')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)
  const [showDetalles, setShowDetalles] = useState(false)
  const [stats, setStats] = useState({
    totalFacturas: 0,
    totalTickets: 0,
    ingresosMes: 0,
    pendientesCobro: 0,
    totalVentas: 0,
    ventasEfectivo: 0,
    ventasTPVSumup: 0,
    ventasTPVUnicaja: 0,
    gastosEfectivo: 0,
    efectivoEnCaja: 0
  })

  useEffect(() => {
    loadFacturas()
    loadStats()
  }, [])

  // Recargar estadísticas cuando cambian los filtros de fecha
  useEffect(() => {
    loadStats()
  }, [filterFechaDesde, filterFechaHasta])

  const loadFacturas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/car-rental-billing/facturas')
      if (response.ok) {
        const data = await response.json()
        setFacturas(data || [])
      }
    } catch (error) {
      console.error('Error loading facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Construir la URL con los parámetros de fecha si existen
      let url = '/api/car-rental-billing/facturas/stats'
      const params = new URLSearchParams()
      
      if (filterFechaDesde) {
        params.append('fechaDesde', filterFechaDesde)
      }
      if (filterFechaHasta) {
        params.append('fechaHasta', filterFechaHasta)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const descargarPDF = async (facturaId: string | number, numeroFactura: string) => {
    try {
      console.log('📥 Descargando PDF:', { facturaId, numeroFactura })
      toast.loading('Generando PDF...', { id: 'pdf-gen' })
      
      const response = await fetch(`/api/car-rental-billing/facturas/${facturaId}/pdf`)
      console.log('📡 Respuesta del servidor:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        // El backend ahora devuelve un PDF binario directamente
        const blob = await response.blob()
        console.log('✅ PDF recibido:', { size: blob.size, type: blob.type })
        
        // Crear una URL temporal para el blob
        const url = window.URL.createObjectURL(blob)
        
        // Crear un enlace temporal y descargarlo
        const a = document.createElement('a')
        a.href = url
        a.download = `${numeroFactura}.pdf`
        document.body.appendChild(a)
        a.click()
        
        // Limpiar
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`PDF ${numeroFactura} descargado correctamente`, { id: 'pdf-gen' })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ Error del servidor:', errorData)
        throw new Error(errorData.error || 'Error en la respuesta del servidor')
      }
    } catch (error: any) {
      console.error('❌ Error downloading document:', error)
      toast.error(`Error al descargar el documento: ${error.message || 'Error desconocido'}`, { id: 'pdf-gen' })
    }
  }

  const verDocumento = async (facturaId: string | number) => {
    try {
      console.log('👁️ Viendo PDF:', { facturaId })
      toast.loading('Generando vista previa...', { id: 'pdf-view' })
      
      const response = await fetch(`/api/car-rental-billing/facturas/${facturaId}/pdf`)
      console.log('📡 Respuesta del servidor:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        // Obtener el PDF como blob
        const blob = await response.blob()
        console.log('✅ PDF recibido:', { size: blob.size, type: blob.type })
        const url = window.URL.createObjectURL(blob)
        
        // Abrir en nueva ventana
        const newWindow = window.open(url, '_blank')
        if (!newWindow) {
          toast.error('No se pudo abrir la ventana. Por favor verifica que no haya bloqueadores de ventanas emergentes.', { id: 'pdf-view' })
        } else {
          toast.success('Vista previa generada', { id: 'pdf-view' })
          // Limpiar después de un tiempo
          setTimeout(() => window.URL.revokeObjectURL(url), 30000)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ Error del servidor:', errorData)
        throw new Error(errorData.error || 'Error en la respuesta del servidor')
      }
    } catch (error: any) {
      console.error('❌ Error viewing document:', error)
      toast.error(`Error al abrir el documento: ${error.message || 'Error desconocido'}`, { id: 'pdf-view' })
    }
  }

  const verDetalles = (factura: Factura) => {
    setSelectedFactura(factura)
    setShowDetalles(true)
  }

  const convertirTicketAFactura = async (facturaId: string, numeroTicket: string) => {
    if (!confirm(`¿Desea convertir el ticket ${numeroTicket} a factura? Se generará un nuevo número de factura.`)) {
      return
    }

    try {
      const response = await fetch('/api/car-rental-billing/convertir-a-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al convertir ticket')
      }

      alert(`✅ Ticket ${numeroTicket} convertido a factura ${data.factura.numero}`)
      loadFacturas()
      loadStats()
    } catch (error) {
      console.error('Error converting ticket:', error)
      alert('Error al convertir el ticket a factura')
    }
  }

  const eliminarFactura = async (facturaId: string, numeroFactura: string) => {
    if (!confirm(`¿Está seguro que desea eliminar el documento ${numeroFactura}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/car-rental-billing/facturas/${facturaId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Documento eliminado correctamente')
        loadFacturas()
        loadStats()
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error deleting factura:', error)
      alert('Error al eliminar el documento. Por favor intenta de nuevo.')
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PAGADA': return 'bg-green-100 text-green-800 border-green-200'
      case 'VENCIDA': return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELADA': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoColor = (tipo: string) => {
    return tipo === 'FACTURA' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const formatMetodoPago = (metodoPago: string) => {
    const metodos: { [key: string]: string } = {
      'EFECTIVO': 'Efectivo',
      'TPV_SUMUP': 'TPV SUMUP',
      'TPV_UNICAJA': 'TPV UNICAJA',
      'TARJETA': 'Tarjeta',
      'TRANSFERENCIA': 'Transferencia'
    }
    return metodos[metodoPago] || metodoPago
  }

  const filteredFacturas = facturas.filter(factura => {
    // Validar que factura tenga todas las propiedades necesarias
    if (!factura || !factura.numero || !factura.cliente) {
      console.warn('⚠️ Factura con datos incompletos:', factura)
      return false
    }
    
    const matchesSearch = searchTerm === '' || 
      factura.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${factura.cliente.nombre} ${factura.cliente.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'ALL' || factura.tipo === filterType
    
    // Filtrado por fecha
    let matchesFecha = true
    if (filterFechaDesde || filterFechaHasta) {
      const facturaFecha = new Date(factura.fecha)
      
      if (filterFechaDesde) {
        const fechaDesde = new Date(filterFechaDesde)
        fechaDesde.setHours(0, 0, 0, 0)
        matchesFecha = matchesFecha && facturaFecha >= fechaDesde
      }
      
      if (filterFechaHasta) {
        const fechaHasta = new Date(filterFechaHasta)
        fechaHasta.setHours(23, 59, 59, 999)
        matchesFecha = matchesFecha && facturaFecha <= fechaHasta
      }
    }
    
    return matchesSearch && matchesType && matchesFecha
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-gray-600">
            Gestión de facturas, tickets y reportes financieros
          </p>
        </div>
        <NuevaFacturaDialog onFacturaCreada={loadFacturas} />
      </div>

      {/* Indicador de filtro de fechas activo */}
      {(filterFechaDesde || filterFechaHasta) && (
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  📅 Filtro de fechas activo:
                </span>
                <span className="text-sm text-blue-700">
                  {filterFechaDesde ? format(new Date(filterFechaDesde), 'dd/MM/yyyy', { locale: es }) : 'Inicio'} 
                  {' → '}
                  {filterFechaHasta ? format(new Date(filterFechaHasta), 'dd/MM/yyyy', { locale: es }) : 'Hoy'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterFechaDesde('')
                  setFilterFechaHasta('')
                }}
                className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
              >
                <X className="h-4 w-4 mr-1" />
                Quitar filtro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFacturas}</div>
            <p className="text-xs text-muted-foreground">
              {(filterFechaDesde || filterFechaHasta) ? 'En período seleccionado' : 'Documentos generados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {(filterFechaDesde || filterFechaHasta) ? 'En período seleccionado' : 'Tickets emitidos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {(filterFechaDesde || filterFechaHasta) ? 'Ingresos (Período)' : 'Ingresos del Mes'}
            </CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.ingresosMes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {(filterFechaDesde || filterFechaHasta) ? 'Facturas cobradas' : 'Facturación mensual'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.pendientesCobro.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {(filterFechaDesde || filterFechaHasta) ? 'En período seleccionado' : 'Por cobrar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de Ventas por Método de Pago */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-900">
            <div className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Resumen de Ventas - Arqueo de Caja
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                loadStats()
                loadFacturas()
              }}
              className="bg-white hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </CardTitle>
          <p className="text-sm text-blue-700">
            Incluye facturas/tickets pagados del sistema de alquiler
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Resumen principal */}
            <div className="bg-white rounded-lg p-6 shadow-md border-2 border-blue-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total General */}
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-lg font-semibold text-gray-700">TOTAL VENTAS COBRADAS</span>
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    €{stats.totalVentas.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Total de ingresos registrados
                  </div>
                </div>

                {/* Efectivo en caja */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                  <div className="flex items-center justify-center md:justify-start mb-2">
                    <Euro className="h-5 w-5 text-green-700 mr-2" />
                    <span className="text-lg font-semibold text-green-800">EFECTIVO EN CAJA</span>
                  </div>
                  <div className="text-4xl font-bold text-green-700">
                    €{stats.efectivoEnCaja.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-700 mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Ventas efectivo:</span>
                      <span className="font-medium">€{stats.ventasEfectivo.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-700">
                      <span>Gastos efectivo:</span>
                      <span className="font-medium">-€{stats.gastosEfectivo.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-green-300 pt-1 mt-1"></div>
                    <div className="text-sm font-bold text-green-800">
                      👉 Debe haber esta cantidad en la caja
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose de TPVs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TPV SUMUP */}
              <div className="bg-white rounded-lg p-5 shadow-sm border-2 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-base font-semibold text-gray-700">TPV SUMUP</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  €{stats.ventasTPVSumup.toFixed(2)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {stats.totalVentas > 0 ? ((stats.ventasTPVSumup / stats.totalVentas) * 100).toFixed(1) : '0'}% del total
                  </span>
                  <span className="text-xs font-medium text-purple-600">
                    Cobrado por tarjeta
                  </span>
                </div>
              </div>

              {/* TPV UNICAJA */}
              <div className="bg-white rounded-lg p-5 shadow-sm border-2 border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-base font-semibold text-gray-700">TPV UNICAJA</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  €{stats.ventasTPVUnicaja.toFixed(2)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {stats.totalVentas > 0 ? ((stats.ventasTPVUnicaja / stats.totalVentas) * 100).toFixed(1) : '0'}% del total
                  </span>
                  <span className="text-xs font-medium text-orange-600">
                    Cobrado por tarjeta
                  </span>
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="bg-blue-100 border-l-4 border-blue-500 p-3 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 text-sm text-blue-800">
                  <p className="font-medium">
                    Este resumen incluye todas las facturas y tickets pagados del sistema de alquiler de vehículos.
                  </p>
                  <p className="mt-1">
                    Los importes de TPV se ingresan automáticamente en cuenta bancaria. El efectivo debe estar físicamente en la caja.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Primera fila: Búsqueda y botones de tipo */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={filterType === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('ALL')}
              >
                Todos
              </Button>
              <Button
                variant={filterType === 'TICKET' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('TICKET')}
              >
                Tickets
              </Button>
              <Button
                variant={filterType === 'FACTURA' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('FACTURA')}
              >
                Facturas
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={loadFacturas}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Segunda fila: Filtros por fecha */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por fecha:</span>
              
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={filterFechaDesde}
                  onChange={(e) => setFilterFechaDesde(e.target.value)}
                  className="w-40"
                  placeholder="Desde"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="date"
                  value={filterFechaHasta}
                  onChange={(e) => setFilterFechaHasta(e.target.value)}
                  className="w-40"
                  placeholder="Hasta"
                />
              </div>
            </div>

            {/* Botones de acceso rápido */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoy = new Date().toISOString().split('T')[0]
                  setFilterFechaDesde(hoy)
                  setFilterFechaHasta(hoy)
                }}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoy = new Date()
                  const diaSemana = hoy.getDay()
                  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1
                  const lunes = new Date(hoy)
                  lunes.setDate(hoy.getDate() - diasDesdeElLunes)
                  lunes.setHours(0, 0, 0, 0)
                  
                  setFilterFechaDesde(lunes.toISOString().split('T')[0])
                  setFilterFechaHasta(hoy.toISOString().split('T')[0])
                }}
              >
                Esta semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoy = new Date()
                  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
                  setFilterFechaDesde(primerDiaMes.toISOString().split('T')[0])
                  setFilterFechaHasta(hoy.toISOString().split('T')[0])
                }}
              >
                Este mes
              </Button>
              {(filterFechaDesde || filterFechaHasta) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterFechaDesde('')
                    setFilterFechaHasta('')
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facturas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas y Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="font-medium">
                      {factura.numero}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(factura.tipo)}>
                        {factura.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {factura.cliente.nombre} {factura.cliente.apellido || ''}
                    </TableCell>
                    <TableCell>
                      {format(new Date(factura.fecha), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>€{factura.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(factura.estado)}>
                        {factura.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {factura.metodoPago ? formatMetodoPago(factura.metodoPago) : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => descargarPDF(factura.id, factura.numero)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Documento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => verDocumento(factura.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Documento
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <EnviarFacturaDialog 
                              facturaId={factura.id}
                              facturaNumero={factura.numero}
                              clienteNombre={`${factura.cliente.nombre} ${factura.cliente.apellido || ''}`}
                              clienteEmail={factura.cliente.email}
                              clienteTelefono={factura.cliente.telefono}
                              tipo={factura.tipo}
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => verDetalles(factura)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Info Completa
                          </DropdownMenuItem>
                          {factura.tipo === 'TICKET' && (
                            <DropdownMenuItem 
                              onClick={() => convertirTicketAFactura(factura.id, factura.numero)}
                              className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Convertir a Factura
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <EditarFacturaDialog 
                              facturaId={factura.id}
                              facturaNumero={factura.numero}
                              onFacturaActualizada={loadFacturas}
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => eliminarFactura(factura.id, factura.numero)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Documento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {!loading && filteredFacturas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron facturas que coincidan con los criterios de búsqueda.
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={showDetalles} onOpenChange={setShowDetalles}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Detalles de {selectedFactura?.tipo || 'Documento'}
            </DialogTitle>
            <DialogDescription>
              Información completa del documento #{selectedFactura?.numero}
            </DialogDescription>
          </DialogHeader>

          {selectedFactura && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Número</p>
                  <p className="text-sm">{selectedFactura.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <Badge className={getTipoColor(selectedFactura.tipo)}>
                    {selectedFactura.tipo}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha</p>
                  <p className="text-sm">
                    {format(new Date(selectedFactura.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <Badge className={getEstadoColor(selectedFactura.estado)}>
                    {selectedFactura.estado}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Cliente</p>
                <p className="text-sm">{selectedFactura.cliente.nombre} {selectedFactura.cliente.apellido || ''}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-green-600">€{selectedFactura.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                  <p className="text-sm">{selectedFactura.metodoPago ? formatMetodoPago(selectedFactura.metodoPago) : 'No especificado'}</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => descargarPDF(selectedFactura.id, selectedFactura.numero)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Documento
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => verDocumento(selectedFactura.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Documento
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetalles(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
