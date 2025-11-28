
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (maintenance: any) => void;
  maintenance?: any;
  vehicleId?: number; // Para cuando se abre desde el modal de vehículo
}

export function MaintenanceModal({ isOpen, onClose, onSave, maintenance, vehicleId }: MaintenanceModalProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: maintenance?.title || '',
    maintenance_type: maintenance?.maintenance_type || 'preventive',
    scheduled_date: maintenance?.scheduled_date ? new Date(maintenance.scheduled_date).toISOString().split('T')[0] : '',
    priority: maintenance?.priority || 'medium',
    vehicle_id: vehicleId?.toString() || maintenance?.vehicle?.id?.toString() || '',
    workshop_id: maintenance?.workshop_id?.toString() || '',
    workshop_location: maintenance?.workshop_location || '',
    mileage_at_maintenance: maintenance?.mileage_at_maintenance || '',
    description: maintenance?.description || ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form data when opening modal
      if (!maintenance) {
        setFormData({
          title: '',
          maintenance_type: 'preventive',
          scheduled_date: '',
          priority: 'medium',
          vehicle_id: vehicleId?.toString() || '',
          workshop_id: '',
          workshop_location: '',
          mileage_at_maintenance: '',
          description: ''
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (vehicleId) {
      setFormData(prev => ({ ...prev, vehicle_id: vehicleId.toString() }));
    }
  }, [vehicleId]);
  
  useEffect(() => {
    // Update form data when maintenance prop changes
    if (maintenance) {
      setFormData({
        title: maintenance.title || '',
        maintenance_type: maintenance.maintenance_type || 'preventive',
        scheduled_date: maintenance.scheduled_date ? new Date(maintenance.scheduled_date).toISOString().split('T')[0] : '',
        priority: maintenance.priority || 'medium',
        vehicle_id: vehicleId?.toString() || maintenance.vehicle?.id?.toString() || '',
        workshop_id: maintenance.workshop_id?.toString() || '',
        workshop_location: maintenance.workshop_location || '',
        mileage_at_maintenance: maintenance.mileage_at_maintenance || '',
        description: maintenance.description || ''
      });
    }
  }, [maintenance, vehicleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar vehículos desde la API
      const vehiclesResponse = await fetch('/api/vehicles');
      if (vehiclesResponse?.ok) {
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData);
      }
      
      // Cargar talleres desde la API
      const workshopsResponse = await fetch('/api/workshops');
      if (workshopsResponse?.ok) {
        const workshopsData = await workshopsResponse.json();
        setWorkshops(workshopsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVehicle = vehicles.find(v => v.id == formData.vehicle_id);
    const selectedWorkshop = workshops.find(w => w.id == formData.workshop_id);
    
    // Preparar workshop_id: null si no está seleccionado o si es "no_workshop"
    let workshopId = null;
    if (formData.workshop_id && formData.workshop_id !== '' && formData.workshop_id !== 'no_workshop') {
      const parsed = parseInt(formData.workshop_id);
      if (!isNaN(parsed)) {
        workshopId = parsed;
      }
    }
    
    // Preparar mileage_at_maintenance: null si no está especificado
    let mileage = null;
    if (formData.mileage_at_maintenance && formData.mileage_at_maintenance !== '') {
      const parsed = parseInt(formData.mileage_at_maintenance.toString());
      if (!isNaN(parsed)) {
        mileage = parsed;
      }
    }
    
    await onSave({
      ...formData,
      car_id: vehicleId || parseInt(formData.vehicle_id),
      id: maintenance?.id,
      scheduled_date: new Date(formData.scheduled_date),
      status: maintenance?.status || 'scheduled',
      workshop_id: workshopId,
      mileage_at_maintenance: mileage,
      vehicle: selectedVehicle ? {
        id: selectedVehicle.id,
        registration_number: selectedVehicle.registration_number,
        make: selectedVehicle.make,
        model: selectedVehicle.model
      } : null,
      workshop: selectedWorkshop
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {maintenance ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!maintenance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Información:</strong> Después de crear el mantenimiento, podrás agregar los gastos detallados línea a línea (repuestos, mano de obra, etc.) con sus costes individuales.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título del mantenimiento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Cambio de aceite y filtros"
                required
              />
            </div>
            
            {!vehicleId && (
              <div>
                <Label htmlFor="vehicle">Vehículo *</Label>
                <Select 
                  value={formData.vehicle_id.toString()} 
                  onValueChange={(value) => handleInputChange('vehicle_id', value)} 
                  required
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Cargando vehículos..." : "Seleccionar vehículo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="type">Tipo de mantenimiento</Label>
              <Select value={formData.maintenance_type} onValueChange={(value) => handleInputChange('maintenance_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="emergency">Emergencia</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="scheduled_date">Fecha programada *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="mileage">Kilometraje (km)</Label>
              <Input
                id="mileage"
                type="number"
                min="0"
                value={formData.mileage_at_maintenance}
                onChange={(e) => handleInputChange('mileage_at_maintenance', e.target.value)}
                placeholder="Ej: 5000"
              />
              <p className="text-xs text-gray-500 mt-1">Importante para revisiones periódicas</p>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="workshop">Taller</Label>
              <Select 
                value={formData.workshop_id.toString() || "no_workshop"} 
                onValueChange={(value) => handleInputChange('workshop_id', value === "no_workshop" ? "" : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Cargando talleres..." : "Seleccionar taller (opcional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_workshop">Sin asignar</SelectItem>
                  {workshops.map(workshop => (
                    <SelectItem key={workshop.id} value={workshop.id.toString()}>
                      {workshop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="workshop_location">Ubicación del taller (opcional)</Label>
              <Input
                id="workshop_location"
                value={formData.workshop_location}
                onChange={(e) => handleInputChange('workshop_location', e.target.value)}
                placeholder="Dirección o ubicación específica"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Descripción detallada</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe los trabajos a realizar..."
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              {maintenance ? 'Actualizar' : 'Crear'} Mantenimiento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
