
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: any) => void;
  vehicle?: any;
}

interface PricingGroup {
  id: number;
  name: string;
  description?: string;
}

export function VehicleModal({ isOpen, onClose, onSave, vehicle }: VehicleModalProps) {
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  const [formData, setFormData] = useState({
    registration_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuel_type: 'Gasolina',
    mileage: 0,
    condition_rating: 'Bueno',
    status: 'T',
    notes: '',
    pricing_group_id: null as number | null,
    // Campos de propiedad
    ownership_type: 'owned',
    rental_contract_end: '',
    rental_monthly_payment: 0,
    commission_percentage: 0,
    owner_name: '',
    owner_contact: ''
  });

  // Cargar grupos de tarifas
  useEffect(() => {
    if (isOpen) {
      setLoadingGroups(true);
      fetch('/api/pricing-groups')
        .then(res => {
          if (!res?.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          setPricingGroups(data || []);
        })
        .catch(err => {
          console.error('Error loading pricing groups:', err);
          setPricingGroups([]);
        })
        .finally(() => setLoadingGroups(false));
    }
  }, [isOpen]);

  // Actualizar el formulario cuando cambie el vehículo prop (arregla el bug de edición)
  useEffect(() => {
    if (isOpen) {
      setFormData({
        registration_number: vehicle?.registration_number || '',
        make: vehicle?.make || '',
        model: vehicle?.model || '',
        year: vehicle?.year || new Date().getFullYear(),
        color: vehicle?.color || '',
        fuel_type: vehicle?.fuel_type || 'Gasolina',
        mileage: vehicle?.mileage || 0,
        condition_rating: vehicle?.condition_rating || 'Bueno',
        status: vehicle?.status || 'T',
        notes: vehicle?.notes || '',
        pricing_group_id: vehicle?.pricing_group_id || null,
        // Campos de propiedad
        ownership_type: vehicle?.ownership_type || 'owned',
        rental_contract_end: vehicle?.rental_contract_end || '',
        rental_monthly_payment: vehicle?.rental_monthly_payment || 0,
        commission_percentage: vehicle?.commission_percentage || 0,
        owner_name: vehicle?.owner_name || '',
        owner_contact: vehicle?.owner_contact || ''
      });
    }
  }, [isOpen, vehicle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: vehicle?.id || Date.now(),
      year: parseInt(formData.year.toString()),
      mileage: parseInt(formData.mileage.toString())
    });
    onClose();
  };

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registration">Matrícula *</Label>
              <Input
                id="registration"
                value={formData.registration_number}
                onChange={(e) => handleInputChange('registration_number', e.target.value)}
                placeholder="1234ABC"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="make">Marca *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="Toyota"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Corolla"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>
            
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Blanco"
              />
            </div>
            
            <div>
              <Label htmlFor="fuel_type">Combustible</Label>
              <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                  <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="mileage">Kilometraje</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => handleInputChange('mileage', parseInt(e.target.value))}
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="pricing_group">Grupo de Tarifas</Label>
              <Select 
                value={formData.pricing_group_id?.toString() || "none"} 
                onValueChange={(value) => handleInputChange('pricing_group_id', value === "none" ? null : parseInt(value))}
                disabled={loadingGroups}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingGroups ? "Cargando..." : "Seleccionar grupo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin grupo asignado</SelectItem>
                  {pricingGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                      {group.description && (
                        <span className="text-xs text-gray-500 ml-2">- {group.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="condition">Estado</Label>
              <Select value={formData.condition_rating} onValueChange={(value) => handleInputChange('condition_rating', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excelente">Excelente</SelectItem>
                  <SelectItem value="Bueno">Bueno</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Necesita reparación">Necesita reparación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T">Activo</SelectItem>
                  <SelectItem value="F">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sección de Propiedad */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Información de Propiedad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <Label htmlFor="ownership_type">Tipo de Propiedad</Label>
                <Select 
                  value={formData.ownership_type} 
                  onValueChange={(value) => handleInputChange('ownership_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">🏠 Propio</SelectItem>
                    <SelectItem value="renting">📄 Renting</SelectItem>
                    <SelectItem value="commission">🤝 Cesión a Comisión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos para Renting */}
              {formData.ownership_type === 'renting' && (
                <>
                  <div>
                    <Label htmlFor="rental_contract_end">Fin del Contrato</Label>
                    <Input
                      id="rental_contract_end"
                      type="date"
                      value={formData.rental_contract_end}
                      onChange={(e) => handleInputChange('rental_contract_end', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rental_monthly_payment">Cuota Mensual (€)</Label>
                    <Input
                      id="rental_monthly_payment"
                      type="number"
                      step="0.01"
                      value={formData.rental_monthly_payment}
                      onChange={(e) => handleInputChange('rental_monthly_payment', parseFloat(e.target.value) || 0)}
                      placeholder="350.00"
                    />
                  </div>
                </>
              )}

              {/* Campos para Cesión a Comisión */}
              {formData.ownership_type === 'commission' && (
                <>
                  <div>
                    <Label htmlFor="owner_name">Propietario</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                      placeholder="Nombre del propietario"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_contact">Contacto del Propietario</Label>
                    <Input
                      id="owner_contact"
                      value={formData.owner_contact}
                      onChange={(e) => handleInputChange('owner_contact', e.target.value)}
                      placeholder="Teléfono o email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_percentage">% Comisión</Label>
                    <Input
                      id="commission_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.commission_percentage}
                      onChange={(e) => handleInputChange('commission_percentage', parseFloat(e.target.value) || 0)}
                      placeholder="30.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Porcentaje que se queda la empresa de las ganancias
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional del vehículo..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {vehicle ? 'Actualizar' : 'Crear'} Vehículo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
