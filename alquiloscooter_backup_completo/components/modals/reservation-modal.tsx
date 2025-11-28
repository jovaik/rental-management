

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload, X } from 'lucide-react';

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  status: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: any) => void;
  selectedDate?: Date;
  vehicles?: Vehicle[];
  existingEvents?: any[];
}

export function ReservationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate,
  vehicles = [],
  existingEvents = []
}: ReservationModalProps) {
  const [formData, setFormData] = useState({
    // Datos del cliente
    fullName: '',
    phone: '',
    email: '',
    permanentAddress: '',
    
    // Datos de la reserva
    vehicleId: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    
    // Documentos (archivos locales para demostración)
    driverLicense: null as File | null,
    idDocument: null as File | null,
    
    // Notas
    notes: ''
  });

  // Actualizar fecha inicial cuando se selecciona un día
  useEffect(() => {
    if (isOpen && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr
      }));
    }
  }, [isOpen, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear objeto de reserva
    const reservation = {
      id: Date.now(),
      title: `Alquiler - ${formData.fullName}`,
      event_type: 'rental',
      start_datetime: new Date(`${formData.startDate}T${formData.startTime}`),
      end_datetime: new Date(`${formData.endDate}T${formData.endTime}`),
      status: 'confirmed',
      
      // Datos del cliente
      customer: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        permanentAddress: formData.permanentAddress
      },
      
      // Documentos (en una implementación real se subirían a S3)
      documents: {
        driverLicense: formData.driverLicense?.name || null,
        idDocument: formData.idDocument?.name || null
      },
      
      // Vehículo asignado
      vehicleId: parseInt(formData.vehicleId),
      car: vehicles.find(v => v.id === parseInt(formData.vehicleId)),
      
      notes: formData.notes,
      color: '#10B981'
    };

    onSave(reservation);
    onClose();
    
    // Resetear formulario
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      permanentAddress: '',
      vehicleId: '',
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '18:00',
      driverLicense: null,
      idDocument: null,
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  // Función para verificar si un vehículo está disponible en las fechas seleccionadas
  const isVehicleAvailable = (vehicleId: number, startDate: string, endDate: string) => {
    if (!startDate || !endDate) return true;
    
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    
    // Buscar eventos de reserva existentes para este vehículo
    const vehicleEvents = existingEvents.filter(event => 
      event.vehicleId === vehicleId || (event.car && event.car.id === vehicleId)
    );
    
    // Verificar si hay conflicto con algún evento existente
    for (const event of vehicleEvents) {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      // Verificar solapamiento de fechas
      if (
        (requestStart >= eventStart && requestStart <= eventEnd) ||
        (requestEnd >= eventStart && requestEnd <= eventEnd) ||
        (requestStart <= eventStart && requestEnd >= eventEnd)
      ) {
        return false; // Hay conflicto
      }
    }
    
    return true; // No hay conflicto
  };

  // Calcular vehículos disponibles dinámicamente
  const availableVehicles = vehicles.filter(v => 
    v.status === 'available' && 
    isVehicleAvailable(v.id, formData.startDate, formData.endDate)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Nueva Reserva de Alquiler
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Cliente */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-4">Datos del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Juan Pérez García"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+34 600 123 456"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="cliente@email.com"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="permanentAddress">Dirección Permanente (País de Residencia) *</Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  placeholder="Calle Principal 123, Madrid, España"
                  rows={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* Datos de la Reserva */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-4">Detalles de la Reserva</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleId">Vehículo *</Label>
                {formData.startDate && formData.endDate && (
                  <p className="text-xs text-blue-600 mb-2">
                    ℹ️ La disponibilidad se actualiza automáticamente según las fechas seleccionadas
                  </p>
                )}
                <Select value={formData.vehicleId} onValueChange={(value) => handleInputChange('vehicleId', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status === 'available').length === 0 ? (
                      <SelectItem value="no-vehicles" disabled>
                        No hay vehículos disponibles
                      </SelectItem>
                    ) : (
                      vehicles.filter(v => v.status === 'available').map(vehicle => {
                        const isAvailable = isVehicleAvailable(vehicle.id, formData.startDate, formData.endDate);
                        return (
                          <SelectItem 
                            key={vehicle.id} 
                            value={vehicle.id.toString()}
                            disabled={!isAvailable}
                          >
                            {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                            {!isAvailable && ' (No disponible en estas fechas)'}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div></div>
              
              <div>
                <Label htmlFor="startDate">Fecha Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Fecha Fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="startTime">Hora Recogida</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="endTime">Hora Devolución</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Documentación del Cliente */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-4">Documentación del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverLicense">Carnet de Conducir</Label>
                <div className="mt-2">
                  <input
                    id="driverLicense"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('driverLicense', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('driverLicense')?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.driverLicense ? formData.driverLicense.name : 'Subir Carnet de Conducir'}
                  </Button>
                  {formData.driverLicense && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileChange('driverLicense', null)}
                      className="mt-2"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Quitar archivo
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="idDocument">DNI/Pasaporte</Label>
                <div className="mt-2">
                  <input
                    id="idDocument"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('idDocument')?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.idDocument ? formData.idDocument.name : 'Subir DNI/Pasaporte'}
                  </Button>
                  {formData.idDocument && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileChange('idDocument', null)}
                      className="mt-2"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Quitar archivo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional sobre la reserva..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Crear Reserva
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

