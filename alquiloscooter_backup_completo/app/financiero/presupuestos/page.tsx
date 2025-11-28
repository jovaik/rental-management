'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Save, AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface BudgetLineItem {
  id: number;
  budget_id: number;
  type: string;
  category: string;
  subcategory: string | null;
  budgeted_amount: string;
  notes: string | null;
}

interface Budget {
  id: number;
  year: number;
  month: number;
  budgeted_income: string;
  budgeted_expenses: string;
  notes: string | null;
  lineItems?: BudgetLineItem[];
}

interface ComparisonLine {
  category: string;
  subcategory?: string | null;
  budgeted: number;
  actual: number;
  deviation: number;
  deviationPercent: number;
}

interface DetailedComparison {
  year: number;
  month: number;
  hasBudget: boolean;
  incomeLines: ComparisonLine[];
  expenseLines: ComparisonLine[];
  totals: {
    budgetedIncome: number;
    actualIncome: number;
    incomeDeviation: number;
    incomeDeviationPercent: number;
    budgetedExpenses: number;
    actualExpenses: number;
    expenseDeviation: number;
    expenseDeviationPercent: number;
    budgetedBalance: number;
    actualBalance: number;
    balanceDeviation: number;
    balanceDeviationPercent: number;
  };
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

// Categorías de ingresos por grupos tarifarios
const INCOME_CATEGORIES = [
  { key: '1', label: 'Grupo 1', icon: '🛵' },
  { key: '2', label: 'Grupo 2', icon: '🛵' },
  { key: '3', label: 'Grupo 3', icon: '🛵' },
  { key: '4', label: 'Grupo 4', icon: '🛵' },
  { key: '5', label: 'Grupo 5', icon: '🛵' },
  { key: '6', label: 'Grupo 6', icon: '🛵' },
  { key: 'Extras', label: 'Extras', icon: '➕' },
];

// Categorías de gastos (del sistema actual)
const EXPENSE_CATEGORIES = [
  { key: 'Combustible', label: 'Combustible', icon: '⛽' },
  { key: 'Mantenimiento', label: 'Mantenimiento', icon: '🔧' },
  { key: 'Alquiler/Renting motos', label: 'Alquiler/Renting motos', icon: '🛵' },
  { key: 'Motos (Reparaciones, revisiones y repuestos)', label: 'Motos (Reparaciones, revisiones y repuestos)', icon: '🔧' },
  { key: 'Alquiler', label: 'Alquiler', icon: '🏢' },
  { key: 'Seguros', label: 'Seguros', icon: '🛡️' },
  { key: 'Limpieza', label: 'Limpieza', icon: '🧹' },
  { key: 'Suministros', label: 'Suministros', icon: '💡' },
  { key: 'Administración', label: 'Administración', icon: '📋' },
  { key: 'Comisiones', label: 'Comisiones (propietarios/colaboradores)', icon: '💰' },
  { key: 'Marketing y Publicidad', label: 'Marketing y Publicidad', icon: '📢' },
  { key: 'Personal', label: 'Personal', icon: '👥' },
  { key: 'Asesoría', label: 'Asesoría', icon: '💼' },
  { key: 'Autónomo', label: 'Autónomo', icon: '👤' },
  { key: 'Seg.Social', label: 'Seg.Social', icon: '🏛️' },
  { key: 'Otros', label: 'Otros', icon: '📦' },
];

export default function PresupuestosPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [comparison, setComparison] = useState<DetailedComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'budget'>('comparison');
  
  // Formulario de presupuesto (valores por categoría)
  const [incomeValues, setIncomeValues] = useState<Record<string, string>>({});
  const [expenseValues, setExpenseValues] = useState<Record<string, string>>({});
  
  // Subcuentas de Personal (empleados dinámicos)
  const [personalSubcuentas, setPersonalSubcuentas] = useState<Array<{ name: string; amount: string }>>([
    { name: 'Empleado 1', amount: '0' }
  ]);
  
  // Subcuentas de Autónomo (fijas)
  const [autonomoRecibo, setAutonomoRecibo] = useState('0');
  const [autonomoGastos, setAutonomoGastos] = useState('0');

  // Cargar datos al cambiar mes/año
  useEffect(() => {
    fetchBudget();
    fetchDetailedComparison();
  }, [selectedYear, selectedMonth]);

