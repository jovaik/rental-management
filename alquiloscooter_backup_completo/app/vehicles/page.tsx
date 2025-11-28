
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Plus, Search, Filter, MapPin, Fuel, Calendar, Settings, Bike, Ship, Truck, Zap, Waves, Trash2, Download, Upload, Users } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';
import { VehicleModal } from '@/components/modals/vehicle-modal';
import { VehicleDetailsModal } from '@/components/modals/vehicle-details-modal';
import { PermissionGuard } from '@/components/role-guard';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Vehicle {
  id: number;
  registration_number?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  status?: string;
  fuel_type?: string;
  condition_rating?: string;
  pricing_group_id?: number;
  vin?: string;
  
  // Insurance
  insurance_policy?: string;
  insurance_start_date?: string;
  insurance_expiry?: string;
  insurance_policy_type?: string;
  insurance_active?: boolean;
  
  // ITV
  itv_valid?: boolean;
  last_itv_date?: string;
  itv_expiry?: string;
  
  // Ownership
  ownership_type?: string;
  rental_contract_end?: string;
  rental_monthly_payment?: number;
  commission_percentage?: number;
  owner_name?: string;
  owner_contact?: string;
  owner_user_id?: number | null;
  depositor_user_id?: number | null;
  
  // Valuation
  purchase_price?: number;
  market_value?: number;
  sale_price?: number;
  
  // Additional fields
  document_status?: string;
  spare_keys?: boolean;
  assigned_to?: string;
  current_location?: string;
  notes?: string;
  
  // Archive fields
  archived_status?: string | null;
  archived_date?: string | null;
  archived_reason?: string | null;
  buyer_name?: string | null;
  sale_amount?: number | null;
}

