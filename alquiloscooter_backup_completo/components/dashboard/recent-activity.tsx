
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Car, Wrench, FileText } from 'lucide-react';
import { formatDateTime, getStatusColor } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'booking' | 'maintenance' | 'document' | 'vehicle';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  priority?: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'vehicle':
        return <Car className="h-4 w-4 text-purple-600" />;
      default:
        return <CalendarDays className="h-4 w-4 text-gray-600" />;
    }
  };

  // Mock data if no activities provided
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'maintenance',
      title: 'Mantenimiento Programado',
      description: 'BMW X3 - Cambio de aceite y filtros',
      timestamp: new Date(),
      status: 'scheduled',
      priority: 'medium'
    },
    {
      id: '2',
      type: 'booking',
      title: 'Nueva Reserva',
      description: 'Mercedes C200 - Cliente: Juan Pérez',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'confirmed'
    },
    {
      id: '3',
      type: 'document',
      title: 'Documento Vencido',
      description: 'Seguro del Audi A4 expira pronto',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      priority: 'high'
    }
  ];

  const displayActivities = activities?.length > 0 ? activities : mockActivities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities?.slice(0, 8)?.map((activity) => (
            <div key={activity?.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity?.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity?.title}
                  </h4>
                  <time className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDateTime(activity?.timestamp)}
                  </time>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {activity?.description}
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  {activity?.status && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </Badge>
                  )}
                  {activity?.priority && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {activity.priority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {displayActivities?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay actividad reciente
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
