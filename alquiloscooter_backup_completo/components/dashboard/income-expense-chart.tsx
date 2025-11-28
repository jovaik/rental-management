

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ChartData {
  revenueByPeriod: Record<string, number>;
  expensesByPeriod: Record<string, number>;
  period: string;
}

export function IncomeExpenseChart() {
  const [period, setPeriod] = useState('yearly');
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/stats?period=${period}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ingresos vs Gastos
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

  // Prepare data for chart
  const labels = Object.keys(data.revenueByPeriod);
  const revenues = Object.values(data.revenueByPeriod);
  const expenses = Object.values(data.expensesByPeriod);

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...revenues,
    ...expenses.map(e => data.expensesByPeriod[Object.keys(data.expensesByPeriod)[expenses.indexOf(e)]] || 0)
  );

  // Calculate totals
  const totalRevenue = revenues.reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(data.expensesByPeriod).reduce((sum, val) => sum + val, 0);
  const balance = totalRevenue - totalExpenses;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Ingresos vs Gastos ({period === 'yearly' ? 'Año Actual' : period === 'monthly' ? 'Mes Actual' : period === 'weekly' ? 'Última Semana' : 'Hoy'})</span>
          </CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Gastos</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`rounded-lg p-4 ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              <span className={`text-sm font-medium ${balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>Balance</span>
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="relative">
          <div className="space-y-3">
            {labels.map((label, index) => {
              const revenue = revenues[index] || 0;
              const expense = data.expensesByPeriod[label] || 0;
              const maxBar = Math.max(revenue, expense);
              
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 w-20">{label}</span>
                    <div className="flex-1 ml-4 space-y-1">
                      {/* Revenue Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${maxValue > 0 ? (revenue / maxValue) * 100 : 0}%` }}
                          >
                            {revenue > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Expense Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${maxValue > 0 ? (expense / maxValue) * 100 : 0}%` }}
                          >
                            {expense > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(expense)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600"></div>
              <span className="text-sm text-gray-600">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
              <span className="text-sm text-gray-600">Gastos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
