'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CreditCard, 
  Wallet, 
  Receipt, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: number
  concepto: string
  monto: number
  metodo_pago: string
  fecha_pago: string
  notas?: string
}

interface Deposit {
  id?: number
  monto_deposito: number
  metodo_pago_deposito: string
  fecha_deposito: string
  estado: string
  monto_devuelto: number
  monto_descontado: number
  fecha_devolucion?: string
  metodo_devolucion?: string
  descuento_danos: number
  descuento_multas: number
  descuento_extensiones: number
  descuento_otros: number
  notas?: string
}

interface ManageBookingFinancialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function ManageBookingFinancialsDialog({
  open,
  onOpenChange,
  booking,
  onSuccess
}: ManageBookingFinancialsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showAddDeposit, setShowAddDeposit] = useState(false)
  const [editingDepositId, setEditingDepositId] = useState<number | null>(null)
  const [fullBookingData, setFullBookingData] = useState<any>(null)
  
  // Nuevo pago
  const [newPayment, setNewPayment] = useState({
    concepto: 'Pago de reserva',
    monto: '',
    metodo_pago: 'EFECTIVO',
    notas: ''
  })
  
  // Nuevo depósito / Editar depósito - USAR STRINGS PARA INPUTS
  const [depositForm, setDepositForm] = useState<any>({
    monto_deposito: '',
    metodo_pago_deposito: 'EFECTIVO',
    estado: 'RETENIDO',
    monto_devuelto: '',
    monto_descontado: '',
    descuento_danos: '',
    descuento_multas: '',
    descuento_extensiones: '',
    descuento_otros: '',
    notas: ''
  })

  // Cargar datos financieros al abrir
  useEffect(() => {
    if (open && booking) {
      loadFinancialData()
    }
  }, [open, booking])

  const loadFinancialData = async () => {
    try {
      const [bookingRes, paymentsRes, depositRes] = await Promise.all([
        fetch(`/api/bookings/${booking.id}`),
        fetch(`/api/bookings/${booking.id}/payments`),
        fetch(`/api/bookings/${booking.id}/deposits`)
      ])

      // Cargar datos completos de la reserva
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json()
        setFullBookingData(bookingData)
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setPayments(paymentsData)
      }

      if (depositRes.ok) {
        const depositsData = await depositRes.json()
        setDeposits(depositsData || [])
      }
    } catch (error) {
      console.error('Error cargando datos financieros:', error)
    }
  }

  const handleAddPayment = async () => {
    if (!newPayment.monto || parseFloat(newPayment.monto) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: newPayment.concepto,
          monto: parseFloat(newPayment.monto),
          metodo_pago: newPayment.metodo_pago,
          notas: newPayment.notas || null
        })
      })

      if (response.ok) {
        toast.success('Pago registrado')
        loadFinancialData()
        setShowAddPayment(false)
        setNewPayment({
          concepto: 'Pago de reserva',
          monto: '',
          metodo_pago: 'EFECTIVO',
          notas: ''
        })
      } else {
        toast.error('Error registrando pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error registrando pago')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('¿Eliminar este pago?')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${booking.id}/payments/${paymentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Pago eliminado')
        loadFinancialData()
      } else {
        toast.error('Error eliminando pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error eliminando pago')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDeposit = async () => {
    // Convertir a número para validar
    const montoNum = parseFloat(depositForm.monto_deposito)
    
    if (!depositForm.monto_deposito || isNaN(montoNum) || montoNum <= 0) {
      toast.error('El monto del depósito debe ser mayor a 0')
      return
    }

    try {
      setLoading(true)
      
      // Limpiar y validar todos los valores numéricos antes de enviar
      const cleanedDepositData = {
        ...depositForm,
        monto_deposito: parseFloat(depositForm.monto_deposito || '0') || 0,
        monto_devuelto: parseFloat(depositForm.monto_devuelto || '0') || 0,
        monto_descontado: parseFloat(depositForm.monto_descontado || '0') || 0,
        descuento_danos: parseFloat(depositForm.descuento_danos || '0') || 0,
        descuento_multas: parseFloat(depositForm.descuento_multas || '0') || 0,
        descuento_extensiones: parseFloat(depositForm.descuento_extensiones || '0') || 0,
        descuento_otros: parseFloat(depositForm.descuento_otros || '0') || 0
      }

      let response;
      if (editingDepositId) {
        // Editar depósito existente
        response = await fetch(`/api/bookings/${booking.id}/deposits/${editingDepositId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanedDepositData)
        })
      } else {
        // Crear nuevo depósito
        response = await fetch(`/api/bookings/${booking.id}/deposits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanedDepositData)
        })
      }

      if (response.ok) {
        toast.success(editingDepositId ? 'Depósito actualizado' : 'Depósito registrado')
        await loadFinancialData()
        setShowAddDeposit(false)
        setEditingDepositId(null)
        // Reset form - USAR STRINGS VACÍOS
        setDepositForm({
          monto_deposito: '',
          metodo_pago_deposito: 'EFECTIVO',
          estado: 'RETENIDO',
          monto_devuelto: '',
          monto_descontado: '',
          descuento_danos: '',
          descuento_multas: '',
          descuento_extensiones: '',
          descuento_otros: '',
          notas: ''
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error guardando depósito:', errorData)
        toast.error(`Error guardando depósito: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error guardando depósito')
    } finally {
      setLoading(false)
    }
  }

  const handleEditDeposit = (deposit: Deposit) => {
    setEditingDepositId(deposit.id!)
    // Convertir valores numéricos a strings para el formulario
    setDepositForm({
      ...deposit,
      monto_deposito: deposit.monto_deposito?.toString() || '',
      monto_devuelto: deposit.monto_devuelto?.toString() || '',
      monto_descontado: deposit.monto_descontado?.toString() || '',
      descuento_danos: deposit.descuento_danos?.toString() || '',
      descuento_multas: deposit.descuento_multas?.toString() || '',
      descuento_extensiones: deposit.descuento_extensiones?.toString() || '',
      descuento_otros: deposit.descuento_otros?.toString() || ''
    })
    setShowAddDeposit(true)
  }

  const handleDeleteDeposit = async (depositId: number) => {
    if (!confirm('¿Eliminar este depósito?')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${booking.id}/deposits/${depositId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Depósito eliminado')
        loadFinancialData()
      } else {
        toast.error('Error eliminando depósito')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error eliminando depósito')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteBooking = async () => {
    // Validaciones
    const totalPagado = payments.reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0)
    const totalReserva = parseFloat(booking.total_price?.toString() || '0')

    if (totalPagado < totalReserva) {
      toast.error(`Falta registrar pagos. Total: €${totalReserva.toFixed(2)}, Pagado: €${totalPagado.toFixed(2)}`)
      return
    }

    if (deposits.length === 0) {
      toast.error('Debes registrar al menos un depósito antes de completar la reserva')
      return
    }

    if (!confirm('¿Completar esta reserva y generar factura/ticket?')) return

    try {
      setLoading(true)
      
      // 1. Completar la reserva
      const updateResponse = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed'
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Error al completar la reserva')
      }

      // 2. Generar factura/ticket automáticamente
      // Determinar tipo de documento según método de pago mayoritario
      const metodoPagoMayoritario = getMayorityPaymentMethod()
      
      const facturaResponse = await fetch('/api/car-rental-billing/generar-desde-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          metodoPago: metodoPagoMayoritario
        })
      })

      const facturaData = await facturaResponse.json()

      if (!facturaResponse.ok) {
        console.error('❌ Error al generar factura:', facturaData)
        console.error('❌ Detalles del error:', {
          status: facturaResponse.status,
          statusText: facturaResponse.statusText,
          error: facturaData.error,
          details: facturaData.details
        })
        
        // Mostrar error más descriptivo
        const errorMsg = facturaData.error || 'Error desconocido'
        const errorDetails = facturaData.details ? ` (${facturaData.details})` : ''
        toast.error(`Error al generar factura: ${errorMsg}${errorDetails}`, {
          duration: 8000 // 8 segundos para que el usuario pueda leer el error
        })
        
        // No cerramos el diálogo para que el usuario pueda ver el estado
        setLoading(false)
        return // Salimos aquí para no marcar como éxito
      } else {
        const tipoDoc = facturaData.factura.tipo === 'FACTURA' ? 'Factura' : 'Ticket'
        toast.success(`✅ ${tipoDoc} ${facturaData.factura.numero} generado automáticamente`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('❌ Error al completar reserva:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al completar la reserva: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const getMayorityPaymentMethod = () => {
    if (payments.length === 0) return 'EFECTIVO'
    
    const metodoCounts: Record<string, number> = {}
    payments.forEach(p => {
      metodoCounts[p.metodo_pago] = (metodoCounts[p.metodo_pago] || 0) + parseFloat(p.monto.toString())
    })

    return Object.entries(metodoCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
  }

  const getPaymentMethodIcon = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO':
        return <Wallet className="h-4 w-4" />
      case 'TPV_SUMUP':
      case 'TPV_UNICAJA':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO': return 'Efectivo'
      case 'TPV_SUMUP': return 'TPV SumUp'
      case 'TPV_UNICAJA': return 'TPV Unicaja'
      default: return metodo
    }
  }

  const totalPagado = payments.reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0)
  const totalReserva = parseFloat(booking?.total_price?.toString() || '0')
  const saldoPendiente = totalReserva - totalPagado
  const totalDepositos = deposits.reduce((sum, d) => sum + parseFloat(d.monto_deposito.toString()), 0)

  const canComplete = totalPagado >= totalReserva && deposits.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión Financiera de Reserva</DialogTitle>
          <DialogDescription>
            Registra pagos, depósitos y completa la reserva para generar factura/ticket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información de la reserva */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">
                  {fullBookingData?.customer 
                    ? `${fullBookingData.customer.first_name} ${fullBookingData.customer.last_name || ''}`.trim() 
                    : booking?.customer_name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Reserva:</span>
                <span className="font-bold text-lg">€{totalReserva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pagado:</span>
                <span className={`font-bold ${totalPagado >= totalReserva ? 'text-green-600' : 'text-orange-600'}`}>
                  €{totalPagado.toFixed(2)}
                </span>
              </div>
              {saldoPendiente > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo Pendiente:</span>
                  <span className="font-bold text-red-600">€{saldoPendiente.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Pagos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pagos
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddPayment(!showAddPayment)}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Pago
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddPayment && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="concepto">Concepto</Label>
                        <Input
                          id="concepto"
                          value={newPayment.concepto}
                          onChange={(e) => setNewPayment({ ...newPayment, concepto: e.target.value })}
                          placeholder="Pago de reserva"
                        />
                      </div>
                      <div>
                        <Label htmlFor="monto">Monto (€)</Label>
                        <Input
                          id="monto"
                          type="number"
                          step="0.01"
                          value={newPayment.monto}
                          onChange={(e) => setNewPayment({ ...newPayment, monto: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="metodo">Método de Pago</Label>
                        <Select
                          value={newPayment.metodo_pago}
                          onValueChange={(value) => setNewPayment({ ...newPayment, metodo_pago: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                            <SelectItem value="TPV_SUMUP">TPV SumUp</SelectItem>
                            <SelectItem value="TPV_UNICAJA">TPV Unicaja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notas-pago">Notas (opcional)</Label>
                        <Input
                          id="notas-pago"
                          value={newPayment.notas}
                          onChange={(e) => setNewPayment({ ...newPayment, notas: e.target.value })}
                          placeholder="Notas adicionales"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddPayment(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddPayment}
                        disabled={loading}
                      >
                        Guardar Pago
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {payments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(payment.metodo_pago)}
                        <div>
                          <div className="font-medium">{payment.concepto}</div>
                          <div className="text-xs text-muted-foreground">
                            {getPaymentMethodLabel(payment.metodo_pago)} • {new Date(payment.fecha_pago).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">€{parseFloat(payment.monto.toString()).toFixed(2)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePayment(payment.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Depósitos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5" />
                Depósitos
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddDeposit(!showAddDeposit)
                  setEditingDepositId(null)
                  // Reset form - USAR STRINGS VACÍOS PARA PERMITIR ESCRIBIR
                  setDepositForm({
                    monto_deposito: '',
                    metodo_pago_deposito: 'EFECTIVO',
                    estado: 'RETENIDO',
                    monto_devuelto: '',
                    monto_descontado: '',
                    descuento_danos: '',
                    descuento_multas: '',
                    descuento_extensiones: '',
                    descuento_otros: '',
                    notas: ''
                  })
                }}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Depósito
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddDeposit && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Monto Depósito (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={depositForm.monto_deposito}
                          onChange={(e) => setDepositForm({ ...depositForm, monto_deposito: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Método de Pago</Label>
                        <Select
                          value={depositForm.metodo_pago_deposito}
                          onValueChange={(value) => setDepositForm({ ...depositForm, metodo_pago_deposito: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                            <SelectItem value="TPV_SUMUP">TPV SumUp</SelectItem>
                            <SelectItem value="TPV_UNICAJA">TPV Unicaja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Select
                          value={depositForm.estado}
                          onValueChange={(value) => setDepositForm({ ...depositForm, estado: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RETENIDO">Retenido</SelectItem>
                            <SelectItem value="DEVUELTO">Devuelto</SelectItem>
                            <SelectItem value="PARCIALMENTE_DEVUELTO">Parcialmente Devuelto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(depositForm.estado === 'DEVUELTO' || depositForm.estado === 'PARCIALMENTE_DEVUELTO') && (
                        <>
                          <div>
                            <Label>Monto Devuelto (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={depositForm.monto_devuelto}
                              onChange={(e) => setDepositForm({ ...depositForm, monto_devuelto: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Método Devolución</Label>
                            <Select
                              value={depositForm.metodo_devolucion || 'EFECTIVO'}
                              onValueChange={(value) => setDepositForm({ ...depositForm, metodo_devolucion: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                <SelectItem value="TPV_SUMUP">TPV SumUp</SelectItem>
                                <SelectItem value="TPV_UNICAJA">TPV Unicaja</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2 space-y-2">
                            <Label>Descuentos Aplicados</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Daños (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={depositForm.descuento_danos}
                                  onChange={(e) => setDepositForm({ ...depositForm, descuento_danos: e.target.value })}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Multas (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={depositForm.descuento_multas}
                                  onChange={(e) => setDepositForm({ ...depositForm, descuento_multas: e.target.value })}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Extensiones (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={depositForm.descuento_extensiones}
                                  onChange={(e) => setDepositForm({ ...depositForm, descuento_extensiones: e.target.value })}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Otros (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={depositForm.descuento_otros}
                                  onChange={(e) => setDepositForm({ ...depositForm, descuento_otros: e.target.value })}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="col-span-2">
                        <Label>Notas (opcional)</Label>
                        <Textarea
                          value={depositForm.notas}
                          onChange={(e) => setDepositForm({ ...depositForm, notas: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddDeposit(false)
                          setEditingDepositId(null)
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveDeposit}
                        disabled={loading}
                      >
                        {editingDepositId ? 'Actualizar' : 'Guardar'} Depósito
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {deposits.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay depósitos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Monto:</span>
                            <span className="font-bold text-lg">€{parseFloat(deposit.monto_deposito.toString()).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Método:</span>
                            <span>{getPaymentMethodLabel(deposit.metodo_pago_deposito)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Fecha:</span>
                            <span>
                              {new Date(deposit.fecha_deposito).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} {new Date(deposit.fecha_deposito).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge variant={deposit.estado === 'RETENIDO' ? 'default' : 'secondary'}>
                              {deposit.estado}
                            </Badge>
                          </div>
                          {deposit.estado !== 'RETENIDO' && (
                            <>
                              <Separator className="my-2" />
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Devuelto:</span>
                                <span className="text-green-600 font-medium">€{parseFloat(deposit.monto_devuelto.toString()).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Descontado:</span>
                                <span className="text-red-600 font-medium">€{parseFloat(deposit.monto_descontado.toString()).toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1 ml-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDeposit(deposit)}
                            disabled={loading}
                            title="Editar"
                          >
                            <Receipt className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDeposit(deposit.id!)}
                            disabled={loading}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-900">Total en Depósitos:</span>
                      <span className="font-bold text-lg text-blue-900">€{totalDepositos.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado de validación */}
          <Card className={canComplete ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {canComplete ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-900">Lista para completar</div>
                      <div className="text-sm text-green-700">Todos los pagos y depósito registrados correctamente</div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                    <div>
                      <div className="font-semibold text-orange-900">Pendiente</div>
                      <div className="text-sm text-orange-700">
                        {deposits.length === 0 && 'Registra al menos un depósito. '}
                        {saldoPendiente > 0 && `Falta registrar €${saldoPendiente.toFixed(2)} en pagos.`}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cerrar
          </Button>
          <Button
            onClick={handleCompleteBooking}
            disabled={loading || !canComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completar Reserva y Generar Documento
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}