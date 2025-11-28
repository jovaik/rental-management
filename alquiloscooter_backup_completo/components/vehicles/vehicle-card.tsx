
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Fuel, Settings, Calendar, FileText } from 'lucide-react';
import { formatDate, getStatusColor, isExpiring, isOverdue } from '@/lib/utils';
import Link from 'next/link';

interface VehicleCardProps {
  vehicle: {
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
    insurance_expiry?: Date;
    registration_expiry?: Date;
    next_service_due?: Date;
    pricingGroup?: {
      id: number;
      name: string;
    } | null;
    location?: {
      id: number;
      name?: string;
    };
    maintenance?: Array<{
      id: number;
      status: string;
      priority: string;
      scheduled_date: Date;
    }>;
    bookings?: Array<{
      id: number;
      customer_name?: string;
      pickup_date: Date;
      return_date: Date;
      status: string;
    }>;
  };
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const nextMaintenance = vehicle?.maintenance?.find(m => 
    m?.status === 'scheduled' || m?.status === 'overdue'
  );

  const activeBooking = vehicle?.bookings?.find(b => 
    b?.status === 'confirmed' && 
    new Date(b?.pickup_date) <= new Date() && 
    new Date(b?.return_date) >= new Date()
  );

  const hasExpiringSoon = [
    vehicle?.insurance_expiry,
    vehicle?.registration_expiry,
    vehicle?.next_service_due
  ]?.some(date => isExpiring(date));

  const hasOverdue = [
    vehicle?.insurance_expiry,
    vehicle?.registration_expiry,
    vehicle?.next_service_due
  ]?.some(date => isOverdue(date));

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Car className="h-5 w-5 text-blue-600" />
            <span>{vehicle?.registration_number || 'Sin matrícula'}</span>
          </CardTitle>
          <Badge className={getStatusColor(vehicle?.status || 'unknown')}>
            {vehicle?.status === 'T' ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="font-medium">
            {vehicle?.make} {vehicle?.model}
          </span>
          {vehicle?.year && (
            <span>({vehicle.year})</span>
          )}
          {vehicle?.color && (
            <span className="capitalize">• {vehicle.color}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-gray-400" />
            <span>{vehicle?.mileage?.toLocaleString() || '0'} km</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Fuel className="h-4 w-4 text-gray-400" />
            <span className="capitalize">{vehicle?.fuel_type || 'N/A'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{vehicle?.location?.name || 'Sin ubicación'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {vehicle?.condition_rating || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Pricing Group */}
        {vehicle?.pricingGroup && (
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 font-medium">
              💰 Tarifa: {vehicle.pricingGroup.name}
            </div>
          </div>
        )}
        
        {!vehicle?.pricingGroup && (
          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-xs text-amber-600 font-medium">
              ⚠️ Sin grupo de tarifas asignado
            </div>
          </div>
        )}

        {/* Alerts */}
        {(hasOverdue || hasExpiringSoon || nextMaintenance) && (
          <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            {hasOverdue && (
              <div className="text-sm text-red-600 font-medium">
                ⚠️ Documentos vencidos
              </div>
            )}
            {hasExpiringSoon && !hasOverdue && (
              <div className="text-sm text-orange-600">
                📋 Documentos próximos a vencer
              </div>
            )}
            {nextMaintenance && (
              <div className="text-sm text-blue-600">
                🔧 Mantenimiento: {formatDate(nextMaintenance.scheduled_date)}
              </div>
            )}
          </div>
        )}

        {/* Current Booking */}
        {activeBooking && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium text-green-800">
                  Alquilado por {activeBooking?.customer_name}
                </div>
                <div className="text-green-600">
                  Hasta: {formatDate(activeBooking?.return_date)}
                </div>
              </div>
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex space-x-2">
            <Link href={`/vehicles/${vehicle?.id}`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Detalles
              </Button>
            </Link>
            
            <Link href={`/vehicles/${vehicle?.id}/maintenance`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Mantener
              </Button>
            </Link>
          </div>
          
          {nextMaintenance?.priority === 'critical' && (
            <Badge className="bg-red-100 text-red-800">
              Urgente
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