export default function VehiclesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const userRole = session?.user?.role;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Mostrar TODOS los vehículos por defecto (incluyendo archivados)
  const [includeArchived, setIncludeArchived] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [showImportResults, setShowImportResults] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadVehicles();
    }
  }, [mounted]);
  
  // Recargar cuando cambie el toggle de archivados
  useEffect(() => {
    if (mounted) {
      loadVehicles();
    }
  }, [includeArchived]);

  // Función para determinar el estado real del vehículo (definida ANTES de su uso)
  const getVehicleRealStatus = (vehicle: Vehicle) => {
    // Si el vehículo está inactivo
    if (vehicle.status === 'F') return 'inactive';
    
    // Si tiene reserva activa
    if ((vehicle as any).currentBooking) return 'rented';
    
    // Si tiene mantenimiento activo
    if ((vehicle as any).activeMaintenance) return 'maintenance';
    
    // Si está activo y no tiene reservas ni mantenimiento
    if (vehicle.status === 'T') return 'available';
    
    return 'unknown';
  };

  const loadVehicles = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Llamar a la API para obtener vehículos desde la base de datos
      const url = `/api/vehicles${includeArchived ? '?includeArchived=true' : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Map API response to match our interface
        const mappedVehicles = data.map((v: any) => ({
          id: parseInt(v.id),
          registration_number: v.registration_number,
          make: v.make,
          model: v.model,
          year: v.year,
          color: v.color,
          vin: v.vin,
          mileage: v.mileage,
          status: v.status,
          fuel_type: v.fuel_type,
          condition_rating: v.condition_rating,
          pricing_group_id: v.pricing_group_id,
          
          // Insurance
          insurance_policy: v.insurance_policy,
          insurance_start_date: v.insurance_start_date,
          insurance_expiry: v.insurance_expiry,
          insurance_policy_type: v.insurance_policy_type,
          insurance_active: v.insurance_active,
          
          // ITV
          itv_valid: v.itv_valid,
          last_itv_date: v.last_itv_date,
          itv_expiry: v.itv_expiry,
          
          // Ownership
          ownership_type: v.ownership_type,
          rental_contract_end: v.rental_contract_end,
          rental_monthly_payment: v.rental_monthly_payment,
          commission_percentage: v.commission_percentage,
          owner_name: v.owner_name,
          owner_contact: v.owner_contact,
          // ✅ CRÍTICO: Incluir owner_user_id y depositor_user_id
          owner_user_id: v.owner_user_id,
          depositor_user_id: v.depositor_user_id,
          
          // Valuation
          purchase_price: v.purchase_price,
          market_value: v.market_value,
          sale_price: v.sale_price,
          
          // Additional
          document_status: v.document_status,
          spare_keys: v.spare_keys,
          assigned_to: v.assigned_to,
          current_location: v.current_location,
          notes: v.notes,
          
          // Archive fields
          archived_status: v.archived_status,
          archived_date: v.archived_date,
          archived_reason: v.archived_reason,
          buyer_name: v.buyer_name,
          sale_amount: v.sale_amount,
          
          // Active booking and maintenance (CRITICAL for status calculation)
          currentBooking: v.currentBooking,
          activeMaintenance: v.activeMaintenance
        }));
        setVehicles(mappedVehicles);
      } else {
        console.error('Error loading vehicles:', response.statusText);
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed mock data - now using database only
  /*
  const loadVehicles_OLD_LOCALSTORAGE = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Simular delay de API para testing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar si hay vehículos guardados
      const savedVehicles = localStorage.getItem('vehicles');
      if (savedVehicles) {
        setVehicles(JSON.parse(savedVehicles));
      } else {
        // Datos de ejemplo solo si no hay vehículos guardados
        const mockVehicles: Vehicle[] = [
          {
            id: 1,
            registration_number: '1234ABC',
            make: 'Toyota',
            model: 'Corolla',
            year: 2022,
            color: 'Blanco',
            mileage: 25000,
            status: 'available',
            fuel_type: 'Gasolina',
            condition_rating: 'Bueno',
            vehicle_type: 'car'
          },
          {
            id: 2,
            registration_number: '5678DEF',
            make: 'Seat',
            model: 'León',
            year: 2023,
            color: 'Gris',
            mileage: 15000,
            status: 'rented',
            fuel_type: 'Gasolina',
            condition_rating: 'Excelente',
            vehicle_type: 'car'
          },
          {
            id: 3,
            registration_number: '9012GHI',
            make: 'Volkswagen',
            model: 'Golf',
            year: 2021,
            color: 'Azul',
            mileage: 35000,
            status: 'maintenance',
            fuel_type: 'Diesel',
            condition_rating: 'Bueno',
            vehicle_type: 'car'
          },
          {
            id: 4,
            registration_number: '3456JKL',
            make: 'Peugeot',
            model: '208',
            year: 2024,
            color: 'Rojo',
            mileage: 8000,
            status: 'available',
            fuel_type: 'Gasolina',
            condition_rating: 'Excelente',
            vehicle_type: 'car'
          },
          {
            id: 5,
            registration_number: '7890MNO',
            make: 'Renault',
            model: 'Clio',
            year: 2020,
            color: 'Negro',
            mileage: 45000,
            status: 'available',
            fuel_type: 'Gasolina',
            condition_rating: 'Regular',
            vehicle_type: 'car'
          },
          {
            id: 6,
            registration_number: 'M001ABC',
            make: 'Yamaha',
            model: 'MT-07',
            year: 2023,
            color: 'Azul',
            mileage: 5000,
            status: 'available',
            fuel_type: 'Gasolina',
            condition_rating: 'Excelente',
            vehicle_type: 'motorcycle'
          },
          {
            id: 7,
            registration_number: 'B002XYZ',
            make: 'Sea Ray',
            model: 'Sundancer',
            year: 2022,
            color: 'Blanco',
            mileage: 120,
            status: 'available',
            fuel_type: 'Gasolina',
            condition_rating: 'Excelente',
            vehicle_type: 'boat'
          },
          {
            id: 8,
            registration_number: 'BG003DEF',
            make: 'Polaris',
            model: 'RZR',
            year: 2021,
            color: 'Rojo',
            mileage: 2500,
            status: 'maintenance',
            fuel_type: 'Gasolina',
            condition_rating: 'Bueno',
            vehicle_type: 'buggy'
          },
          {
            id: 9,
            registration_number: 'JS004GHI',
            make: 'Yamaha',
            model: 'VX Cruiser',
            year: 2023,
            color: 'Negro',
            mileage: 50,
            status: 'available',
            fuel_type: 'Gasolina',
            condition_rating: 'Excelente',
            vehicle_type: 'jetski'
          }
        ];
        
        setVehicles(mockVehicles);
        localStorage.setItem('vehicles', JSON.stringify(mockVehicles));
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };
  */

  // Función de ordenamiento natural (números antes de letras, ordenamiento numérico correcto)
  const naturalSort = (a: Vehicle, b: Vehicle) => {
    const aReg = a.registration_number || '';
    const bReg = b.registration_number || '';
    
    // Extraer números al inicio de la matrícula
    const aMatch = aReg.match(/^(\d+)/);
    const bMatch = bReg.match(/^(\d+)/);
    
    // Si ambos empiezan con número, comparar numéricamente
    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[1]);
      const bNum = parseInt(bMatch[1]);
      
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      
      // Si los números son iguales, comparar el resto alfabéticamente
      return aReg.localeCompare(bReg);
    }
    
    // Si solo uno empieza con número, poner los números primero
    if (aMatch) return -1;
    if (bMatch) return 1;
    
    // Si ninguno empieza con número, comparar alfabéticamente
    return aReg.localeCompare(bReg);
  };

  const filteredVehicles = vehicles
    .filter(vehicle => {
      const matchesSearch = 
        vehicle.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      
      const realStatus = getVehicleRealStatus(vehicle);
      const matchesStatus = statusFilter === 'all' || realStatus === statusFilter;
      
      // Filtro de archivados (simplificado)
      const matchesArchived = includeArchived || !vehicle.archived_status;
      
      return matchesSearch && matchesStatus && matchesArchived;
    })
    .sort(naturalSort);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleNewVehicleClick = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleExportVehicles = async () => {
    try {
      toast.loading('Exportando vehículos...');
      const response = await fetch('/api/vehicles/export');
      
      if (!response.ok) {
        throw new Error('Error al exportar vehículos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Vehículos exportados correctamente');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Error al exportar vehículos');
    }
  };

  const handleDownloadTemplate = () => {
    // Crear plantilla CSV con todas las columnas
    const template = `Matrícula,Marca,Modelo,Año,Color,Kilometraje,Estado,Tipo Combustible,Calificación,Grupo Precios,VIN/Bastidor,Póliza Seguro,Inicio Seguro,Vencimiento Seguro,Tipo Póliza,Seguro Activo,ITV Válida,Última ITV,Vencimiento ITV,Tipo Propiedad,Fin Contrato Renting,Pago Mensual Renting,Porcentaje Comisión,Nombre Propietario,Contacto Propietario,Precio Compra,Valor Mercado,Precio Venta,Estado Documentos,Llaves Repuesto,Asignado A,Ubicación Actual,Notas
