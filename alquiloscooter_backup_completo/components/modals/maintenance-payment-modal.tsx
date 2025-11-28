'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign } from 'lucide-react';

interface MaintenancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: any) => Promise<void>;
  maintenance: any;
}

export function MaintenancePaymentModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  maintenance 
}: MaintenancePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('TICKET');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [proveedor, setProveedor] = useState(maintenance?.workshop?.name || '');
  const [proveedorCif, setProveedorCif] = useState('');

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      const paymentData: any = {
        payment_method: metodoPago,
        tipo_documento: tipoDocumento
      };
      
      if (tipoDocumento === 'FACTURA') {
        if (!numeroFactura) {
          alert('El número de factura es obligatorio');
          return;
        }
        paymentData.numero_factura = numeroFactura;
        if (proveedor) paymentData.proveedor = proveedor;
        if (proveedorCif) paymentData.proveedor_cif = proveedorCif;
      }
      
      await onConfirm(paymentData);
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (!maintenance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Marcar Mantenimiento como Pagado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Mantenimiento:</span> {maintenance.title}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-semibold">Vehículo:</span> {maintenance.vehicle?.registration_number}
            </p>
            {maintenance.actual_cost && (
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Importe:</span> €{maintenance.actual_cost}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_documento">Tipo de Documento</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger id="tipo_documento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TICKET">Ticket</SelectItem>
                <SelectItem value="FACTURA">Factura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo_pago">Método de Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger id="metodo_pago">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TPV_SUMUP">TPV SumUp</SelectItem>
                <SelectItem value="TPV_UNICAJA">TPV Unicaja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoDocumento === 'FACTURA' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="numero_factura">Número de Factura *</Label>
                <Input
                  id="numero_factura"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Ej: FAC-2025-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedor_cif">CIF del Proveedor</Label>
                <Input
                  id="proveedor_cif"
                  value={proveedorCif}
                  onChange={(e) => setProveedorCif(e.target.value)}
                  placeholder="Ej: B12345678"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
