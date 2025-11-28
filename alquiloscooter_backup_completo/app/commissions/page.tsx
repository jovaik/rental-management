
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CommissionVehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  owner_name: string;
  owner_contact: string;
  commission_percentage: number;
  monthly_fixed_costs: number;
}

interface CommissionReport {
  vehicle_id: number;
  vehicle_name: string;
  owner_name: string;
  total_income: number;
  fixed_costs: number;
  net_income: number;
  commission_percentage: number;
  commission_amount: number;
  our_share: number;
  bookings_count: number;
}

export default function CommissionsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [vehicles, setVehicles] = useState<CommissionVehicle[]>([]);
  const [reports, setReports] = useState<CommissionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar solo vehículos en cesión a comisión (propietarios o colaboradores)
      const vehiclesRes = await fetch('/api/vehicles');
      if (!vehiclesRes.ok) throw new Error('Error loading vehicles');
      
      const allVehicles = await vehiclesRes.json();
      // Filtrar solo vehículos que están cedidos a colaboradores o son de propietarios
      const commissionVehicles = allVehicles.filter((v: any) => 
        v.ownership_type === 'commission' && 
        (v.owner_name || v.depositor_name) // Solo si tienen propietario o colaborador asignado
      );
      setVehicles(commissionVehicles);

      // Calcular reportes para el mes seleccionado
      const reportsData = await calculateReports(commissionVehicles);
      setReports(reportsData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateReports = async (vehicles: CommissionVehicle[]): Promise<CommissionReport[]> => {
    const reports: CommissionReport[] = [];

    for (const vehicle of vehicles) {
      // Obtener reservas del vehículo para el mes seleccionado
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      const bookingsRes = await fetch(
        `/api/bookings?car_id=${vehicle.id}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      
      if (!bookingsRes.ok) continue;
      
      const bookings = await bookingsRes.json();
      
      // Calcular ingresos totales
      const total_income = bookings.reduce((sum: number, b: any) => 
        sum + (parseFloat(b.total_price?.toString() || '0')), 0
      );
      
      const fixed_costs = parseFloat(vehicle.monthly_fixed_costs?.toString() || '0');
      const net_income = total_income - fixed_costs;
      const commission_percentage = parseFloat(vehicle.commission_percentage?.toString() || '0');
      const commission_amount = (net_income * commission_percentage) / 100;
      const our_share = net_income - commission_amount;

      reports.push({
        vehicle_id: vehicle.id,
        vehicle_name: `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model}`,
        owner_name: vehicle.owner_name || 'Sin propietario',
        total_income,
        fixed_costs,
        net_income,
        commission_percentage,
        commission_amount,
        our_share,
        bookings_count: bookings.length
      });
    }

    return reports;
  };

  const getTotalStats = () => {
    const total_income = reports.reduce((sum, r) => sum + r.total_income, 0);
    const total_fixed_costs = reports.reduce((sum, r) => sum + r.fixed_costs, 0);
    const total_net = reports.reduce((sum, r) => sum + r.net_income, 0);
    const total_commissions = reports.reduce((sum, r) => sum + r.commission_amount, 0);
    const total_our_share = reports.reduce((sum, r) => sum + r.our_share, 0);
    
    return {
      total_income,
      total_fixed_costs,
      total_net,
      total_commissions,
      total_our_share
    };
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (!mounted) return null;

  const stats = getTotalStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Gestión de Comisiones</h1>
          <p className="text-gray-600 mt-1">
            Cálculo de comisiones para vehículos cedidos a colaboradores y propietarios
          </p>
        </div>
      </div>

      {/* Selector de período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar Período
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-48">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadData} disabled={loading}>
            {loading ? 'Calculando...' : 'Actualizar'}
          </Button>
        </CardContent>
      </Card>

      {/* Resumen Total */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_income.toFixed(2)} €</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gastos Fijos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{stats.total_fixed_costs.toFixed(2)} €</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Beneficio Neto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total_net.toFixed(2)} €</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Comisiones Propietarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.total_commissions.toFixed(2)} €</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nuestra Parte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.total_our_share.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Información */}
      {vehicles.length === 0 && !loading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">No hay vehículos con comisiones activas</h3>
              <p className="text-sm text-yellow-700 mb-2">
                Este sistema calcula comisiones únicamente para:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li><strong>Vehículos de propietarios:</strong> En cesión a comisión para darles cuentas</li>
                <li><strong>Vehículos en manos de colaboradores:</strong> Cedidos para operación a comisión</li>
              </ul>
              <p className="text-sm text-yellow-700 mt-2">
                Los vehículos propios o en renting no aparecen aquí, excepto que estén cedidos a un colaborador.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de reportes por vehículo */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vehículo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Propietario</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Reservas</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ingresos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gastos Fijos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Neto</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Comisión %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">A Pagar</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Nuestro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.vehicle_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.vehicle_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.owner_name}</td>
                      <td className="px-4 py-3 text-sm text-right">{report.bookings_count}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                        {report.total_income.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        -{report.fixed_costs.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {report.net_income.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Badge variant="secondary">{report.commission_percentage}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                        {report.commission_amount.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-purple-600">
                        {report.our_share.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explicación del sistema */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Cómo funciona el sistema de comisiones</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1. Ingresos:</strong> Suma de todas las reservas completadas del vehículo en el período seleccionado.</p>
            <p><strong>2. Gastos Fijos:</strong> Costes mensuales del vehículo (configurados en la ficha del vehículo).</p>
            <p><strong>3. Beneficio Neto:</strong> Ingresos - Gastos Fijos.</p>
            <p><strong>4. Comisión:</strong> Se aplica el porcentaje de comisión sobre el beneficio neto.</p>
            <p><strong>5. Reparto:</strong> El propietario recibe su comisión y nosotros el resto del beneficio neto.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
