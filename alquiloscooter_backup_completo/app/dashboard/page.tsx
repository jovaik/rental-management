
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { DashboardPlanningCalendar } from '@/components/dashboard/dashboard-planning-calendar';
import { TodaySummary } from '@/components/dashboard/today-summary';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { TopVehiclesChart } from '@/components/dashboard/top-vehicles-chart';
import { BudgetComparisonWidget } from '@/components/dashboard/budget-comparison-widget';
import { PendingRequestsPanel } from '@/components/planning/pending-requests-panel';
import { DashboardStats, UserRole, ROLE_PERMISSIONS } from '@/lib/types';

export default function DashboardPage() {
  const { data: session } = useSession() || {};
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = session?.user?.role as UserRole;
  const rolePermissions = userRole ? ROLE_PERMISSIONS[userRole] : null;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response?.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-80 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Mensajes personalizados según el rol
  const dashboardTitles: Record<UserRole, { title: string; description: string }> = {
    super_admin: {
      title: 'Dashboard Ejecutivo',
      description: 'Resumen completo de la operación de alquiler de vehículos'
    },
    admin: {
      title: 'Dashboard Administrativo',
      description: 'Vista general de la gestión operativa'
    },
    propietario: {
      title: 'Dashboard de Propietario',
      description: 'Estado de tus vehículos, alquileres y comisiones'
    },
    colaborador: {
      title: 'Dashboard de Colaborador',
      description: 'Gestión de vehículos en depósito y comisiones generadas'
    },
    operador: {
      title: 'Dashboard de Operador',
      description: 'Operaciones diarias y reservas de tu ubicación'
    },
    taller: {
      title: 'Dashboard de Taller',
      description: 'Órdenes de trabajo y mantenimientos asignados'
    }
  };

  const dashboardInfo = userRole ? dashboardTitles[userRole] : dashboardTitles.super_admin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{dashboardInfo.title}</h1>
        <p className="text-gray-600">
          {dashboardInfo.description}
        </p>
        {rolePermissions && (
          <p className="text-sm text-blue-600 mt-1">
            Rol: {rolePermissions.name}
          </p>
        )}
      </div>

      {/* Resumen del día - Salidas y devoluciones de hoy */}
      <TodaySummary />

      {/* Solicitudes Pendientes de Aprobación (solo para super_admin y admin) */}
      {(userRole === 'super_admin' || userRole === 'admin') && (
        <PendingRequestsPanel />
      )}

      {/* Planning Calendar - Vista rápida de las reservas */}
      <DashboardPlanningCalendar />

      {/* Stats Grid */}
      {stats && <StatsGrid stats={stats} />}

      {/* Charts Grid con Presupuestos (solo para super_admin y admin) */}
      <div className={`grid grid-cols-1 gap-6 ${(userRole === 'super_admin' || userRole === 'admin') ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <IncomeExpenseChart />
        <TopVehiclesChart />
        {(userRole === 'super_admin' || userRole === 'admin') && (
          <BudgetComparisonWidget />
        )}
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
