

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Trophy } from 'lucide-react';

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  group: string;
  bookings: number;
}

interface TopVehiclesData {
  topVehicles: Vehicle[];
}

export function TopVehiclesChart() {
  const [data, setData] = useState<TopVehiclesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats?period=yearly');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching top vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Vehículos Más Alquilados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600'
  ];

  const totalBookings = data.topVehicles.reduce((sum, v) => sum + v.bookings, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <span>Vehículos Más Alquilados (Año Actual)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.topVehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos de alquileres disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart */}
            <div className="relative w-64 h-64 mx-auto">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {data.topVehicles.map((vehicle, index) => {
                  const percentage = (vehicle.bookings / totalBookings) * 100;
                  const circumference = 2 * Math.PI * 40;
                  const offset = data.topVehicles
                    .slice(0, index)
                    .reduce((sum, v) => sum + (v.bookings / totalBookings) * 100, 0);
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((offset / 100) * circumference);

                  // Get gradient color
                  const gradientId = `gradient-${index}`;
                  const colorClass = colors[index % colors.length];
                  const [fromColor, toColor] = colorClass.split(' ').map(c => {
                    if (c.includes('blue')) return index === 0 ? '#3b82f6' : '#2563eb';
                    if (c.includes('green')) return index === 0 ? '#10b981' : '#059669';
                    if (c.includes('orange')) return index === 0 ? '#f97316' : '#ea580c';
                    if (c.includes('purple')) return index === 0 ? '#a855f7' : '#9333ea';
                    if (c.includes('pink')) return index === 0 ? '#ec4899' : '#db2777';
                    return '#3b82f6';
                  });

                  return (
                    <g key={vehicle.id}>
                      <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={fromColor} />
                          <stop offset="100%" stopColor={toColor} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    </g>
                  );
                })}
                {/* Center hole */}
                <circle cx="50" cy="50" r="28" fill="white" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {data.topVehicles.map((vehicle, index) => {
                const percentage = ((vehicle.bookings / totalBookings) * 100).toFixed(1);
                const colorClass = colors[index % colors.length];

                return (
                  <div key={vehicle.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${colorClass} flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {vehicle.registration_number}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-semibold text-gray-900">{vehicle.bookings}</p>
                      <p className="text-xs text-gray-600">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
