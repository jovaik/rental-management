
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Euro, Filter, Download, Package, Wrench, Car, Search, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ExpenseModal } from '@/components/modals/expense-modal';

interface Expense {
  id: number;
  expense_category: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier?: string;
  purchase_date?: Date;
  maintenance?: {
    id: number;
    title: string;
    vehicle: {
      registration_number: string;
      make: string;
      model: string;
    };
  };
  invoice_number?: string;
  warranty_months?: number;
  description?: string;
}

export default function ExpensesPage() {
  const { data: session, status } = useSession() || {};
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadExpenses();
    }
  }, [mounted]);

  const loadExpenses = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Cargar gastos desde la API
      const response = await fetch('/api/expenses?limit=100');
      if (!response.ok) {
        throw new Error('Error cargando gastos');
      }
      
      const data = await response.json();
      const expensesData = data.expenses || [];
      
      // Transformar los datos para que coincidan con la interfaz
      const transformedExpenses = expensesData.map((e: any) => ({
        id: e.id,
        expense_category: e.expense_category,
        item_name: e.item_name,
        quantity: parseFloat(e.quantity),
        unit_price: parseFloat(e.unit_price),
        total_price: parseFloat(e.total_price),
        supplier: e.supplier,
        purchase_date: e.purchase_date ? new Date(e.purchase_date) : undefined,
        maintenance: e.maintenance ? {
          id: e.maintenance.id,
          title: e.maintenance.title,
          vehicle: e.maintenance.car ? {
            registration_number: e.maintenance.car.registration_number,
            make: e.maintenance.car.make,
            model: e.maintenance.car.model
          } : null
        } : null,
        invoice_number: e.invoice_number,
        warranty_months: e.warranty_months,
        description: e.description
      }));
      
      setExpenses(transformedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      // Si hay error, mostrar array vacío
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExpensesOLD = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Simular delay de API para testing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar si hay gastos guardados
      const savedExpenses = localStorage.getItem('expenses');
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        const withDates = parsed.map((e: any) => ({
          ...e,
          purchase_date: e.purchase_date ? new Date(e.purchase_date) : undefined
        }));
        setExpenses(withDates);
      } else {
        // Datos de ejemplo solo si no hay gastos guardados
        const mockExpenses: Expense[] = [
        {
          id: 1,
          expense_category: 'Repuestos',
          item_name: 'Pastillas de freno delanteras',
          quantity: 1,
          unit_price: 85.50,
          total_price: 85.50,
          supplier: 'AutoRepuestos Madrid',
          purchase_date: new Date('2024-03-18'),
          maintenance: {
            id: 2,
            title: 'Reparación de frenos',
            vehicle: {
              registration_number: '5678DEF',
              make: 'Seat',
              model: 'León'
            }
          },
          invoice_number: 'ARM-2024-0845',
          warranty_months: 12,
          description: 'Pastillas de freno cerámicas marca Brembo'
        },
        {
          id: 2,
          expense_category: 'Mano de obra',
          item_name: 'Instalación pastillas de freno',
          quantity: 2,
          unit_price: 45.00,
          total_price: 90.00,
          supplier: 'Taller García Hermanos',
          purchase_date: new Date('2024-03-18'),
          maintenance: {
            id: 2,
            title: 'Reparación de frenos',
            vehicle: {
              registration_number: '5678DEF',
              make: 'Seat',
              model: 'León'
            }
          },
          invoice_number: 'TGH-2024-1205',
          description: 'Mano de obra especializada para cambio de pastillas'
        },
        {
          id: 3,
          expense_category: 'Combustible',
          item_name: 'Aceite motor 5W-30',
          quantity: 4,
          unit_price: 12.25,
          total_price: 49.00,
          supplier: 'Lubricantes Express',
          purchase_date: new Date('2024-03-20'),
          maintenance: {
            id: 1,
            title: 'Cambio de aceite y filtros',
            vehicle: {
              registration_number: '1234ABC',
              make: 'Toyota',
              model: 'Corolla'
            }
          },
          invoice_number: 'LUB-2024-0692',
          warranty_months: 6,
          description: 'Aceite sintético alta calidad'
        },
        {
          id: 4,
          expense_category: 'Repuestos',
          item_name: 'Filtro de aceite',
          quantity: 1,
          unit_price: 18.75,
          total_price: 18.75,
          supplier: 'Lubricantes Express',
          purchase_date: new Date('2024-03-20'),
          maintenance: {
            id: 1,
            title: 'Cambio de aceite y filtros',
            vehicle: {
              registration_number: '1234ABC',
              make: 'Toyota',
              model: 'Corolla'
            }
          },
          invoice_number: 'LUB-2024-0693',
          warranty_months: 6,
          description: 'Filtro OEM compatible'
        },
        {
          id: 5,
          expense_category: 'Neumáticos',
          item_name: 'Neumático 205/55R16',
          quantity: 4,
          unit_price: 68.50,
          total_price: 274.00,
          supplier: 'Neumáticos del Sur',
          purchase_date: new Date('2024-03-12'),
          maintenance: {
            id: 4,
            title: 'Cambio de neumáticos',
            vehicle: {
              registration_number: '3456JKL',
              make: 'Peugeot',
              model: '208'
            }
          },
          invoice_number: 'NDS-2024-0347',
          warranty_months: 24,
          description: 'Neumáticos de verano marca Michelin'
        },
        {
          id: 6,
          expense_category: 'Limpieza',
          item_name: 'Productos de limpieza profesional',
          quantity: 1,
          unit_price: 45.80,
          total_price: 45.80,
          supplier: 'Clean Car Supplies',
          purchase_date: new Date('2024-03-25'),
          maintenance: {
            id: 5,
            title: 'Limpieza interior profunda',
            vehicle: {
              registration_number: '7890MNO',
              make: 'Renault',
              model: 'Clio'
            }
          },
          invoice_number: 'CCS-2024-0156',
          description: 'Kit completo de limpieza y desinfección'
        }
        ];
        
        setExpenses(mockExpenses);
        localStorage.setItem('expenses', JSON.stringify(mockExpenses));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.maintenance?.vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    const matchesCategory = categoryFilter === 'all' || expense.expense_category === categoryFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && expense.purchase_date) {
      const now = new Date();
      const expenseDate = expense.purchase_date;
      
      switch (dateFilter) {
        case 'last_week':
          matchesDate = (now.getTime() - expenseDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_month':
          matchesDate = (now.getTime() - expenseDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
          break;
        case 'last_quarter':
          matchesDate = (now.getTime() - expenseDate.getTime()) <= (90 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
  };

  const handleNewExpenseClick = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpenseClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (expenseData: any) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo crear el gasto'}`);
        return;
      }

      const data = await response.json();
      console.log('Gasto creado:', data);
      
      // Recargar la lista de gastos
      await loadExpenses();
      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error al guardar el gasto');
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }

    try {
      // Por ahora solo eliminar del estado local
      // TODO: Implementar DELETE en la API si es necesario
      const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
      setExpenses(updatedExpenses);
      alert('Gasto eliminado (nota: esto es solo local, implementa DELETE en la API)');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error al eliminar el gasto');
    }
  };

  const handleExportClick = () => {
    // Crear CSV de gastos
    const headers = ['Fecha', 'Categoría', 'Artículo', 'Cantidad', 'Precio Unitario', 'Total', 'Proveedor', 'Factura'];
    const csvData = expenses.map(expense => [
      expense.purchase_date ? formatDate(expense.purchase_date) : '',
      expense.expense_category,
      expense.item_name,
      expense.quantity,
      expense.unit_price,
      expense.total_price,
      expense.supplier || '',
      expense.invoice_number || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'repuestos': return Package;
      case 'mano de obra': return Wrench;
      case 'neumáticos': return Car;
      case 'combustible': return Euro;
      case 'limpieza': return Package;
      default: return Package;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'repuestos': return 'bg-blue-100 text-blue-800';
      case 'mano de obra': return 'bg-orange-100 text-orange-800';
      case 'neumáticos': return 'bg-purple-100 text-purple-800';
      case 'combustible': return 'bg-green-100 text-green-800';
      case 'limpieza': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.total_price, 0);
  const categories = [...new Set(expenses.map(e => e.expense_category))];

  // No renderizar hasta que esté montado para evitar errores de hidración
  if (!mounted || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Euro className="h-7 w-7 text-green-600" />
            Control de Gastos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona y analiza los gastos de mantenimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportClick}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleNewExpenseClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gastos</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{totalExpenses.toFixed(2)}
                </p>
              </div>
              <Euro className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repuestos</p>
                <p className="text-2xl font-bold text-blue-600">
                  €{expenses.filter(e => e.expense_category === 'Repuestos')
                    .reduce((sum, e) => sum + e.total_price, 0).toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mano de Obra</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{expenses.filter(e => e.expense_category === 'Mano de obra')
                    .reduce((sum, e) => sum + e.total_price, 0).toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registros</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredExpenses.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por artículo, categoría, proveedor o vehículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el período</SelectItem>
                <SelectItem value="last_week">Última semana</SelectItem>
                <SelectItem value="last_month">Último mes</SelectItem>
                <SelectItem value="last_quarter">Último trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Euro className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron gastos
              </h3>
              <p className="text-gray-500">
                {searchTerm || categoryFilter !== 'all' || dateFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Registra tu primer gasto para comenzar'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExpenses.map((expense) => {
            const CategoryIcon = getCategoryIcon(expense.expense_category);
            
            return (
              <Card 
                key={expense.id} 
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {expense.item_name}
                            </h3>
                            <Badge className={getCategoryColor(expense.expense_category)} variant="secondary">
                              {expense.expense_category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              €{expense.total_price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {expense.quantity} × €{expense.unit_price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {expense.maintenance && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Car className="h-4 w-4" />
                            <span>
                              {expense.maintenance.vehicle.registration_number} - {expense.maintenance.title}
                            </span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          {expense.supplier && (
                            <div>
                              <span className="font-medium">Proveedor:</span> {expense.supplier}
                            </div>
                          )}
                          {expense.purchase_date && (
                            <div>
                              <span className="font-medium">Fecha:</span> {formatDate(expense.purchase_date)}
                            </div>
                          )}
                          {expense.invoice_number && (
                            <div>
                              <span className="font-medium">Factura:</span> {expense.invoice_number}
                            </div>
                          )}
                        </div>

                        {expense.description && (
                          <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                        )}
                        
                        {expense.warranty_months && (
                          <div className="text-xs text-gray-500">
                            Garantía: {expense.warranty_months} meses
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditExpenseClick(expense);
                        }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExpense(expense.id);
                        }}
                        title="Eliminar gasto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de gastos */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
}
