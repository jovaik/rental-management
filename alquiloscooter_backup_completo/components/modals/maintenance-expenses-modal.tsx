
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Euro, Edit, X, Check, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SparePartsSelector } from '@/components/inspections/SparePartsSelector';

interface Expense {
  id?: number;
  expense_category: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier?: string;
  invoice_number?: string;
  purchase_date?: string;
  notes?: string;
  paid_by?: 'OWNER' | 'WORKSHOP' | 'THIRD_PARTY';
}

interface ExpenseTotals {
  general: number;
  owner: number;
  workshop: number;
  thirdParty: number;
}

interface MaintenanceExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceId: number;
  onUpdate: () => void;
  workshopName?: string; // Nombre del taller para autocompletar
}

export function MaintenanceExpensesModal({ 
  isOpen, 
  onClose, 
  maintenanceId,
  onUpdate,
  workshopName 
}: MaintenanceExpensesModalProps) {
  const { data: session } = useSession() || {};
  const userRole = session?.user?.role;
  const isWorkshop = userRole === 'workshop';
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totals, setTotals] = useState<ExpenseTotals>({
    general: 0,
    owner: 0,
    workshop: 0,
    thirdParty: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<Expense>({
    expense_category: 'parts',
    item_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    supplier: workshopName || '',
    invoice_number: '',
    purchase_date: '',
    notes: '',
    paid_by: isWorkshop ? 'WORKSHOP' : 'WORKSHOP'
  });
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [vehicleModels, setVehicleModels] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');

  useEffect(() => {
    if (isOpen && maintenanceId) {
      loadExpenses();
      loadFiltersData();
      // Autocompletar proveedor con el nombre del taller al abrir el modal
      if (workshopName && !formData.supplier) {
        setFormData(prev => ({ ...prev, supplier: workshopName }));
      }
    }
  }, [isOpen, maintenanceId]);

  useEffect(() => {
    // Calcular total automáticamente
    const total = formData.quantity * formData.unit_price;
    setFormData(prev => ({ ...prev, total_price: total }));
  }, [formData.quantity, formData.unit_price]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/maintenance/${maintenanceId}/expenses`);
      if (response?.ok) {
        const data = await response.json();
        // Asegurar que todos los valores numéricos sean números
        const normalizedExpenses = data.expenses.map((expense: any) => ({
          ...expense,
          quantity: Number(expense.quantity) || 1,
          unit_price: Number(expense.unit_price) || 0,
          total_price: Number(expense.total_price) || 0,
          paid_by: expense.paid_by || 'WORKSHOP'
        }));
        setExpenses(normalizedExpenses);
        setTotals(data.totals || {
          general: 0,
          owner: 0,
          workshop: 0,
          thirdParty: 0
        });
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  const loadFiltersData = async () => {
    try {
      const [modelsRes, suppliersRes] = await Promise.all([
        fetch('/api/spare-parts/models'),
        fetch('/api/spare-parts/suppliers')
      ]);

      if (modelsRes?.ok) {
        const modelsData = await modelsRes.json();
        setVehicleModels(modelsData);
      }

      if (suppliersRes?.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData);
      }
    } catch (error) {
      console.error('Error loading filters data:', error);
    }
  };

  const handleSelectFromCatalog = (parts: any[]) => {
    // Tomar el primer repuesto seleccionado
    if (parts && parts.length > 0) {
      const part = parts[0];
      setFormData(prev => ({
        ...prev,
        item_name: part.name || '',
        description: part.notes || '',
        quantity: part.quantity || 1,
        unit_price: (part.total / (part.quantity || 1)) || 0,
        supplier: part.supplier || '',
        expense_category: 'parts'
      }));
      toast.success('Repuesto agregado desde el catálogo');
    }
    setIsCatalogModalOpen(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      expense_category: 'parts',
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      supplier: workshopName || '',
      invoice_number: '',
      purchase_date: '',
      notes: '',
      paid_by: isWorkshop ? 'WORKSHOP' : 'WORKSHOP'
    });
    setEditingExpense(null);
  };

  const handleSaveExpense = async () => {
    if (!formData.item_name.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }

    try {
      // Preparar datos con todos los campos requeridos
      const expenseData = {
        expense_category: formData.expense_category,
        item_name: formData.item_name.trim(),
        description: formData.description?.trim() || '',
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_price: formData.total_price,
        supplier: formData.supplier?.trim() || '',
        invoice_number: formData.invoice_number?.trim() || '',
        purchase_date: formData.purchase_date || null,
        warranty_months: 0,
        warranty_expires: null,
        is_billable_to_customer: false,
        tax_rate: 0,
        tax_amount: 0,
        notes: formData.notes?.trim() || '',
        receipt_path: null,
        paid_by: formData.paid_by || 'WORKSHOP'
      };

      let response;
      
      if (editingExpense?.id) {
        // Actualizar gasto existente
        console.log('Updating expense:', editingExpense.id, expenseData);
        response = await fetch(
          `/api/maintenance/${maintenanceId}/expenses/${editingExpense.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
          }
        );
      } else {
        // Crear nuevo gasto
        console.log('Creating expense:', expenseData);
        response = await fetch(`/api/maintenance/${maintenanceId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData)
        });
      }
      
      if (response?.ok) {
        toast.success(editingExpense ? 'Gasto actualizado' : 'Gasto agregado');
        resetForm();
        loadExpenses();
        onUpdate();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(`Error al guardar gasto: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Error al guardar gasto');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    
    // Manejar la fecha de manera segura
    let purchaseDate = '';
    if (expense.purchase_date) {
      try {
        const date = new Date(expense.purchase_date);
        if (!isNaN(date.getTime())) {
          purchaseDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
    
    // Asegurar que los valores numéricos sean números
    setFormData({
      ...expense,
      quantity: Number(expense.quantity) || 1,
      unit_price: Number(expense.unit_price) || 0,
      total_price: Number(expense.total_price) || 0,
      purchase_date: purchaseDate
    });
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este gasto?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `/api/maintenance/${maintenanceId}/expenses/${expenseId}`,
        { method: 'DELETE' }
      );
      
      if (response?.ok) {
        toast.success('Gasto eliminado');
        loadExpenses();
        onUpdate();
      } else {
        toast.error('Error al eliminar gasto');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar gasto');
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'parts': return 'Repuestos';
      case 'labor': return 'Mano de Obra';
      case 'fluids': return 'Líquidos';
      case 'tires': return 'Neumáticos';
      case 'filters': return 'Filtros';
      case 'brake_pads': return 'Pastillas de Freno';
      case 'battery': return 'Batería';
      case 'belt_chain': return 'Correa/Cadena';
      case 'inspection': return 'Inspección/ITV';
      case 'bodywork': return 'Carrocería/Chapa';
      case 'accident_repair': return 'Reparación Accidente';
      case 'other': return 'Otros';
      default: return category;
    }
  };

  const getPaidByInfo = (paidBy: string) => {
    switch (paidBy) {
      case 'OWNER':
        return { text: 'Pagado por Propietario', className: 'bg-purple-100 text-purple-800' };
      case 'WORKSHOP':
        return { text: 'A pagar al Taller', className: 'bg-orange-100 text-orange-800' };
      case 'THIRD_PARTY':
        return { text: 'Pagado por Tercero', className: 'bg-blue-100 text-blue-800' };
      default:
        return { text: 'A pagar al Taller', className: 'bg-orange-100 text-orange-800' };
    }
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.total_price?.toString() || '0'), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Gastos - Mantenimiento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información sobre el uso del sistema */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">💡 Sistema de Control de Gastos Detallado</h4>
            <p className="text-sm text-orange-800 mb-2">
              Registra cada gasto individualmente para tener un control preciso de costes por vehículo:
            </p>
            <ul className="text-sm text-orange-800 space-y-1 ml-4">
              <li>• <strong>Revisiones ordinarias</strong> (1.000, 5.000, 10.000 km): Aceite, filtros, etc.</li>
              <li>• <strong>Revisiones extraordinarias</strong>: Reparaciones inesperadas</li>
              <li>• <strong>Recambios y mano de obra</strong> por separado</li>
              <li>• <strong>Análisis de rentabilidad</strong>: Identifica qué unidades o modelos son más costosos</li>
            </ul>
          </div>
          
          {/* Formulario para agregar/editar gasto */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">
                {editingExpense ? 'Editar Gasto' : 'Agregar Nuevo Gasto'}
              </h3>
              
              {/* Dropdowns y botón del catálogo */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-900">
                    Buscar en el catálogo de repuestos
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="catalog_model" className="text-xs">Modelo de Vehículo</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los modelos</SelectItem>
                        {vehicleModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="catalog_supplier" className="text-xs">Proveedor</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los proveedores</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => setIsCatalogModalOpen(true)}
                      variant="outline"
                      className="w-full h-9 border-blue-300 hover:bg-blue-100"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Abrir Catálogo
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-blue-700">
                  Filtra por modelo y proveedor, luego abre el catálogo para seleccionar un repuesto
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_name">Concepto *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => handleInputChange('item_name', e.target.value)}
                    placeholder="Ej: Cambio de aceite"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select 
                    value={formData.expense_category} 
                    onValueChange={(value) => handleInputChange('expense_category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parts">Repuestos</SelectItem>
                      <SelectItem value="labor">Mano de Obra</SelectItem>
                      <SelectItem value="fluids">Líquidos (Aceite, Frenos, etc.)</SelectItem>
                      <SelectItem value="tires">Neumáticos</SelectItem>
                      <SelectItem value="filters">Filtros</SelectItem>
                      <SelectItem value="brake_pads">Pastillas de Freno</SelectItem>
                      <SelectItem value="battery">Batería</SelectItem>
                      <SelectItem value="belt_chain">Correa/Cadena</SelectItem>
                      <SelectItem value="inspection">Inspección/ITV</SelectItem>
                      <SelectItem value="bodywork">Carrocería/Chapa</SelectItem>
                      <SelectItem value="accident_repair">Reparación Accidente</SelectItem>
                      <SelectItem value="other">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Selector de "Pagado por" */}
                <div>
                  <Label htmlFor="paid_by">Pagado por</Label>
                  <Select 
                    value={formData.paid_by || 'WORKSHOP'} 
                    onValueChange={(value: 'OWNER' | 'WORKSHOP' | 'THIRD_PARTY') => handleInputChange('paid_by', value)}
                    disabled={isWorkshop}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Propietario/Gestor</SelectItem>
                      <SelectItem value="WORKSHOP">Taller (a facturar)</SelectItem>
                      <SelectItem value="THIRD_PARTY">Tercero</SelectItem>
                    </SelectContent>
                  </Select>
                  {isWorkshop && (
                    <p className="text-xs text-gray-500 mt-1">
                      Los talleres solo pueden añadir gastos propios
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit_price">Precio Unitario (€)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                
                <div>
                  <Label htmlFor="total">Total (€)</Label>
                  <Input
                    id="total"
                    type="number"
                    value={Number(formData.total_price || 0).toFixed(2)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier">Proveedor/Taller</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder={workshopName ? `Ej: ${workshopName}` : "Nombre del proveedor o taller"}
                  />
                  {workshopName && !formData.supplier && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs mt-1"
                      onClick={() => handleInputChange('supplier', workshopName)}
                    >
                      Usar taller actual: {workshopName}
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="invoice_number">Nº Documento</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                    placeholder="Factura, ticket, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="purchase_date">Fecha de Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detalles adicionales..."
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                {editingExpense && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleSaveExpense}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {editingExpense ? 'Actualizar' : 'Agregar'} Gasto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de gastos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Gastos Registrados</h3>
            
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ) : expenses.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Euro className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay gastos registrados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <Card key={expense.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{expense.item_name}</h4>
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                              {getCategoryText(expense.expense_category)}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getPaidByInfo(expense.paid_by || 'WORKSHOP').className}`}>
                              {getPaidByInfo(expense.paid_by || 'WORKSHOP').text}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Cantidad:</span> {expense.quantity}
                            </div>
                            <div>
                              <span className="text-gray-500">P. Unitario:</span> €{Number(expense.unit_price || 0).toFixed(2)}
                            </div>
                            <div className="font-semibold text-gray-900">
                              <span className="text-gray-500">Total:</span> €{Number(expense.total_price || 0).toFixed(2)}
                            </div>
                            {expense.supplier && (
                              <div>
                                <span className="text-gray-500">Proveedor:</span> {expense.supplier}
                              </div>
                            )}
                          </div>
                          {expense.description && (
                            <p className="text-sm text-gray-600 mt-2">{expense.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                            title="Editar gasto"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id!)}
                            title="Eliminar gasto"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Desglose de totales */}
                <div className="space-y-3">
                  {/* Total General */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">📊 Total General del Mantenimiento</h4>
                        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                          <Euro className="h-6 w-6" />
                          <span>€{totals.general.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Desglose */}
                  <Card className="border-2">
                    <CardContent className="pt-4 space-y-3">
                      <h5 className="font-semibold text-sm text-gray-700 mb-3">Desglose por origen del pago:</h5>
                      
                      {/* Gastos pagados por propietario */}
                      {totals.owner > 0 && (
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              Pagado por Propietario
                            </Badge>
                          </div>
                          <span className="font-semibold text-purple-900">€{totals.owner.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Gastos a pagar al taller */}
                      {totals.workshop > 0 && (
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800">
                              A pagar al Taller
                            </Badge>
                          </div>
                          <span className="font-semibold text-orange-900">€{totals.workshop.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Gastos pagados por terceros */}
                      {totals.thirdParty > 0 && (
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Pagado por Tercero
                            </Badge>
                          </div>
                          <span className="font-semibold text-blue-900">€{totals.thirdParty.toFixed(2)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Total a pagar al taller (destacado) */}
                  {!isWorkshop && totals.workshop > 0 && (
                    <Card className="bg-orange-50 border-orange-200 border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg text-orange-900">💰 Importe a Facturar por el Taller</h4>
                            <p className="text-xs text-orange-700 mt-1">Este es el importe que debe cobrar el taller</p>
                          </div>
                          <div className="flex items-center gap-2 text-3xl font-bold text-orange-600">
                            <Euro className="h-8 w-8" />
                            <span>€{totals.workshop.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Para talleres, mostrar solo su total */}
                  {isWorkshop && (
                    <Card className="bg-orange-50 border-orange-200 border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg text-orange-900">💰 Total a Facturar</h4>
                            <p className="text-xs text-orange-700 mt-1">Total de gastos del taller</p>
                          </div>
                          <div className="flex items-center gap-2 text-3xl font-bold text-orange-600">
                            <Euro className="h-8 w-8" />
                            <span>€{totals.workshop.toFixed(2)}</span>
                          </div>
                        </div>
                        {totals.owner > 0 && (
                          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
                            ℹ️ El propietario ha añadido €{totals.owner.toFixed(2)} en gastos propios que ya ha pagado directamente.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        
        {/* Selector del catálogo de repuestos */}
        {isCatalogModalOpen && (
          <SparePartsSelector
            vehicleModel={selectedModel === 'all' ? '' : selectedModel}
            open={isCatalogModalOpen}
            onOpenChange={setIsCatalogModalOpen}
            onConfirm={handleSelectFromCatalog}
            initialSelected={[]}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
