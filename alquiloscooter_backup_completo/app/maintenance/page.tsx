
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Plus, Calendar, Car, Euro, Search, Filter, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import Link from 'next/link';
import { MaintenanceModal } from '@/components/modals/maintenance-modal';
import { MaintenanceDetailsModal } from '@/components/modals/maintenance-details-modal';
import { MaintenanceExpensesModal } from '@/components/modals/maintenance-expenses-modal';
import { MaintenancePaymentModal } from '@/components/modals/maintenance-payment-modal';

interface MaintenanceRecord {
  id: number;
  title: string;
  maintenance_type: string;
  scheduled_date: Date;
  completed_date?: Date;
  status: string;
  priority: string;
  vehicle: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
  estimated_cost?: number;
  actual_cost?: number;
  workshop?: {
    id: number;
    name: string;
  };
  workshop_location?: string;
  description?: string;
}

export default function MaintenancePage() {
  const { data: session, status } = useSession() || {};
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadMaintenanceRecords();
    }
  }, [mounted]);

  const loadMaintenanceRecords = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/maintenance');
      if (response?.ok) {
        const data = await response.json();
        setMaintenanceRecords(data);
      }
    } catch (error) {
      console.error('Error loading maintenance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch = 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || record.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
  };

  const handleNewMaintenanceClick = () => {
    setEditingMaintenance(null);
    setIsMaintenanceModalOpen(true);
  };

  const handleDeleteMaintenance = async (maintenanceId: number) => {
    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'DELETE',
      });
      
      if (response?.ok) {
        const updatedRecords = maintenanceRecords.filter(record => record.id !== maintenanceId);
        setMaintenanceRecords(updatedRecords);
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    }
  };

  const handleClearDemoData = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los mantenimientos?')) {
      try {
        const response = await fetch('/api/maintenance/clear-all', {
          method: 'DELETE',
        });
        
        if (response?.ok) {
          setMaintenanceRecords([]);
        }
      } catch (error) {
        console.error('Error clearing maintenance data:', error);
      }
    }
  };

  const handleMaintenanceDetailsClick = (maintenanceId: number) => {
    const maintenance = maintenanceRecords.find(m => m.id === maintenanceId);
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      setIsDetailsModalOpen(true);
    }
  };

  const handleStartMaintenanceClick = async (maintenanceId: number) => {
    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      
      if (response?.ok) {
        const updatedRecords = maintenanceRecords.map(m => 
          m.id === maintenanceId 
            ? { ...m, status: 'in_progress' }
            : m
        );
        setMaintenanceRecords(updatedRecords);
      }
    } catch (error) {
      console.error('Error starting maintenance:', error);
    }
  };

  const handleEditMaintenance = (maintenance: MaintenanceRecord) => {
    setEditingMaintenance(maintenance);
    setIsDetailsModalOpen(false);
    setIsMaintenanceModalOpen(true);
  };

  const handleManageExpenses = () => {
    setIsDetailsModalOpen(false);
    setIsExpensesModalOpen(true);
  };

  const handleMarkAsPaid = () => {
    setIsDetailsModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (paymentData: any) => {
    if (!selectedMaintenance) return;
    
    try {
      const response = await fetch(`/api/maintenance/${selectedMaintenance.id}/marcar-pagado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (response?.ok) {
        await loadMaintenanceRecords();
        setIsPaymentModalOpen(false);
        alert('Mantenimiento marcado como pagado y gasto registrado correctamente');
      } else {
        const error = await response?.json();
        alert(error?.error || 'Error al marcar como pagado');
      }
    } catch (error) {
      console.error('Error marking maintenance as paid:', error);
      alert('Error al marcar el mantenimiento como pagado');
    }
  };

  const handleCompleteMaintenance = async (maintenanceId: number) => {
    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'completed', 
          completed_date: new Date().toISOString()
        }),
      });
      
      if (response?.ok) {
        const updatedRecords = maintenanceRecords.map(m => 
          m.id === maintenanceId 
            ? { ...m, status: 'completed', completed_date: new Date() }
            : m
        );
        setMaintenanceRecords(updatedRecords);
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      console.error('Error completing maintenance:', error);
    }
  };

  const handleSaveMaintenance = async (maintenanceData: MaintenanceRecord) => {
    try {
      let response;
      let updatedRecords;
      
      if (editingMaintenance) {
        // Editar mantenimiento existente
        response = await fetch(`/api/maintenance/${editingMaintenance.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(maintenanceData),
        });
        
        if (response?.ok) {
          const updatedMaintenance = await response.json();
          updatedRecords = maintenanceRecords.map(m => m.id === editingMaintenance.id ? updatedMaintenance : m);
        } else {
          // Mostrar error del servidor
          const errorData = await response?.json();
          alert(errorData?.error || 'Error al actualizar el mantenimiento');
          return; // No cerrar el modal si hay error
        }
      } else {
        // Crear nuevo mantenimiento
        response = await fetch('/api/maintenance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(maintenanceData),
        });
        
        if (response?.ok) {
          const newMaintenance = await response.json();
          updatedRecords = [...maintenanceRecords, newMaintenance];
        } else {
          // Mostrar error del servidor
          const errorData = await response?.json();
          alert(errorData?.error || 'Error al crear el mantenimiento');
          return; // No cerrar el modal si hay error
        }
      }
      
      if (response?.ok && updatedRecords) {
        setMaintenanceRecords(updatedRecords);
        setEditingMaintenance(null);
        setIsMaintenanceModalOpen(false); // Cerrar el modal después de guardar
        await loadMaintenanceRecords(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
      alert('Error al guardar el mantenimiento');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'preventive': return 'Preventivo';
      case 'corrective': return 'Correctivo';
      case 'emergency': return 'Emergencia';
      case 'inspection': return 'Inspección';
      default: return type;
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
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
            <Wrench className="h-7 w-7 text-orange-600" />
            Gestión de Mantenimiento
          </h1>
          <p className="text-gray-600 mt-1">
            Programa y supervisa el mantenimiento de vehículos
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleNewMaintenanceClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Mantenimiento
            </Button>
            
            <Button 
              variant="destructive"
              onClick={handleClearDemoData}
              title="Eliminar todos los mantenimientos de demostración"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{maintenanceRecords.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {maintenanceRecords.filter(r => r.status === 'scheduled').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {maintenanceRecords.filter(r => r.status === 'overdue').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Wrench className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">
                  {maintenanceRecords.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Wrench className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título, vehículo o matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de mantenimientos */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron mantenimientos
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Programa tu primer mantenimiento para comenzar'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Wrench className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">{record.title}</h3>
                      <Badge className={getStatusColor(record.status)} variant="secondary">
                        {getStatusText(record.status)}
                      </Badge>
                      <Badge className={getPriorityColor(record.priority)} variant="outline">
                        {getPriorityText(record.priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        <span>{record.vehicle.registration_number} - {record.vehicle.make} {record.vehicle.model}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(record.scheduled_date)}</span>
                      </div>
                      {record.workshop && (
                        <div className="flex items-center gap-1">
                          <Wrench className="h-4 w-4" />
                          <span>{record.workshop.name}</span>
                        </div>
                      )}
                    </div>
                    {record.description && (
                      <p className="text-sm text-gray-600 mb-3">{record.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">Tipo: {getTypeText(record.maintenance_type)}</span>
                      {record.estimated_cost && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Euro className="h-4 w-4" />
                          <span>Estimado: €{record.estimated_cost}</span>
                        </div>
                      )}
                      {record.actual_cost && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Euro className="h-4 w-4" />
                          <span>Real: €{record.actual_cost}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMaintenanceDetailsClick(record.id)}
                    >
                      Ver Detalles
                    </Button>
                    {record.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleStartMaintenanceClick(record.id)}
                      >
                        Iniciar
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteMaintenance(record.id)}
                      title="Eliminar mantenimiento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modales */}
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSave={handleSaveMaintenance}
        maintenance={editingMaintenance}
      />

      <MaintenanceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={() => handleEditMaintenance(selectedMaintenance!)}
        onStart={() => handleStartMaintenanceClick(selectedMaintenance!.id)}
        onComplete={() => handleCompleteMaintenance(selectedMaintenance!.id)}
        onManageExpenses={handleManageExpenses}
        onMarkAsPaid={handleMarkAsPaid}
        maintenance={selectedMaintenance}
      />

      <MaintenanceExpensesModal
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        maintenanceId={selectedMaintenance?.id || 0}
        onUpdate={loadMaintenanceRecords}
      />

      <MaintenancePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        maintenance={selectedMaintenance}
      />
    </div>
  );
}
