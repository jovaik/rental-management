'use client'

import React, { useState, useEffect } from 'react'
import { Edit, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface EditarFacturaDialogProps {
  facturaId: string
  facturaNumero: string
  onFacturaActualizada: () => void
}

interface FacturaCompleta {
  id: string
  numero: string
  tipo: 'TICKET' | 'FACTURA'
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA'
  metodoPago?: string
  subtotal: number
  iva: number
  total: number
  items: Array<{
    id: string
    descripcion: string
    cantidad: number
    precio: number
    total: number
  }>
  cliente: {
    nombre: string
    apellidos?: string
  }
  datosFacturacion?: string
}

export function EditarFacturaDialog({ facturaId, facturaNumero, onFacturaActualizada }: EditarFacturaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [factura, setFactura] = useState<FacturaCompleta | null>(null)
  
  // Estados editables
  const [estado, setEstado] = useState<string>('')
  const [metodoPago, setMetodoPago] = useState<string>('')
  const [items, setItems] = useState<Array<{
    id: string
    descripcion: string
    cantidad: number
    precio: number
    total: number
  }>>([])

  useEffect(() => {
    if (open && facturaId) {
      cargarFactura()
    }
  }, [open, facturaId])

  const cargarFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/car-rental-billing/facturas/${facturaId}`)
      if (response.ok) {
        const data = await response.json()
        setFactura(data)
        setEstado(data.estado)
        setMetodoPago(data.metodoPago || '')
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error loading factura:', error)
      alert('Error al cargar los datos de la factura')
    } finally {
      setLoading(false)
    }
  }

  const actualizarItem = (index: number, field: 'descripcion' | 'cantidad' | 'precio', value: string | number) => {
    const nuevosItems = [...items]
    nuevosItems[index] = { ...nuevosItems[index], [field]: value }
    
    // Recalcular total del item
    if (field === 'cantidad' || field === 'precio') {
      nuevosItems[index].total = nuevosItems[index].cantidad * nuevosItems[index].precio
    }
    
    setItems(nuevosItems)
  }

  const calcularTotales = () => {
    const total = items.reduce((sum, item) => sum + item.total, 0)
    const subtotal = total / 1.21
    const iva = total - subtotal
    return { subtotal, iva, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!estado || !metodoPago) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    if (items.some(item => !item.descripcion || item.precio <= 0)) {
      alert('Por favor complete todos los items con descripción y precio válido')
      return
    }

    setLoading(true)
    
    try {
      const updateData: any = {
        estado,
        metodoPago
      }

      const itemsOriginales = factura?.items || []
      const itemsCambiaron = JSON.stringify(items) !== JSON.stringify(itemsOriginales)
      
      if (itemsCambiaron) {
        updateData.items = items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      }

      const response = await fetch(`/api/car-rental-billing/facturas/${facturaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setOpen(false)
        onFacturaActualizada()
        alert('Factura actualizada correctamente')
      } else {
        throw new Error('Error al actualizar la factura')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la factura. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, iva, total } = calcularTotales()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 rounded-sm w-full">
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar {factura?.tipo || 'Documento'}
          </DialogTitle>
          <DialogDescription>
            Modificar datos del documento #{facturaNumero}
          </DialogDescription>
        </DialogHeader>

        {loading && !factura ? (
          <div className="space-y-4 py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : factura ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de {factura.tipo}</Label>
                <Input value={factura.numero} disabled />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input value={`${factura.cliente.nombre} ${factura.cliente.apellidos || ''}`} disabled />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="PAGADA">Pagada</SelectItem>
                    <SelectItem value="VENCIDA">Vencida</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="metodoPago">Método de Pago *</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo (TICKET)</SelectItem>
                    <SelectItem value="TPV_SUMUP">TPV SUMUP (TICKET)</SelectItem>
                    <SelectItem value="TPV_UNICAJA">TPV UNICAJA - Tarjeta (FACTURA)</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia (FACTURA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Items del Documento</Label>
              <div className="mt-3 space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-4 gap-3 p-3 border rounded bg-gray-50">
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                        placeholder="Descripción"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Precio €</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precio}
                        onChange={(e) => actualizarItem(index, 'precio', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <Input
                        value={`€${item.total.toFixed(2)}`}
                        disabled
                        className="text-sm font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (21%):</span>
                  <span>€{iva.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {subtotal !== factura.subtotal && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Al modificar los items, se recalcularán automáticamente los totales del documento.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Error al cargar los datos del documento.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
