
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  ownership_type: string;
  owner_name?: string;
  commission_percentage?: number;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface BusinessLocation {
  id: number;
  name: string;
  address?: string;
}

export default function BulkAssignVehiclesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    owner_user_id: '',
    commission_percentage: '20',
    monthly_fixed_costs: '0',
    current_business_location_id: '',
  });

  // Log para debugging
  useEffect(() => {
    console.log('📋 Estado actual del formulario:', formData);
  }, [formData]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = session?.user?.role;
      if (userRole !== 'super_admin') {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/');
        return;
      }
      loadData();
    }
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar vehículos
      console.log('🔄 Cargando vehículos...');
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        console.log(`✅ Vehículos cargados: ${data.length}`);
        setVehicles(data);
      } else {
        console.error('❌ Error al cargar vehículos:', vehiclesRes.status);
      }

      // Cargar propietarios
      console.log('🔄 Cargando propietarios...');
      const ownersRes = await fetch('/api/users/owners-depositors');
      if (ownersRes.ok) {
        const data = await ownersRes.json();
        console.log(`✅ Propietarios cargados:`, data.owners);
        setOwners(data.owners || []);
        if (!data.owners || data.owners.length === 0) {
          console.warn('⚠️  No se encontraron propietarios activos');
          toast.error('No hay propietarios activos disponibles. Por favor, crea un usuario con rol "propietario" primero.');
        }
      } else {
        console.error('❌ Error al cargar propietarios:', ownersRes.status);
      }

      // Cargar ubicaciones
      console.log('🔄 Cargando ubicaciones...');
      const locationsRes = await fetch('/api/business-locations');
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        console.log(`✅ Ubicaciones cargadas: ${data.length}`);
        setLocations(data || []);
      } else {
        console.error('❌ Error al cargar ubicaciones:', locationsRes.status);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVehicle = (vehicleId: number) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map((v) => v.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Iniciando asignación masiva...');
    console.log('   - Vehículos seleccionados:', selectedVehicles);
    console.log('   - Datos del formulario:', formData);

    if (selectedVehicles.length === 0) {
      console.error('❌ No hay vehículos seleccionados');
      toast.error('Debes seleccionar al menos un vehículo');
      return;
    }

    if (!formData.owner_user_id || formData.owner_user_id === '') {
      console.error('❌ No hay propietario seleccionado');
      toast.error('Debes seleccionar un propietario');
      return;
    }

    setSubmitting(true);
    console.log('🔄 Estado de submitting cambiado a true');
    
    try {
      const payload = {
        vehicle_ids: selectedVehicles,
        owner_user_id: formData.owner_user_id,
        commission_percentage: formData.commission_percentage,
        monthly_fixed_costs: formData.monthly_fixed_costs,
        current_business_location_id: formData.current_business_location_id || null,
      };
      
      console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));
      console.log('📍 URL destino: /api/vehicles/bulk-assign');
      console.log('⏰ Timestamp:', new Date().toISOString());

      const response = await fetch('/api/vehicles/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      const result = await response.json();
      console.log('📥 Respuesta del servidor:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('❌ Error en la respuesta:', result);
        throw new Error(result.error || 'Error al asignar vehículos');
      }

      console.log('✅ Asignación exitosa:', result);
      console.log('🔄 Mostrando toast de éxito...');
      toast.success(`✅ ${result.message || 'Vehículos asignados correctamente'}`, {
        duration: 5000
      });
      
      // Mostrar alert adicional para confirmar visualmente
      alert(`✅ ÉXITO\n\n${result.message}\n\n` + 
            `Vehículos actualizados: ${result.count}\n` +
            `Propietario: ${result.owner?.name}\n\n` +
            `Los datos se recargarán ahora...`);
      
      console.log('🔄 Limpiando estado del formulario...');
      setSelectedVehicles([]);
      setFormData({
        owner_user_id: '',
        commission_percentage: '20',
        monthly_fixed_costs: '0',
        current_business_location_id: '',
      });
      
      console.log('🔄 Recargando datos de vehículos...');
      await loadData();
      console.log('✅ Datos recargados exitosamente');
      
      // Confirmar que se recargaron los datos
      alert(`✅ DATOS RECARGADOS\n\nLa lista de vehículos se ha actualizado correctamente.`);
      
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Stack trace:', error.stack);
      toast.error(`❌ ${error.message || 'Error al asignar vehículos'}`, {
        duration: 5000
      });
    } finally {
      console.log('🔄 Estado de submitting cambiado a false');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/vehicles')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Vehículos
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Asignación Masiva de Vehículos</h1>
        <p className="text-muted-foreground">
          Asigna múltiples vehículos a un propietario de una vez
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Asignación */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Datos de Asignación</CardTitle>
            <CardDescription>
              Configura los detalles para todos los vehículos seleccionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="owner_user_id">Propietario *</Label>
                <Select
                  value={formData.owner_user_id}
                  onValueChange={(value) => {
                    console.log('✏️  Propietario seleccionado:', value);
                    setFormData({ ...formData, owner_user_id: value });
                  }}
                  disabled={owners.length === 0}
                >
                  <SelectTrigger className={owners.length === 0 ? 'opacity-50' : ''}>
                    <SelectValue placeholder={owners.length === 0 ? "No hay propietarios disponibles" : "Seleccionar propietario..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay propietarios activos
                      </div>
                    ) : (
                      owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id.toString()}>
                          {owner.firstname} {owner.lastname} ({owner.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {owners.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Debes crear al menos un usuario con rol "propietario" antes de asignar vehículos
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="commission_percentage">% Comisión *</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_percentage: e.target.value })
                  }
                  placeholder="Ej: 20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="monthly_fixed_costs">Gastos Fijos Mensuales (€)</Label>
                <Input
                  id="monthly_fixed_costs"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_fixed_costs}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_fixed_costs: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="current_business_location_id">Ubicación</Label>
                <Select
                  value={formData.current_business_location_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, current_business_location_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin ubicación</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Vehículos seleccionados:</span>
                  <Badge variant={selectedVehicles.length > 0 ? 'default' : 'secondary'}>
                    {selectedVehicles.length}
                  </Badge>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || selectedVehicles.length === 0 || owners.length === 0 || !formData.owner_user_id}
                >
                  {submitting ? 'Asignando...' : owners.length === 0 ? 'No hay propietarios' : 'Asignar Vehículos'}
                </Button>
                {selectedVehicles.length === 0 && owners.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Selecciona al menos un vehículo para continuar
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Vehículos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seleccionar Vehículos</CardTitle>
                <CardDescription>
                  Marca los vehículos que deseas asignar al propietario
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedVehicles.length === vehicles.length
                  ? 'Deseleccionar Todos'
                  : 'Seleccionar Todos'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p>No hay vehículos disponibles</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedVehicles.includes(vehicle.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleToggleVehicle(vehicle.id)}
                  >
                    <Checkbox
                      checked={selectedVehicles.includes(vehicle.id)}
                      onCheckedChange={() => handleToggleVehicle(vehicle.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                      </div>
                      {vehicle.owner_name && (
                        <div className="text-sm text-muted-foreground">
                          Propietario actual: {vehicle.owner_name}
                        </div>
                      )}
                      {vehicle.ownership_type === 'commission' && (
                        <div className="text-xs text-blue-600 font-medium">
                          Comisión: {vehicle.commission_percentage || 0}%
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        vehicle.ownership_type === 'owned'
                          ? 'secondary'
                          : vehicle.ownership_type === 'commission'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {vehicle.ownership_type === 'owned'
                        ? 'Propio'
                        : vehicle.ownership_type === 'commission'
                        ? 'Comisión'
                        : 'Renting'}
                    </Badge>
                    {selectedVehicles.includes(vehicle.id) && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
