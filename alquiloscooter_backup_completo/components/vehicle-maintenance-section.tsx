
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Wrench, Euro, Trash2, Edit, FileText } from 'lucide-react';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { MaintenanceModal } from './modals/maintenance-modal';
import { MaintenanceExpensesModal } from './modals/maintenance-expenses-modal';
import { toast } from 'react-hot-toast';

interface MaintenanceRecord {
  id: number;
  title: string;
  maintenance_type: string;
  scheduled_date: string;
  completed_date?: string;
  status: string;
  priority: string;
  mileage_at_maintenance?: number;
  workshop?: {
    id: number;
    name: string;
  };
  workshop_location?: string;
  expenses?: Array<{
    id: number;
    total_price: number;
  }>;
  description?: string;
}

interface VehicleMaintenanceSectionProps {
  vehicleId: number;
}

export function VehicleMaintenanceSection({ vehicleId }: VehicleMaintenanceSectionProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    loadMaintenanceRecords();
  }, [vehicleId]);

  const loadMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vehicles/${vehicleId}/maintenance`);
      if (response?.ok) {
        const data = await response.json();
        setMaintenanceRecords(data);
      }
    } catch (error) {
      console.error('Error loading maintenance records:', error);
      toast.error('Error al cargar mantenimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMaintenance = () => {
    setEditingMaintenance(null);
    setIsMaintenanceModalOpen(true);
  };

  const handleEditMaintenance = (maintenance: MaintenanceRecord) => {
    setEditingMaintenance(maintenance);
    setIsMaintenanceModalOpen(true);
  };

  const handleManageExpenses = (maintenance: MaintenanceRecord) => {
    setSelectedMaintenance(maintenance);
    setIsExpensesModalOpen(true);
  };

  const handleSaveMaintenance = async (maintenanceData: any) => {
    try {
      let response;
      const isNewMaintenance = !editingMaintenance;
      
      if (editingMaintenance) {
        // Actualizar mantenimiento existente
        response = await fetch(`/api/maintenance/${editingMaintenance.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maintenanceData)
        });
      } else {
        // Crear nuevo mantenimiento
        response = await fetch(`/api/vehicles/${vehicleId}/maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...maintenanceData,
            car_id: vehicleId
          })
        });
      }
      
      if (response?.ok) {
        const savedMaintenance = await response.json();
        toast.success(editingMaintenance ? 'Mantenimiento actualizado' : 'Mantenimiento creado');
        await loadMaintenanceRecords();
        setIsMaintenanceModalOpen(false);
        
        // Si es un nuevo mantenimiento, abrir automáticamente el modal de gastos
        if (isNewMaintenance && savedMaintenance?.id) {
          toast.success('Ahora puedes agregar los gastos detallados', { duration: 3000 });
          setSelectedMaintenance(savedMaintenance);
          setIsExpensesModalOpen(true);
        }
      } else {
        toast.error('Error al guardar mantenimiento');
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
      toast.error('Error al guardar mantenimiento');
    }
  };

  const handleDeleteMaintenance = async (maintenanceId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este mantenimiento?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'DELETE'
      });
      
      if (response?.ok) {
        toast.success('Mantenimiento eliminado');
        loadMaintenanceRecords();
      } else {
        toast.error('Error al eliminar mantenimiento');
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      toast.error('Error al eliminar mantenimiento');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
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

  const calculateTotalCost = (expenses?: Array<{ total_price: number }>) => {
    if (!expenses || expenses.length === 0) return 0;
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.total_price?.toString() || '0'), 0);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Historial de Mantenimiento</h3>
        <Button 
          type="button"
          onClick={handleNewMaintenance}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Mantenimiento
        </Button>
      </div>

      {maintenanceRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin mantenimientos registrados
            </h3>
            <p className="text-gray-500 mb-4">
              Programa el primer mantenimiento para este vehículo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {maintenanceRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">{record.title}</h4>
                      <Badge className={getStatusColor(record.status)} variant="secondary">
                        {getStatusText(record.status)}
                      </Badge>
                      <Badge className={getPriorityColor(record.priority)} variant="outline">
                        {getPriorityText(record.priority)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(new Date(record.scheduled_date))}</span>
                      </div>
                      {record.mileage_at_maintenance && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">📏 {record.mileage_at_maintenance.toLocaleString()} km</span>
                        </div>
                      )}
                      {record.workshop && (
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          <span>{record.workshop.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">Tipo: {getTypeText(record.maintenance_type)}</span>
                      {record.expenses && record.expenses.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Euro className="h-3 w-3" />
                          <span>Total: €{calculateTotalCost(record.expenses).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 ml-4">
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                      size="sm"
                      onClick={() => handleManageExpenses(record)}
                      title="Gestionar gastos detallados línea a línea"
                    >
                      <Euro className="h-3 w-3 mr-1" />
                      Gastos
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMaintenance(record)}
                        title="Editar mantenimiento"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMaintenance(record.id)}
                        title="Eliminar mantenimiento"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modales */}
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setEditingMaintenance(null);
        }}
        onSave={handleSaveMaintenance}
        maintenance={editingMaintenance}
        vehicleId={vehicleId}
      />

      {selectedMaintenance && (
        <MaintenanceExpensesModal
          isOpen={isExpensesModalOpen}
          onClose={() => {
            setIsExpensesModalOpen(false);
            setSelectedMaintenance(null);
          }}
          maintenanceId={selectedMaintenance.id}
          onUpdate={loadMaintenanceRecords}
          workshopName={selectedMaintenance.workshop?.name || ''}
        />
      )}
    </div>
  );
}