  const fetchBudget = async () => {
    try {
      // Buscar presupuesto con líneas detalladas
      const response = await fetch(
        `/api/budgets?year=${selectedYear}&month=${selectedMonth}&detailed=true`
      );
      if (response.ok) {
        const budgets = await response.json();
        if (budgets.length > 0) {
          const currentBudget = budgets[0];
          setBudget(currentBudget);
          
          // Cargar valores existentes en el formulario
          if (currentBudget.lineItems) {
            const newIncomeValues: Record<string, string> = {};
            const newExpenseValues: Record<string, string> = {};
            const personalSubs: Array<{ name: string; amount: string }> = [];
            let autonomoReciboVal = '0';
            let autonomoGastosVal = '0';
            
            currentBudget.lineItems.forEach((line: BudgetLineItem) => {
              const amount = parseFloat(line.budgeted_amount).toFixed(2);
              
              if (line.type === 'income') {
                newIncomeValues[line.category] = amount;
              } else {
                // Manejar subcuentas de Personal
                if (line.category === 'Personal' && line.subcategory) {
                  personalSubs.push({ name: line.subcategory, amount });
                } 
                // Manejar subcuentas de Autónomo
                else if (line.category === 'Autónomo' && line.subcategory) {
                  if (line.subcategory === 'Recibo Aut.') {
                    autonomoReciboVal = amount;
                  } else if (line.subcategory === 'Gastos Aut.') {
                    autonomoGastosVal = amount;
                  }
                }
                // Categorías sin subcuentas
                else if (!line.subcategory) {
                  newExpenseValues[line.category] = amount;
                }
              }
            });
            
            setIncomeValues(newIncomeValues);
            setExpenseValues(newExpenseValues);
            
            // Cargar subcuentas de Personal o inicializar con una vacía
            if (personalSubs.length > 0) {
              setPersonalSubcuentas(personalSubs);
            } else {
              setPersonalSubcuentas([{ name: 'Empleado 1', amount: '0' }]);
            }
            
            // Cargar subcuentas de Autónomo
            setAutonomoRecibo(autonomoReciboVal);
            setAutonomoGastos(autonomoGastosVal);
          }
        } else {
          setBudget(null);
          setIncomeValues({});
          setExpenseValues({});
          setPersonalSubcuentas([{ name: 'Empleado 1', amount: '0' }]);
          setAutonomoRecibo('0');
          setAutonomoGastos('0');
        }
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const fetchDetailedComparison = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/budgets/detailed-comparison?year=${selectedYear}&month=${selectedMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        setComparison(data);
      }
    } catch (error) {
      console.error('Error fetching detailed comparison:', error);
      toast.error('Error al cargar la comparación');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      setSaving(true);

      // Preparar líneas de ingreso
      const income_lines = INCOME_CATEGORIES
        .filter(cat => incomeValues[cat.key] && parseFloat(incomeValues[cat.key]) > 0)
        .map(cat => ({
          category: cat.key,
          subcategory: null,
          amount: parseFloat(incomeValues[cat.key])
        }));

      // Preparar líneas de gasto
      const expense_lines: Array<{ category: string; subcategory: string | null; amount: number }> = [];
      
      EXPENSE_CATEGORIES.forEach(cat => {
        // Categoría Personal con subcuentas
        if (cat.key === 'Personal') {
          personalSubcuentas.forEach(sub => {
            if (sub.amount && parseFloat(sub.amount) > 0) {
              expense_lines.push({
                category: 'Personal',
                subcategory: sub.name,
                amount: parseFloat(sub.amount)
              });
            }
          });
        }
        // Categoría Autónomo con subcuentas fijas
        else if (cat.key === 'Autónomo') {
          if (autonomoRecibo && parseFloat(autonomoRecibo) > 0) {
            expense_lines.push({
              category: 'Autónomo',
              subcategory: 'Recibo Aut.',
              amount: parseFloat(autonomoRecibo)
            });
          }
          if (autonomoGastos && parseFloat(autonomoGastos) > 0) {
            expense_lines.push({
              category: 'Autónomo',
              subcategory: 'Gastos Aut.',
              amount: parseFloat(autonomoGastos)
            });
          }
        }
        // Categorías sin subcuentas
        else if (expenseValues[cat.key] && parseFloat(expenseValues[cat.key]) > 0) {
          expense_lines.push({
            category: cat.key,
            subcategory: null,
            amount: parseFloat(expenseValues[cat.key])
          });
        }
      });

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          income_lines,
          expense_lines,
          notes: ''
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el presupuesto');
      }

      toast.success('Presupuesto guardado correctamente');
      
      // Recargar datos
      await fetchBudget();
      await fetchDetailedComparison();
      
      // Cambiar a tab de comparación
      setActiveTab('comparison');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Error al guardar el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  const renderComparisonRow = (item: ComparisonLine, isIncome: boolean, index: number) => {
    const isPositive = isIncome
      ? item.deviation > 0
      : item.deviation < 0; // Para gastos, negativo es bueno
    
    const isSubcategory = item.subcategory !== null && item.subcategory !== undefined;
    const displayName = isSubcategory ? `↳ ${item.subcategory}` : item.category;

    return (
      <div 
        key={`${item.category}-${item.subcategory || ''}-${index}`} 
        className={`grid grid-cols-5 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50 ${isSubcategory ? 'bg-gray-50 text-sm' : ''}`}
      >
        <div className={`font-medium ${isSubcategory ? 'text-gray-700 pl-6' : 'text-gray-900'}`}>
          {displayName}
        </div>
        <div className="text-right text-gray-700">
          {formatCurrency(item.budgeted)}
        </div>
        <div className="text-right text-gray-900 font-medium">
          {isSubcategory ? '-' : formatCurrency(item.actual)}
        </div>
        <div className={`text-right font-medium ${isSubcategory ? 'text-gray-400' : (isPositive ? 'text-green-600' : 'text-red-600')}`}>
          {isSubcategory ? '-' : (item.deviation >= 0 ? '+' : '') + formatCurrency(item.deviation)}
        </div>
        <div className={`text-right font-medium ${isSubcategory ? 'text-gray-400' : (isPositive ? 'text-green-600' : 'text-red-600')}`}>
          {isSubcategory ? '-' : (item.deviation >= 0 ? '+' : '') + item.deviationPercent.toFixed(1) + '%'}
        </div>
      </div>
    );
  };

  if (!session?.user) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Debes iniciar sesión para ver esta página</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Botones de Navegación */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus presupuestos y analiza desviaciones</p>
        </div>
        <div className="flex gap-4">
          <Select
            value={String(selectedMonth)}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'budget' | 'comparison')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Presupuesto vs Realidad</TabsTrigger>
          <TabsTrigger value="budget">Configurar Presupuesto</TabsTrigger>
        </TabsList>

        {/* TAB: Comparación */}
        <TabsContent value="comparison" className="space-y-6 mt-6">
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              </CardContent>
            </Card>
          ) : !comparison?.hasBudget ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay presupuesto configurado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Configura un presupuesto para {MONTHS[selectedMonth - 1].label} {selectedYear}
                  </p>
                  <Button onClick={() => setActiveTab('budget')}>
                    Crear Presupuesto
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumen general */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">INGRESOS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Presupuesto:</span>
                        <span className="font-medium">{formatCurrency(comparison.totals.budgetedIncome)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Real:</span>
                        <span className="font-medium">{formatCurrency(comparison.totals.actualIncome)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Desviación:</span>
                          <div className="text-right">
                            <div className={`font-bold ${comparison.totals.incomeDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.totals.incomeDeviation >= 0 ? '+' : ''}{formatCurrency(comparison.totals.incomeDeviation)}
                            </div>
                            <div className={`text-xs ${comparison.totals.incomeDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.totals.incomeDeviation >= 0 ? '+' : ''}{comparison.totals.incomeDeviationPercent.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">GASTOS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Presupuesto:</span>
                        <span className="font-medium">{formatCurrency(comparison.totals.budgetedExpenses)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Real:</span>
                        <span className="font-medium">{formatCurrency(comparison.totals.actualExpenses)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Desviación:</span>
                          <div className="text-right">
                            <div className={`font-bold ${comparison.totals.expenseDeviation <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.totals.expenseDeviation >= 0 ? '+' : ''}{formatCurrency(comparison.totals.expenseDeviation)}
                            </div>
                            <div className={`text-xs ${comparison.totals.expenseDeviation <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.totals.expenseDeviation >= 0 ? '+' : ''}{comparison.totals.expenseDeviationPercent.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">BALANCE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Presupuesto:</span>
                        <span className="font-medium">{formatCurrency(comparison.totals.budgetedBalance)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Real:</span>
                        <span className="font-medium">{formatCurrency(comparison.totals.actualBalance)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Desviación:</span>
                          <div className="text-right">
                            <div className={`font-bold ${comparison.totals.balanceDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.totals.balanceDeviation >= 0 ? '+' : ''}{formatCurrency(comparison.totals.balanceDeviation)}
                            </div>
                            <div className={`text-xs ${comparison.totals.balanceDeviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparison.totals.balanceDeviation >= 0 ? '+' : ''}{comparison.totals.balanceDeviationPercent.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* INGRESOS Detalle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Ingresos por Grupo Tarifario
                  </CardTitle>
                  <CardDescription>Análisis detallado de ingresos por grupo de vehículos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-5 gap-4 pb-2 border-b-2 border-gray-300 font-semibold text-sm text-gray-600">
                      <div>GRUPO</div>
                      <div className="text-right">PRESUPUESTO</div>
                      <div className="text-right">REAL</div>
                      <div className="text-right">DESVIACIÓN (€)</div>
                      <div className="text-right">DESVIACIÓN (%)</div>
                    </div>
                    {/* Rows */}
                    {comparison.incomeLines.length > 0 ? (
                      comparison.incomeLines.map((item, index) => renderComparisonRow(item, true, index))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        No hay líneas de ingreso presupuestadas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* GASTOS Detalle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Gastos por Categoría
                  </CardTitle>
                  <CardDescription>Análisis detallado de gastos operativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-5 gap-4 pb-2 border-b-2 border-gray-300 font-semibold text-sm text-gray-600">
                      <div>CATEGORÍA</div>
                      <div className="text-right">PRESUPUESTO</div>
                      <div className="text-right">REAL</div>
                      <div className="text-right">DESVIACIÓN (€)</div>
                      <div className="text-right">DESVIACIÓN (%)</div>
                    </div>
                    {/* Rows */}
                    {comparison.expenseLines.length > 0 ? (
                      comparison.expenseLines.map((item, index) => renderComparisonRow(item, false, index))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        No hay líneas de gasto presupuestadas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB: Configurar Presupuesto */}
        <TabsContent value="budget" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configurar Presupuesto Mensual</span>
                {budget && (
                  <span className="text-sm font-normal text-green-600 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Editando presupuesto existente
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Define tu presupuesto detallado para {MONTHS[selectedMonth - 1].label} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* INGRESOS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Ingresos por Grupo Tarifario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INCOME_CATEGORIES.map((cat) => (
                    <div key={cat.key}>
                      <Label htmlFor={`income_${cat.key}`} className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Label>
                      <Input
                        id={`income_${cat.key}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={incomeValues[cat.key] || ''}
                        onChange={(e) => setIncomeValues(prev => ({ ...prev, [cat.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* GASTOS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-5 w-5" />
                  Gastos por Categoría
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    // Categoría Personal con subcuentas dinámicas
                    if (cat.key === 'Personal') {
                      return (
                        <div key={cat.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <Label className="flex items-center gap-2 font-semibold text-base mb-3">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </Label>
                          <div className="space-y-2">
                            {personalSubcuentas.map((sub, index) => (
                              <div key={index} className="flex gap-2 items-center bg-white p-2 rounded">
                                <Input
                                  type="text"
                                  placeholder="Nombre empleado"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const newSubs = [...personalSubcuentas];
                                    newSubs[index].name = e.target.value;
                                    setPersonalSubcuentas(newSubs);
                                  }}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={sub.amount}
                                  onChange={(e) => {
                                    const newSubs = [...personalSubcuentas];
                                    newSubs[index].amount = e.target.value;
                                    setPersonalSubcuentas(newSubs);
                                  }}
                                  className="w-32"
                                />
                                {personalSubcuentas.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newSubs = personalSubcuentas.filter((_, i) => i !== index);
                                      setPersonalSubcuentas(newSubs);
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    ✕
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPersonalSubcuentas([
                                  ...personalSubcuentas,
                                  { name: `Empleado ${personalSubcuentas.length + 1}`, amount: '0' }
                                ]);
                              }}
                              className="w-full"
                            >
                              + Añadir Empleado
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    // Categoría Autónomo con subcuentas fijas
                    if (cat.key === 'Autónomo') {
                      return (
                        <div key={cat.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <Label className="flex items-center gap-2 font-semibold text-base mb-3">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="autonomo_recibo" className="text-sm text-gray-600">
                                Recibo Aut.
                              </Label>
                              <Input
                                id="autonomo_recibo"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={autonomoRecibo}
                                onChange={(e) => setAutonomoRecibo(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="autonomo_gastos" className="text-sm text-gray-600">
                                Gastos Aut.
                              </Label>
                              <Input
                                id="autonomo_gastos"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={autonomoGastos}
                                onChange={(e) => setAutonomoGastos(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Categorías normales sin subcuentas
                    return (
                      <div key={cat.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <Label htmlFor={`expense_${cat.key}`} className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </Label>
                        <Input
                          id={`expense_${cat.key}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={expenseValues[cat.key] || ''}
                          onChange={(e) => setExpenseValues(prev => ({ ...prev, [cat.key]: e.target.value }))}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-4 border-t gap-3">
                {budget && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIncomeValues({});
                      setExpenseValues({});
                      setPersonalSubcuentas([{ name: 'Empleado 1', amount: '0' }]);
                      setAutonomoRecibo('0');
                      setAutonomoGastos('0');
                      toast.success('Formulario limpiado');
                    }}
                  >
                    Limpiar Formulario
                  </Button>
                )}
                <Button
                  onClick={handleSaveBudget}
                  disabled={saving}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {budget ? 'Actualizar' : 'Guardar'} Presupuesto
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