1234ABC,Toyota,Corolla,2022,Blanco,25000,activo,Gasolina,Excelente,Grupo A,ABC123456789,POL123,2024-01-01,2025-01-01,Todo Riesgo,si,si,2024-01-15,2026-01-15,Propio,,,,,,25000,30000,,Completos,si,Juan,Oficina Central,
5678DEF,Honda,Civic,2023,Azul,15000,activo,Gasolina,Bueno,Grupo B,DEF987654321,POL456,2024-02-01,2025-02-01,Terceros,si,si,2024-02-10,2026-02-10,Renting,2025-12-31,350.50,,,,,35000,,,si,María,Sede Norte,`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_vehiculos.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Plantilla descargada. Edítala con tus datos y luego impórtala.');
  };

  const handleImportVehicles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      toast.error('Por favor, sube un archivo CSV o Excel (.csv, .xlsx, .xls)');
      event.target.value = '';
      return;
    }

    try {
      toast.loading('Importando vehículos...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/vehicles/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar vehículos');
      }

      setImportResults(result.results);
      setShowImportResults(true);
      
      toast.dismiss();
      
      if (result.results.errors && result.results.errors.length > 0) {
        toast.error(`Importación con errores: ${result.results.success} exitosos, ${result.results.errors.length} fallidos`);
      } else if (result.results.skipped > 0) {
        toast.success(`Importación completada: ${result.results.success} importados, ${result.results.skipped} omitidos (ya existían)`);
      } else {
        toast.success(`¡Importación exitosa! ${result.results.success} vehículos importados`);
      }
      
      // Recargar la lista de vehículos
      await loadVehicles();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Error al importar vehículos');
      console.error('Error en importación:', error);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleVehicleDetailsClick = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setIsDetailsModalOpen(true);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDetailsModalOpen(false);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (vehicleData: Vehicle) => {
    try {
      let savedVehicle: any = null;
      const wasArchived = editingVehicle?.archived_status;
      const isNowArchived = vehicleData.archived_status;
      
      // Determinar si necesitamos activar el toggle ANTES de guardar
      const shouldShowArchived = !wasArchived && isNowArchived;
      
      if (editingVehicle) {
        // Editar vehículo existente
        const response = await fetch(`/api/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vehicleData)
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el vehículo');
        }

        savedVehicle = await response.json();
      } else {
        // Crear nuevo vehículo
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vehicleData)
        });

        if (!response.ok) {
          throw new Error('Error al crear el vehículo');
        }

        savedVehicle = await response.json();
      }

      // Cerrar el modal primero
      setEditingVehicle(null);
      setIsVehicleModalOpen(false);

      // Mostrar notificación y activar toggle si se archivó
      if (shouldShowArchived) {
        const archivoTexto = isNowArchived === 'vendido' ? 'vendido' : 'dado de baja';
        toast.success(
          `✅ Vehículo marcado como ${archivoTexto}. Activando "Mostrar archivados"...`,
          { duration: 5000 }
        );
        // Activar toggle - el useEffect recargará automáticamente
        setIncludeArchived(true);
      } else {
        toast.success('Vehículo guardado correctamente');
        // Solo recargar si NO se archivó (para evitar doble recarga)
        await loadVehicles();
      }
      
      // Actualizar selectedVehicle si estaba abierto el mismo vehículo
      if (selectedVehicle && savedVehicle && savedVehicle.id === selectedVehicle.id) {
        setSelectedVehicle(savedVehicle);
      }
    } catch (error) {
      console.error('Error al guardar el vehículo:', error);
      toast.error('Error al guardar el vehículo. Por favor, inténtelo de nuevo.');
    }
  };

  const getStatusText = (status?: string, vehicle?: Vehicle) => {
    const realStatus = vehicle ? getVehicleRealStatus(vehicle) : status;
    
    switch (realStatus) {
      case 'T':
      case 'available': return 'Disponible';
      case 'rented': return 'Alquilado';
      case 'maintenance': return 'Mantenimiento';
      case 'F':
      case 'inactive': return 'Inactivo';
      default: return status || 'Desconocido';
    }
  };



  const handleDeleteVehicle = async (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && confirm(`¿Está seguro de que desea eliminar el vehículo ${vehicle.registration_number}?`)) {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el vehículo');
        }

        // Recargar vehículos desde la base de datos
        await loadVehicles();
        
        // Cerrar modales si el vehículo eliminado estaba abierto
        if (selectedVehicle?.id === vehicleId) {
          setIsDetailsModalOpen(false);
          setSelectedVehicle(null);
        }
      } catch (error) {
        console.error('Error al eliminar el vehículo:', error);
        alert('Error al eliminar el vehículo. Por favor, inténtelo de nuevo.');
      }
    }
  };

  // No renderizar hasta que esté montado para evitar errores de hidración
  if (!mounted || loading) {
    return (
      <div className="p-6">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Car className="h-7 w-7 text-blue-600" />
            Gestión de Vehículos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra la flota de vehículos de alquiler
          </p>
        </div>
        <PermissionGuard permission="canManageVehicles">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
              title="Descargar plantilla de ejemplo para importar vehículos"
            >
              <Download className="h-4 w-4" />
              Plantilla
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExportVehicles}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => document.getElementById('import-file-input')?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <input
              id="import-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportVehicles}
              className="hidden"
            />
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNewVehicleClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vehículo
            </Button>
            
            {userRole === 'super_admin' && (
              <Button 
                variant="outline"
                onClick={() => router.push('/admin/assign-vehicles-bulk')}
              >
                <Users className="mr-2 h-4 w-4" />
                Asignación Masiva
              </Button>
            )}
          </div>
        </PermissionGuard>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <Car className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.filter(v => getVehicleRealStatus(v) === 'available').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alquilados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {vehicles.filter(v => getVehicleRealStatus(v) === 'rented').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-orange-600">
                  {vehicles.filter(v => getVehicleRealStatus(v) === 'maintenance').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Primera fila: Búsqueda y filtros */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por matrícula, marca o modelo..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="rented">Alquilados</SelectItem>
                  <SelectItem value="maintenance">En mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Segunda fila: Control simple de archivado */}
            <div className="flex flex-col md:flex-row gap-4 items-center border-t pt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
                  <input
                    type="checkbox"
                    id="hideArchived"
                    checked={!includeArchived}
                    onChange={(e) => setIncludeArchived(!e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hideArchived" className="text-sm font-medium text-gray-700 cursor-pointer">
                    🚫 Ocultar vendidos y dados de baja
                  </label>
                </div>
              </div>
              
              {includeArchived && filteredVehicles.filter(v => v.archived_status).length > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border border-orange-300 px-3 py-1">
                  {filteredVehicles.filter(v => v.archived_status).length} archivados en el listado
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron vehículos
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Agrega tu primer vehículo para comenzar'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <Card 
              key={vehicle.id} 
              className={`hover:shadow-lg transition-shadow ${
                vehicle.archived_status 
                  ? 'border-2 border-orange-300 bg-orange-50/30' 
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5 text-blue-600" />
                      {vehicle.registration_number}
                      {vehicle.archived_status && (
                        <Badge 
                          variant="outline" 
                          className={`ml-2 text-xs font-semibold ${
                            vehicle.archived_status === 'vendido' 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : 'bg-red-100 text-red-700 border-red-300'
                          }`}
                        >
                          {vehicle.archived_status === 'vendido' ? '🏷️ VENDIDO' : '⛔ DADO DE BAJA'}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                    {vehicle.archived_status && vehicle.archived_date && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        📅 Archivado: {new Date(vehicle.archived_date).toLocaleDateString('es-ES')}
                        {vehicle.buyer_name && ` • Comprador: ${vehicle.buyer_name}`}
                      </p>
                    )}
                  </div>
                  {!vehicle.archived_status && (
                    <Badge className={getStatusColor(getVehicleRealStatus(vehicle))} variant="secondary">
                      {getStatusText(vehicle.status, vehicle)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Car className="h-4 w-4" />
                    <span>Vehículo</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-3 h-3 rounded-full border-2 border-gray-300" 
                         style={{backgroundColor: vehicle.color?.toLowerCase()}}></div>
                    <span>{vehicle.color}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Fuel className="h-4 w-4" />
                    <span>{vehicle.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{vehicle.mileage?.toLocaleString()} km</span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Estado: {vehicle.condition_rating}</span>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleVehicleDetailsClick(vehicle.id)}
                  >
                    Ver Detalles
                  </Button>
                  <PermissionGuard permission="canManageVehicles">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVehicleDetailsClick(vehicle.id)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="canDeleteData">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />

      <VehicleDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={() => handleEditVehicle(selectedVehicle!)}
        onDelete={handleDeleteVehicle}
        vehicle={selectedVehicle}
      />

      {/* Import Results Dialog */}
      <Dialog open={showImportResults} onOpenChange={setShowImportResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados de la Importación</DialogTitle>
            <DialogDescription>
              Resumen de la importación de vehículos
            </DialogDescription>
          </DialogHeader>
          
          {importResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                      <p className="text-sm text-gray-600">Importados</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
                      <p className="text-sm text-gray-600">Omitidos</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{importResults.errors?.length || 0}</p>
                      <p className="text-sm text-gray-600">Errores</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Debug Information */}
              {importResults.debug && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
                  <h4 className="font-semibold text-sm mb-2">Información de Debug:</h4>
                  <div className="space-y-1 font-mono">
                    <p><strong>Filas totales:</strong> {importResults.debug.totalLines}</p>
                    <p><strong>Delimitador detectado:</strong> {importResults.debug.delimiter === ',' ? 'Coma (,)' : importResults.debug.delimiter === ';' ? 'Punto y coma (;)' : importResults.debug.delimiter}</p>
                    <p><strong>Columnas:</strong> {importResults.debug.headers?.join(', ')}</p>
                    {importResults.debug.sampleRow && importResults.debug.sampleRow.length > 0 && (
                      <div>
                        <p className="mt-2"><strong>Primera fila de datos:</strong></p>
                        <div className="mt-1 text-gray-600 max-h-20 overflow-y-auto">
                          {importResults.debug.sampleRow.map((val: string, idx: number) => (
                            <div key={idx}>{importResults.debug.headers?.[idx] || `Col${idx}`}: {val || '(vacío)'}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Errores encontrados:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {importResults.errors.map((error: string, index: number) => (
                      <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setShowImportResults(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
