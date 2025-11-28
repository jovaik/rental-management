'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface BudgetComparison {
  period: 'monthly' | 'yearly';
  year: number;
  month?: number;
  budget: {
    income: number;
    expenses: number;
    balance: number;
  };
  actual: {
    income: number;
    expenses: number;
    balance: number;
  };
  deviation: {
    income: number;
    expenses: number;
    balance: number;
    incomePercent: number;
    expensesPercent: number;
  };
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function BudgetComparisonWidget() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [comparison, setComparison] = useState<BudgetComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [noBudget, setNoBudget] = useState(false);

  useEffect(() => {
    fetchComparison();
  }, [selectedYear, selectedMonth]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setNoBudget(false);
      const response = await fetch(`/api/budgets/comparison?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setComparison(data);
        // Si no hay presupuesto configurado, los valores de budget serán 0
        if (data.budget.income === 0 && data.budget.expenses === 0) {
          setNoBudget(true);
        }
      }
    } catch (error) {
      console.error('Error fetching budget comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviationColor = (percent: number, isExpense: boolean = false) => {
    // Para gastos, invertir los colores (menos gasto = bueno)
    const effectivePercent = isExpense ? -percent : percent;
    if (effectivePercent > 0) return 'text-green-600';
    if (effectivePercent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDeviationIcon = (percent: number, isExpense: boolean = false) => {
    const effectivePercent = isExpense ? -percent : percent;
    if (effectivePercent > 0) return <TrendingUp className="h-4 w-4" />;
    if (effectivePercent < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  // Generar opciones de años (año actual ± 1)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            Presupuesto vs Realidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (noBudget) {
    return (
      <Card className="shadow-sm border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            Presupuesto vs Realidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm mb-4">
              No hay presupuesto configurado para {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
            <Link
              href="/financiero/presupuestos"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Configurar Presupuesto
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            Presupuesto vs Realidad
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Ingresos */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ingresos</span>
              <div className="flex items-center gap-1">
                {getDeviationIcon(comparison.deviation.incomePercent)}
                <span className={`text-xs font-semibold ${getDeviationColor(comparison.deviation.incomePercent)}`}>
                  {comparison.deviation.incomePercent >= 0 ? '+' : ''}{comparison.deviation.incomePercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Presupuesto:</span>
                <span className="font-semibold">{formatCurrency(comparison.budget.income)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Real:</span>
                <span className="font-semibold">{formatCurrency(comparison.actual.income)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Desviación:</span>
                  <span className={`font-bold ${getDeviationColor(comparison.deviation.incomePercent)}`}>
                    {comparison.deviation.income >= 0 ? '+' : ''}{formatCurrency(comparison.deviation.income)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Gastos</span>
              <div className="flex items-center gap-1">
                {getDeviationIcon(comparison.deviation.expensesPercent, true)}
                <span className={`text-xs font-semibold ${getDeviationColor(comparison.deviation.expensesPercent, true)}`}>
                  {comparison.deviation.expensesPercent >= 0 ? '+' : ''}{comparison.deviation.expensesPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Presupuesto:</span>
                <span className="font-semibold">{formatCurrency(comparison.budget.expenses)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Real:</span>
                <span className="font-semibold">{formatCurrency(comparison.actual.expenses)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-red-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Desviación:</span>
                  <span className={`font-bold ${getDeviationColor(comparison.deviation.expensesPercent, true)}`}>
                    {comparison.deviation.expenses >= 0 ? '+' : ''}{formatCurrency(comparison.deviation.expenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Balance</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Presupuesto:</span>
                <span className="font-semibold">{formatCurrency(comparison.budget.balance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Real:</span>
                <span className="font-semibold">{formatCurrency(comparison.actual.balance)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-blue-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Desviación:</span>
                  <span className={`font-bold ${getDeviationColor(comparison.deviation.balance)}`}>
                    {comparison.deviation.balance >= 0 ? '+' : ''}{formatCurrency(comparison.deviation.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Link a la página completa */}
          <Link
            href="/financiero/presupuestos"
            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
          >
            Ver detalles completos →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
