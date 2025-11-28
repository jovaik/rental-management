
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, DollarSign, Loader2, FileText, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { InvoiceDocumentManagement, ExtractedInvoiceData } from '@/components/gastos/InvoiceDocumentManagement';
import toast from 'react-hot-toast';

interface GastoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gastoToEdit?: any;
}

export default function GastoModal({ open, onClose, onSuccess, gastoToEdit }: GastoModalProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form data
  const [fecha, setFecha] = useState<Date>(new Date());
  const [tipoDocumento, setTipoDocumento] = useState('TICKET');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [proveedorCif, setProveedorCif] = useState('');
  const [categoria, setCategoria] = useState('Mantenimiento');
  const [descripcion, setDescripcion] = useState('');
  const [baseImponible, setBaseImponible] = useState('');
  const [ivaPorcentaje, setIvaPorcentaje] = useState('21');
  const [ivaImporte, setIvaImporte] = useState('');
  const [total, setTotal] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [vehicleId, setVehicleId] = useState<string>('');
  
  // ✅ NUEVO: Manejar datos extraídos del OCR
  const handleExtractedData = (data: ExtractedInvoiceData) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎯 [GASTO-MODAL] ¡INICIO DE AUTO-RELLENO!');
    console.log('📊 [GASTO-MODAL] Datos extraídos recibidos:', JSON.stringify(data, null, 2));
    console.log('═══════════════════════════════════════════════════════');
    
    // ✅ MOSTRAR NOTIFICACIÓN VISUAL INMEDIATA
    toast.loading('🔄 Auto-rellenando formulario...', { id: 'auto-fill' });
    
    let camposActualizados = 0;
    
    // Auto-rellenar campos del formulario
    if (data.fecha) {
      try {
        const parsedDate = new Date(data.fecha);
        console.log('📅 [GASTO-MODAL] Fecha parseada:', parsedDate);
        setFecha(parsedDate);
        camposActualizados++;
      } catch (e) {
        console.error('❌ [GASTO-MODAL] Error parseando fecha:', e);
      }
    }
    
    if (data.tipo_documento) {
      console.log('📄 [GASTO-MODAL] Tipo documento:', data.tipo_documento);
      setTipoDocumento(data.tipo_documento);
      camposActualizados++;
    }
    
    if (data.numero_factura) {
      console.log('🔢 [GASTO-MODAL] Número factura:', data.numero_factura);
      setNumeroFactura(data.numero_factura);
      camposActualizados++;
    }
    
    
    if (data.proveedor) {
      console.log('🏢 [GASTO-MODAL] Proveedor:', data.proveedor);
      setProveedor(data.proveedor);
      camposActualizados++;
    }
    
    if (data.proveedor_cif) {
      console.log('🆔 [GASTO-MODAL] CIF:', data.proveedor_cif);
      setProveedorCif(data.proveedor_cif);
      camposActualizados++;
    }
    
    if (data.descripcion) {
      console.log('📝 [GASTO-MODAL] Descripción:', data.descripcion);
      setDescripcion(data.descripcion);
      camposActualizados++;
    }
    
    if (data.categoria) {
      console.log('🏷️ [GASTO-MODAL] Categoría:', data.categoria);
      setCategoria(data.categoria);
      camposActualizados++;
    }
    
    if (data.metodo_pago) {
      console.log('💳 [GASTO-MODAL] Método pago:', data.metodo_pago);
      setMetodoPago(data.metodo_pago);
      camposActualizados++;
    }
    
    // Campos numéricos
    if (data.base_imponible) {
      console.log('💰 [GASTO-MODAL] Base imponible:', data.base_imponible);
      setBaseImponible(data.base_imponible.toString());
      camposActualizados++;
    }
    
    if (data.iva_porcentaje) {
      console.log('📊 [GASTO-MODAL] IVA %:', data.iva_porcentaje);
      setIvaPorcentaje(data.iva_porcentaje.toString());
      camposActualizados++;
    }
    
    if (data.iva_importe) {
      console.log('💶 [GASTO-MODAL] IVA importe:', data.iva_importe);
      setIvaImporte(data.iva_importe.toString());
      camposActualizados++;
    }
    
    if (data.total) {
      console.log('💵 [GASTO-MODAL] Total:', data.total);
      setTotal(data.total.toString());
      camposActualizados++;
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ [GASTO-MODAL] Auto-relleno completado: ${camposActualizados} campos actualizados`);
    console.log('═══════════════════════════════════════════════════════');
    
    // ✅ NOTIFICACIÓN VISUAL DE ÉXITO
    toast.success(
      `✅ Formulario auto-rellenado\n📊 ${camposActualizados} campos actualizados`,
      { id: 'auto-fill', duration: 3000 }
    );
  };
  
  useEffect(() => {
    if (open) {
      loadVehicles();
      loadSuppliers();
      
      if (gastoToEdit) {
        // Editar gasto existente
        setFecha(new Date(gastoToEdit.fecha));
        setTipoDocumento(gastoToEdit.tipo_documento);
        setNumeroFactura(gastoToEdit.numero_factura || '');
        setProveedor(gastoToEdit.proveedor || '');
        setProveedorCif(gastoToEdit.proveedor_cif || '');
        setCategoria(gastoToEdit.categoria);
        setDescripcion(gastoToEdit.descripcion);
        setBaseImponible(gastoToEdit.base_imponible?.toString() || '');
        setIvaPorcentaje(gastoToEdit.iva_porcentaje?.toString() || '21');
        setIvaImporte(gastoToEdit.iva_importe?.toString() || '');
        setTotal(gastoToEdit.total.toString());
        setMetodoPago(gastoToEdit.metodo_pago);
        setVehicleId(gastoToEdit.vehicle_id?.toString() || '');
      } else {
        // Nuevo gasto - resetear campos
        resetForm();
      }
    }
  }, [open, gastoToEdit]);
  
  const resetForm = () => {
    setFecha(new Date());
    setTipoDocumento('TICKET');
    setNumeroFactura('');
    setProveedor('');
    setProveedorCif('');
    setCategoria('Mantenimiento');
    setDescripcion('');
    setBaseImponible('');
    setIvaPorcentaje('21');
    setIvaImporte('');
    setTotal('');
    setMetodoPago('EFECTIVO');
    setVehicleId('');
    setSelectedFile(null); // Limpiar archivo
  };
  
  const loadVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (response?.ok) {
        const data = await response.json();
        // El API devuelve directamente el array de vehículos
        setVehicles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };
  
  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response?.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };
  
  // Calcular IVA automáticamente
  useEffect(() => {
    if (tipoDocumento === 'FACTURA' && baseImponible && ivaPorcentaje) {
      const base = parseFloat(baseImponible);
      const iva = parseFloat(ivaPorcentaje);
      if (!isNaN(base) && !isNaN(iva)) {
        const ivaCalc = base * (iva / 100);
        setIvaImporte(ivaCalc.toFixed(2));
        setTotal((base + ivaCalc).toFixed(2));
      }
    }
  }, [tipoDocumento, baseImponible, ivaPorcentaje]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }
    
    if (!total || parseFloat(total) <= 0) {
      alert('El importe total debe ser mayor a 0');
      return;
    }
    
    if (tipoDocumento === 'FACTURA') {
      if (!proveedor.trim()) {
        alert('El proveedor es obligatorio para facturas');
        return;
      }
      if (!numeroFactura.trim()) {
        alert('El número de factura es obligatorio');
        return;
      }
      if (!baseImponible || parseFloat(baseImponible) <= 0) {
        alert('La base imponible es obligatoria para facturas');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // ✅ NUEVO: Usar FormData para subir archivo junto con datos
      const formData = new FormData();
      
      formData.append('fecha', fecha.toISOString());
      formData.append('tipo_documento', tipoDocumento);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('total', total);
      formData.append('metodo_pago', metodoPago);
      
      if (vehicleId) {
        formData.append('vehicle_id', vehicleId);
      }
      
      // Campos específicos de factura
      if (tipoDocumento === 'FACTURA') {
        formData.append('numero_factura', numeroFactura);
        formData.append('proveedor', proveedor);
        formData.append('proveedor_cif', proveedorCif);
        formData.append('base_imponible', baseImponible);
        formData.append('iva_porcentaje', ivaPorcentaje);
      }
      
      // Adjuntar archivo si existe
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const url = gastoToEdit ? `/api/gastos/${gastoToEdit.id}` : '/api/gastos';
      const method = gastoToEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData // Ya no enviamos JSON, enviamos FormData
      });
      
      if (!response?.ok) {
        const error = await response?.json();
        throw new Error(error?.error || 'Error al guardar el gasto');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving gasto:', error);
      alert(error?.message || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {gastoToEdit ? 'Editar Gasto' : 'Nuevo Gasto'}
          </DialogTitle>
        </DialogHeader>
        
        {/* ✅ NUEVO: Pestañas para escanear o rellenar manualmente */}
        {/* ✅ NUEVO: Escáner siempre visible arriba, sin tabs ni selección previa */}
        {!gastoToEdit && (
          <div className="mb-6">
            <InvoiceDocumentManagement
              onExtractedDataChange={handleExtractedData}
              onFileSelect={setSelectedFile}
            />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha del Gasto *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? format(fecha, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={(date) => date && setFecha(date)}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label>Tipo de Documento *</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TICKET">Ticket / Recibo</SelectItem>
                <SelectItem value="FACTURA">Factura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Categoría */}
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Combustible">🛢️ Combustible</SelectItem>
                <SelectItem value="Mantenimiento">🔧 Mantenimiento</SelectItem>
                <SelectItem value="Alquiler/Renting motos">🛵 Alquiler/Renting motos</SelectItem>
                <SelectItem value="Repuestos">⚙️ Repuestos</SelectItem>
                <SelectItem value="Alquiler">🏢 Alquiler</SelectItem>
                <SelectItem value="Seguros">🛡️ Seguros</SelectItem>
                <SelectItem value="Limpieza">🧹 Limpieza</SelectItem>
                <SelectItem value="Suministros">💡 Suministros</SelectItem>
                <SelectItem value="Administración">📋 Administración</SelectItem>
                <SelectItem value="Marketing y Publicidad">📢 Marketing y Publicidad</SelectItem>
                <SelectItem value="Personal">👥 Personal</SelectItem>
                <SelectItem value="Asesoría">💼 Asesoría</SelectItem>
                <SelectItem value="Otros">📦 Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción / Concepto *</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cambio de aceite, Combustible, etc."
              rows={2}
            />
          </div>
          
          {/* Vehículo (opcional) */}
          <div className="space-y-2">
            <Label>Vehículo Asociado (opcional)</Label>
            <Select value={vehicleId || "none"} onValueChange={(value) => setVehicleId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ninguno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Campos específicos para FACTURA */}
          {tipoDocumento === 'FACTURA' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Factura *</Label>
                  <Input
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    placeholder="Ej: F-2024-001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Input
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    placeholder="Escribe o selecciona un proveedor"
                    list="proveedores-list"
                  />
                  <datalist id="proveedores-list">
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>CIF/NIF del Proveedor *</Label>
                <Input
                  value={proveedorCif}
                  onChange={(e) => setProveedorCif(e.target.value)}
                  placeholder="Ej: B12345678 o 12345678A"
                  className={!proveedorCif && tipoDocumento === 'FACTURA' ? 'border-orange-300' : ''}
                />
                {!proveedorCif && tipoDocumento === 'FACTURA' && (
                  <p className="text-xs text-orange-600">
                    ⚠️ El CIF/NIF es obligatorio para facturas (requerido por Hacienda)
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Base Imponible *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseImponible}
                    onChange={(e) => setBaseImponible(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>IVA % *</Label>
                  <Select value={ivaPorcentaje} onValueChange={setIvaPorcentaje}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="4">4%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>IVA Importe</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ivaImporte}
                    readOnly
                    className="bg-gray-50"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Total */}
          <div className="space-y-2">
            <Label>Total del Gasto * (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0.00"
              readOnly={tipoDocumento === 'FACTURA'}
              className={tipoDocumento === 'FACTURA' ? 'bg-gray-50' : ''}
            />
          </div>
          
          {/* Método de Pago */}
          <div className="space-y-2">
            <Label>Método de Pago *</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TPV_SUMUP">TPV SumUp</SelectItem>
                <SelectItem value="TPV_UNICAJA">TPV Unicaja</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                gastoToEdit ? 'Actualizar Gasto' : 'Crear Gasto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
