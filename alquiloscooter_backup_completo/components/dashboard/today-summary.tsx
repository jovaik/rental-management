
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Bell } from 'lucide-react';

interface TodayBooking {
  id: number;
  pickup_date: string;
  return_date: string;
  status: string;
  created_at?: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  vehicles: Array<{
    car: {
      id: number;
      registration_number: string;
      make: string;
      model: string;
    };
  }>;
  pickup_location?: string;
}

interface TodaySummaryData {
  pickups: TodayBooking[];
  returns: TodayBooking[];
  pendingRequests: TodayBooking[];
}

export function TodaySummary() {
  const [data, setData] = useState<TodaySummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Función helper para formatear la hora desde un DateTime
  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Función helper para formatear nombre completo
  const getFullName = (customer: { first_name: string; last_name: string } | null) => {
    if (!customer) return 'Cliente no especificado';
    return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Sin nombre';
  };

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        const response = await fetch('/api/dashboard/today');
        if (response?.ok) {
          const todayData = await response.json();
          setData(todayData);
        }
      } catch (error) {
        console.error('Error fetching today summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-16 bg-gray-200"></CardHeader>
        <CardContent className="h-24 bg-gray-100"></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const pickupsCount = data.pickups?.length || 0;
  const returnsCount = data.returns?.length || 0;
  const pendingCount = data.pendingRequests?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resumen de Hoy</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 divide-x">
          {/* Salidas */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-2 text-green-600 font-medium text-sm">
              <ArrowUp className="h-4 w-4" />
              <span>Salidas ({pickupsCount})</span>
            </div>
            {pickupsCount === 0 ? (
              <p className="text-xs text-gray-500 italic">Sin salidas</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {data.pickups.map((booking) => (
                  <div key={booking.id} className="text-xs">
                    <div className="font-medium text-green-700">
                      {formatTime(booking.pickup_date)} - {booking.vehicles?.[0]?.car.registration_number || 'N/A'}
                    </div>
                    <div className="text-gray-600 truncate">
                      {getFullName(booking.customer)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devoluciones */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium text-sm">
              <ArrowDown className="h-4 w-4" />
              <span>Devoluciones ({returnsCount})</span>
            </div>
            {returnsCount === 0 ? (
              <p className="text-xs text-gray-500 italic">Sin devoluciones</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {data.returns.map((booking) => (
                  <div key={booking.id} className="text-xs">
                    <div className="font-medium text-blue-700">
                      {formatTime(booking.return_date)} - {booking.vehicles?.[0]?.car.registration_number || 'N/A'}
                    </div>
                    <div className="text-gray-600 truncate">
                      {getFullName(booking.customer)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peticiones Nuevas */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-2 text-orange-600 font-medium text-sm">
              <Bell className="h-4 w-4" />
              <span>Peticiones ({pendingCount})</span>
            </div>
            {pendingCount === 0 ? (
              <p className="text-xs text-gray-500 italic">Sin peticiones</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {data.pendingRequests.map((booking) => (
                  <div key={booking.id} className="text-xs">
                    <div className="font-medium text-orange-700">
                      {formatTime(booking.pickup_date)} - {booking.vehicles?.[0]?.car.registration_number || 'N/A'}
                    </div>
                    <div className="text-gray-600 truncate">
                      {getFullName(booking.customer)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
