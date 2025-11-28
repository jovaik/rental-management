
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Car, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  owner_user_id: number | null;
  depositor_user_id: number | null;
  status: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export default function AssignVehiclesPage() {
  const { data: session } = useSession() || {};
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [depositors, setDepositors] = useState<User[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('unselected');
  const [selectedDepositor, setSelectedDepositor] = useState<string>('unselected');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('unassigned');

  // Cargar vehículos y usuarios
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📡 [Asignación] Cargando datos desde el servidor...');
      
      // Cargar todos los vehículos (sin filtro de rol) - SIN CACHÉ
      const vehiclesRes = await fetch('/api/vehicles/all', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const vehiclesData = await vehiclesRes.json();
      console.log(`✅ [Asignación] ${vehiclesData.length} vehículos cargados`);
      setVehicles(vehiclesData);

      // Cargar propietarios y cesionarios - SIN CACHÉ
      const usersRes = await fetch('/api/users/owners-depositors', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const usersData = await usersRes.json();
      console.log(`✅ [Asignación] ${usersData.owners?.length || 0} propietarios y ${usersData.depositors?.length || 0} cesionarios cargados`);
      setOwners(usersData.owners || []);
      setDepositors(usersData.depositors || []);
    } catch (error) {
      console.error('❌ [Asignación] Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar vehículos según el filtro seleccionado
  const filteredVehicles = vehicles.filter(vehicle => {
    if (filter === 'unassigned') {
      return !vehicle.owner_user_id && !vehicle.depositor_user_id;
    } else if (filter === 'assigned') {
      return vehicle.owner_user_id || vehicle.depositor_user_id;
    }
    return true; // 'all'
  });

  // Seleccionar/deseleccionar vehículo
  const toggleVehicle = (vehicleId: number) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  // Seleccionar/deseleccionar todos
  const toggleAll = () => {
    if (selectedVehicles.length === filteredVehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(filteredVehicles.map(v => v.id));
    }
  };

  // Asignar vehículos seleccionados
  const assignVehicles = async () => {
    if (selectedVehicles.length === 0) {
      toast.error('Selecciona al menos un vehículo');
      return;
    }

    // Validar que se haya seleccionado algo válido (no 'unselected' ni vacío)
    const hasValidOwner = selectedOwner && selectedOwner !== 'unselected' && selectedOwner !== '';
    const hasValidDepositor = selectedDepositor && selectedDepositor !== 'unselected' && selectedDepositor !== '';
    
    if (!hasValidOwner && !hasValidDepositor) {
      toast.error('Selecciona un propietario o cesionario');
      return;
    }

    console.log('🚀 [Asignación] Iniciando asignación masiva...');
    console.log('📦 [Asignación] Vehículos seleccionados:', selectedVehicles);
    console.log('👤 [Asignación] Propietario seleccionado:', selectedOwner);
    console.log('📝 [Asignación] Cesionario seleccionado:', selectedDepositor);

    setAssigning(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      const promises = selectedVehicles.map(async (vehicleId) => {
        const updateData: any = {};
        if (selectedOwner && selectedOwner !== 'none' && selectedOwner !== 'unselected') {
          updateData.owner_user_id = parseInt(selectedOwner);
        }
        if (selectedDepositor && selectedDepositor !== 'none' && selectedDepositor !== 'unselected') {
          updateData.depositor_user_id = parseInt(selectedDepositor);
        }

        console.log(`🔄 [Asignación] Enviando actualización para vehículo ${vehicleId}:`, JSON.stringify(updateData, null, 2));

        try {
          const res = await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
            cache: 'no-store' // ✅ CRÍTICO: No usar caché
          });
          
          const data = await res.json();
          console.log(`📥 [Asignación] Respuesta para vehículo ${vehicleId}:`, JSON.stringify(data, null, 2));
          
          if (!res.ok) {
            console.error(`❌ [Asignación] Error HTTP en vehículo ${vehicleId}:`, data);
            errorCount++;
            throw new Error(`Error al actualizar vehículo ${vehicleId}: ${data.error || 'Unknown error'}`);
          }
          
          console.log(`✅ [Asignación] Vehículo ${vehicleId} actualizado exitosamente`);
          successCount++;
          return data;
        } catch (err: any) {
          console.error(`❌ [Asignación] Excepción en vehículo ${vehicleId}:`, err.message);
          errorCount++;
          throw err;
        }
      });

      const results = await Promise.all(promises);
      console.log('✅ [Asignación] Todas las actualizaciones completadas:', results);
      console.log(`📊 [Asignación] Resumen: ${successCount} exitosos, ${errorCount} errores`);
      
      // ✅ CRÍTICO: Recargar datos SIN caché
      console.log('🔄 [Asignación] Recargando datos del servidor...');
      setSelectedVehicles([]);
      setSelectedOwner('unselected');
      setSelectedDepositor('unselected');
      
      // Esperar un momento para que la BD se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await loadData();
      console.log('✅ [Asignación] Datos recargados desde el servidor');
      
      toast.success(`${successCount} vehículo(s) asignado(s) correctamente`);
    } catch (error: any) {
      console.error('❌ [Asignación] Error en proceso de asignación:', error.message);
      toast.error(`Error al asignar vehículos: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // Obtener el nombre del usuario asignado
  const getOwnerName = (ownerId: number | null) => {
    if (!ownerId) return null;
    const owner = owners.find(o => o.id === ownerId);
    return owner ? `${owner.firstname} ${owner.lastname}` : `ID: ${ownerId}`;
  };

  const getDepositorName = (depositorId: number | null) => {
    if (!depositorId) return null;
    const depositor = depositors.find(d => d.id === depositorId);
    return depositor ? `${depositor.firstname} ${depositor.lastname}` : `ID: ${depositorId}`;
  };

  if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <p>No tienes permisos para acceder a esta página</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Cargando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Asignación Masiva de Vehículos</h1>
        <p className="text-gray-600 mt-2">
          Asigna múltiples vehículos a propietarios o cesionarios de una vez
        </p>
      </div>

      {/* Panel de Asignación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Asignar a Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Propietario
              </label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar propietario..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unselected">-- Seleccionar --</SelectItem>
                  <SelectItem value="none">Sin propietario</SelectItem>
                  {owners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id.toString()}>
                      {owner.firstname} {owner.lastname} - {owner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cesionario (Opcional)
              </label>
              <Select value={selectedDepositor} onValueChange={setSelectedDepositor}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cesionario..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unselected">-- Seleccionar --</SelectItem>
                  <SelectItem value="none">Sin cesionario</SelectItem>
                  {depositors.map(depositor => (
                    <SelectItem key={depositor.id} value={depositor.id.toString()}>
                      {depositor.firstname} {depositor.lastname} - {depositor.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={assignVehicles}
              disabled={selectedVehicles.length === 0 || assigning}
              className="flex-1"
            >
              {assigning ? 'Asignando...' : `Asignar ${selectedVehicles.length} vehículo(s)`}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedVehicles([])}
              disabled={selectedVehicles.length === 0}
            >
              Limpiar selección
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vehículos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehículos Disponibles ({filteredVehicles.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  <SelectItem value="assigned">Asignados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedVehicles.length === filteredVehicles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay vehículos disponibles con este filtro
              </div>
            ) : (
              filteredVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedVehicles.includes(vehicle.id) ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={() => toggleVehicle(vehicle.id)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {vehicle.registration_number || 'Sin matrícula'}
                      </span>
                      <span className="text-gray-600">
                        {vehicle.make} {vehicle.model}
                      </span>
                      {vehicle.status === 'T' ? (
                        <Badge variant="default" className="bg-green-600">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      {vehicle.owner_user_id ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Propietario: {getOwnerName(vehicle.owner_user_id)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin propietario</span>
                      )}
                      
                      {vehicle.depositor_user_id && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          Cesionario: {getDepositorName(vehicle.depositor_user_id)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
