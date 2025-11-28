
'use client';

import { Car, Calendar, Wrench, Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/lib/types';

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  // Total de reservas del año
  const totalReservas = stats?.totalBookings || 0;

  const statsCards = [
    {
      title: 'Total Vehículos',
      value: stats?.totalVehicles?.toString() || '0',
      icon: Car,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-400/20',
    },
    {
      title: 'Disponibles',
      value: stats?.availableVehicles?.toString() || '0',
      subtitle: `${stats?.vehicleUtilization || 0}%`,
      icon: Gauge,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-400/20',
    },
    {
      title: 'Reservas 2025',
      value: totalReservas.toString(),
      subtitle: `${stats?.activeBookings || 0} activas`,
      icon: Calendar,
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-400/20',
    },
    {
      title: 'Mantenimiento',
      value: stats?.pendingMaintenance?.toString() || '0',
      icon: Wrench,
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-red-400/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* KPIs compactos */}
      {statsCards?.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${stat.gradient} p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
          >
            {/* Decorative background pattern */}
            <div className="absolute top-0 right-0 opacity-10">
              <Icon className="h-20 w-20 transform translate-x-4 -translate-y-4" />
            </div>
            
            {/* Content */}
            <div className="relative">
              {/* Icon */}
              <div className={`inline-flex p-2 rounded-full ${stat.iconBg} mb-2`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              
              {/* Title */}
              <p className="text-white/90 text-xs font-medium mb-1">
                {stat.title}
              </p>
              
              {/* Value */}
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-white">
                  {stat.value}
                </h3>
                {stat.subtitle && (
                  <span className="text-white/80 text-xs">
                    {stat.subtitle}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
