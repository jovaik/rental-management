
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Car, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  pricing_group_id?: number | null;
}

interface PricingGroup {
  id: number;
  name: string;
  description?: string;
  vehicle_category: string;
  price_1_3_days: number;
  price_4_7_days: number;
  price_8_plus_days: number;
  price_1_3_days_low?: number | null;
  price_4_7_days_low?: number | null;
  price_8_plus_days_low?: number | null;
  price_monthly_high?: number;
  price_annual_full?: number;
  price_monthly_low?: number;
  min_months_high_season: number;
  min_months_low_season: number;
  min_months_full_year: number;
  low_season_multiplier?: number | null;
  included_km_per_day: number;
  extra_km_charge: number;
  deposit_amount: number;
  vehicles?: Array<{ id: number; registration_number: string; make: string; model: string }>;
}

export default function PricingGroupsTab() {
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PricingGroup | null>(null);
  const [formData, setFormData] = useState<Partial<PricingGroup>>({
    name: '',
    description: '',
    vehicle_category: 'scooter_economy',
    price_1_3_days: 25,
    price_4_7_days: 22,
    price_8_plus_days: 20,
    price_1_3_days_low: 20,
    price_4_7_days_low: 18,
    price_8_plus_days_low: 15,
    price_monthly_high: 500,
    price_monthly_low: 250,
    price_annual_full: 200,
    min_months_high_season: 3,
    min_months_low_season: 1,
    min_months_full_year: 12,
    low_season_multiplier: null,
    included_km_per_day: 100,
    extra_km_charge: 0.10,
    deposit_amount: 200,
  });

  useEffect(() => {
    fetchPricingGroups();
    fetchAllVehicles();
  }, []);

  const fetchPricingGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing-groups');
      if (response?.ok) {
        const data = await response.json();
        console.log('📋 Grupos de tarifas cargados:', data.map((g: PricingGroup) => ({
          id: g.id,
          name: g.name,
          vehiclesCount: g.vehicles?.length || 0,
          vehicles: g.vehicles
        })));
        setPricingGroups(data);
      }
    } catch (error) {
      console.error('Error fetching pricing groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await fetch('/api/vehicles/all');
      if (response?.ok) {
        const data = await response.json();
        setAllVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleOpenDialog = (group?: PricingGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData(group);
      // Cargar los IDs de vehículos ya asignados a este grupo
      setSelectedVehicleIds(group.vehicles?.map(v => v.id) || []);
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        vehicle_category: 'scooter_economy',
        price_1_3_days: 25,
        price_4_7_days: 22,
        price_8_plus_days: 20,
        price_monthly_high: 500,
        price_monthly_low: 250,
        price_annual_full: 200,
        min_months_high_season: 3,
        min_months_low_season: 1,
        min_months_full_year: 12,
        low_season_multiplier: 0.5,
        included_km_per_day: 100,
        extra_km_charge: 0.10,
        deposit_amount: 200,
      });
      setSelectedVehicleIds([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingGroup
        ? `/api/pricing-groups/${editingGroup.id}`
        : '/api/pricing-groups';
      const method = editingGroup ? 'PUT' : 'POST';

      console.log('💾 Guardando grupo de tarifas con vehículos:', {
        groupId: editingGroup?.id,
        selectedVehicleIds,
        vehicleCount: selectedVehicleIds.length
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicle_ids: selectedVehicleIds  // Incluir los IDs de vehículos seleccionados
        }),
      });

      if (response?.ok) {
        const savedGroup = await response.json();
        console.log('✅ Grupo de tarifas guardado con vehículos:', {
          groupId: savedGroup.id,
          vehiclesAssigned: savedGroup.vehicles?.length || 0,
          vehicles: savedGroup.vehicles
        });
        
        // Recargar los datos para reflejar los cambios
        await fetchPricingGroups();
        await fetchAllVehicles(); // Recargar vehículos para actualizar las asignaciones
        setDialogOpen(false);
      } else {
        const error = await response.json();
        console.error('❌ Error al guardar grupo de tarifas:', error);
        alert('Error al guardar: ' + (error.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error al guardar el grupo de tarifas:', error);
      alert('Error al guardar el grupo de tarifas');
    }
  };

  const toggleVehicleSelection = (vehicleId: number) => {
    setSelectedVehicleIds(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este grupo de tarifas?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing-groups/${id}`, {
        method: 'DELETE',
      });

      if (response?.ok) {
        await fetchPricingGroups();
      }
    } catch (error) {
      console.error('Error deleting pricing group:', error);
    }
  };

  const vehicleCategories = [
    { value: 'scooter_economy', label: 'Scooter Económico' },
    { value: 'scooter_premium', label: 'Scooter Premium' },
    { value: 'motorcycle_sport', label: 'Moto Deportiva' },
    { value: 'car_economy', label: 'Coche Económico' },
    { value: 'car_family', label: 'Coche Familiar' },
    { value: 'car_premium', label: 'Coche Premium' },
    { value: 'suv', label: 'SUV' },
    { value: 'van', label: 'Furgoneta' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Define los grupos de tarifas base. Los precios se aplican en temporada alta por defecto.
        </p>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Grupo
        </Button>
      </div>

      {/* Pricing Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pricingGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {group.vehicle_category}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(group)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Daily Rates */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Tarifas Diarias (Temp. Alta)</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-xs text-gray-600">1-3 días</div>
                      <div className="text-lg font-bold text-blue-600">
                        €{Number(group.price_1_3_days).toFixed(0)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-xs text-gray-600">4-7 días</div>
                      <div className="text-lg font-bold text-green-600">
                        €{Number(group.price_4_7_days).toFixed(0)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-xs text-gray-600">8+ días</div>
                      <div className="text-lg font-bold text-purple-600">
                        €{Number(group.price_8_plus_days).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscriptions */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Suscripciones (€/mes)</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="text-xs text-gray-600">Solo T. Alta</div>
                      <div className="text-base font-bold text-orange-600">
                        €{Number(group.price_monthly_high || 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        min. {group.min_months_high_season}m
                      </div>
                    </div>
                    <div className="text-center p-2 bg-cyan-50 rounded">
                      <div className="text-xs text-gray-600">Solo T. Baja</div>
                      <div className="text-base font-bold text-cyan-600">
                        €{Number(group.price_monthly_low || 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        min. {group.min_months_low_season}m
                      </div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-xs text-gray-600">Año Completo</div>
                      <div className="text-base font-bold text-red-600">
                        €{Number(group.price_annual_full || 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        min. {group.min_months_full_year}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarifas Temporada Baja */}
                {(group.price_1_3_days_low || group.price_4_7_days_low || group.price_8_plus_days_low) && (
                  <div className="pt-3 border-t text-sm">
                    <div className="text-gray-600 mb-2 font-medium">Temporada Baja:</div>
                    {group.price_1_3_days_low && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">1-3 días:</span>
                        <Badge variant="outline" className="bg-orange-50">
                          {Number(group.price_1_3_days_low).toFixed(2)}€/día
                        </Badge>
                      </div>
                    )}
                    {group.price_4_7_days_low && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">4-7 días:</span>
                        <Badge variant="outline" className="bg-orange-50">
                          {Number(group.price_4_7_days_low).toFixed(2)}€/día
                        </Badge>
                      </div>
                    )}
                    {group.price_8_plus_days_low && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">8+ días:</span>
                        <Badge variant="outline" className="bg-orange-50">
                          {Number(group.price_8_plus_days_low).toFixed(2)}€/día
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div className="pt-3 border-t text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>KM incluidos/día:</span>
                    <span className="font-medium">{group.included_km_per_day}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cargo KM extra:</span>
                    <span className="font-medium">€{Number(group.extra_km_charge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depósito:</span>
                    <span className="font-medium">€{Number(group.deposit_amount).toFixed(0)}</span>
                  </div>
                </div>

                {/* Assigned Vehicles */}
                {group.vehicles && group.vehicles.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Car className="w-4 h-4 mr-1" />
                      <span className="font-medium">{group.vehicles.length} vehículo{group.vehicles.length !== 1 ? 's' : ''} asignado{group.vehicles.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.vehicles.map((vehicle) => (
                        <Badge key={vehicle.id} variant="outline" className="text-xs">
                          {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {pricingGroups.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay grupos de tarifas configurados
          </h3>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Grupo de Tarifas
          </Button>
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Grupo de Tarifas' : 'Nuevo Grupo de Tarifas'}
            </DialogTitle>
            <DialogDescription>
              Los precios base son para temporada alta. El multiplicador se aplica en temporada baja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Grupo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Grupo 1 - Scooters Económicos"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría de Vehículo *</Label>
                <Select
                  value={formData.vehicle_category}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del grupo"
              />
            </div>

            {/* Daily Rates */}
            <div>
              <h4 className="font-semibold mb-3">Tarifas Diarias (Temporada Alta) *</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>1-3 días (€/día)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_1_3_days}
                    onChange={(e) => setFormData({ ...formData, price_1_3_days: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>4-7 días (€/día)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_4_7_days}
                    onChange={(e) => setFormData({ ...formData, price_4_7_days: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>8+ días (€/día)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_8_plus_days}
                    onChange={(e) => setFormData({ ...formData, price_8_plus_days: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Subscriptions */}
            <div>
              <h4 className="font-semibold mb-3">Suscripciones (€/mes)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Solo Temporada Alta</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_monthly_high || 0}
                    onChange={(e) => setFormData({ ...formData, price_monthly_high: parseFloat(e.target.value) || 0 })}
                  />
                  <Label className="text-xs mt-1">Min. meses</Label>
                  <Input
                    type="number"
                    value={formData.min_months_high_season}
                    onChange={(e) => setFormData({ ...formData, min_months_high_season: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Solo Temporada Baja</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_monthly_low || 0}
                    onChange={(e) => setFormData({ ...formData, price_monthly_low: parseFloat(e.target.value) || 0 })}
                  />
                  <Label className="text-xs mt-1">Min. meses</Label>
                  <Input
                    type="number"
                    value={formData.min_months_low_season}
                    onChange={(e) => setFormData({ ...formData, min_months_low_season: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Año Completo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_annual_full || 0}
                    onChange={(e) => setFormData({ ...formData, price_annual_full: parseFloat(e.target.value) || 0 })}
                  />
                  <Label className="text-xs mt-1">Min. meses</Label>
                  <Input
                    type="number"
                    value={formData.min_months_full_year}
                    onChange={(e) => setFormData({ ...formData, min_months_full_year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Tarifas Temporada Baja */}
            <div>
              <Label className="text-lg font-semibold text-orange-600">Tarifas Temporada Baja (opcional)</Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Define precios exactos para temporada baja. Más fácil que usar multiplicadores. Ejemplo: Si temporada alta es 30€, puedes poner 25€ directamente para temporada baja.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>1-3 días (€/día)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.price_1_3_days_low || ''}
                    onChange={(e) => setFormData({ ...formData, price_1_3_days_low: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder={formData.price_1_3_days ? `Alta: ${formData.price_1_3_days}€` : 'Precio'}
                  />
                </div>
                <div>
                  <Label>4-7 días (€/día)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.price_4_7_days_low || ''}
                    onChange={(e) => setFormData({ ...formData, price_4_7_days_low: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder={formData.price_4_7_days ? `Alta: ${formData.price_4_7_days}€` : 'Precio'}
                  />
                </div>
                <div>
                  <Label>8+ días (€/día)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.price_8_plus_days_low || ''}
                    onChange={(e) => setFormData({ ...formData, price_8_plus_days_low: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder={formData.price_8_plus_days ? `Alta: ${formData.price_8_plus_days}€` : 'Precio'}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Ahorro de tiempo: Establece precios directos sin cálculos. Si dejas vacío, se usará el precio de temporada alta.
              </p>
            </div>

            {/* KM and Charges */}
            <div>
              <h4 className="font-semibold mb-3">Kilometraje y Cargos</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>KM incluidos/día</Label>
                  <Input
                    type="number"
                    value={formData.included_km_per_day}
                    onChange={(e) => setFormData({ ...formData, included_km_per_day: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Cargo KM extra (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.extra_km_charge}
                    onChange={(e) => setFormData({ ...formData, extra_km_charge: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Depósito (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

            {/* Asignación de Vehículos */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Car className="w-4 h-4 mr-2" />
                Asignar Vehículos a este Grupo
              </h4>
              {loadingVehicles ? (
                <div className="text-center py-4 text-gray-500">Cargando vehículos...</div>
              ) : allVehicles.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay vehículos disponibles. Cree vehículos primero desde la sección de Vehículos.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {allVehicles.map((vehicle) => {
                    const isSelected = selectedVehicleIds.includes(vehicle.id);
                    const isAssignedToOther = vehicle.pricing_group_id && 
                                             vehicle.pricing_group_id !== editingGroup?.id;
                    
                    return (
                      <div
                        key={vehicle.id}
                        className={`flex items-center space-x-3 p-2 rounded hover:bg-gray-50 ${
                          isAssignedToOther ? 'opacity-50' : ''
                        }`}
                      >
                        <Checkbox
                          id={`vehicle-${vehicle.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleVehicleSelection(vehicle.id)}
                          disabled={!!isAssignedToOther}
                        />
                        <Label
                          htmlFor={`vehicle-${vehicle.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">{vehicle.registration_number}</span>
                          <span className="text-gray-500 ml-2">
                            {vehicle.make} {vehicle.model}
                          </span>
                          {isAssignedToOther && (
                            <span className="ml-2 text-xs text-orange-600">
                              (Asignado a otro grupo)
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 text-sm text-gray-600">
                <strong>{selectedVehicleIds.length}</strong> vehículo(s) seleccionado(s)
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
