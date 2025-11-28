
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Calendar, Car, User, Euro, Edit, Play, CheckCircle, Receipt, DollarSign } from 'lucide-react';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStart: () => void;
  onComplete: () => void;
  onManageExpenses: () => void;
  onMarkAsPaid?: () => void;
  maintenance: any;
}

export function MaintenanceDetailsModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onStart, 
  onComplete,
  onManageExpenses,
  onMarkAsPaid,
  maintenance 
}: MaintenanceDetailsModalProps) {
  if (!maintenance) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-orange-600" />
              {maintenance.title}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onManageExpenses}>
                <Receipt className="h-4 w-4 mr-2" />
                Gestionar Gastos
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {maintenance.status === 'scheduled' && (
                <Button size="sm" onClick={onStart} className="bg-orange-600 hover:bg-orange-700">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
              )}
              {maintenance.status === 'in_progress' && (
                <Button size="sm" onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar
                </Button>
              )}
              {maintenance.status === 'completed' && !maintenance.is_paid && onMarkAsPaid && (
                <Button size="sm" onClick={onMarkAsPaid} className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Marcar como Pagado
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Estado y prioridad */}
          <div className="flex gap-2">
            <Badge className={getStatusColor(maintenance.status)} variant="secondary">
              {getStatusText(maintenance.status)}
            </Badge>
            <Badge className={getPriorityColor(maintenance.priority)} variant="outline">
              Prioridad {getPriorityText(maintenance.priority)}
            </Badge>
            <Badge variant="outline">
              {getTypeText(maintenance.maintenance_type)}
            </Badge>
            {maintenance.is_paid && (
              <Badge className="bg-green-100 text-green-700">
                Pagado
              </Badge>
            )}
          </div>

          {/* Información del vehículo */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Vehículo</h3>
              <div className="flex items-center gap-4">
                <Car className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-lg">
                    {maintenance.vehicle?.registration_number || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    {maintenance.vehicle?.make || ''} {maintenance.vehicle?.model || ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del mantenimiento */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Detalles del Mantenimiento</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha programada</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{formatDate(maintenance.scheduled_date)}</span>
                  </div>
                </div>
                
                {maintenance.completed_date && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha completada</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{formatDate(maintenance.completed_date)}</span>
                    </div>
                  </div>
                )}
                
                {maintenance.technician && (
                  <div>
                    <p className="text-sm text-gray-600">Técnico asignado</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{maintenance.technician}</span>
                    </div>
                  </div>
                )}
                
                {maintenance.estimated_cost && (
                  <div>
                    <p className="text-sm text-gray-600">Coste estimado</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Euro className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">€{maintenance.estimated_cost}</span>
                    </div>
                  </div>
                )}
                
                {maintenance.actual_cost && (
                  <div>
                    <p className="text-sm text-gray-600">Coste real</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Euro className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">€{maintenance.actual_cost}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {maintenance.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Descripción</p>
                  <p className="mt-1 text-gray-800">{maintenance.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline de estado */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Mantenimiento programado</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(maintenance.scheduled_date)}
                    </p>
                  </div>
                </div>
                
                {maintenance.status !== 'scheduled' && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {maintenance.status === 'in_progress' ? 'Mantenimiento iniciado' : 'Estado actualizado'}
                      </p>
                      <p className="text-xs text-gray-600">Estado: {getStatusText(maintenance.status)}</p>
                    </div>
                  </div>
                )}
                
                {maintenance.completed_date && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Mantenimiento completado</p>
                      <p className="text-xs text-gray-600">
                        {formatDate(maintenance.completed_date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
