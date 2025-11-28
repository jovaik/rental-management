
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Plus, Minus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MaintenanceFormData {
  car_id: number;
  maintenance_type: string;
  title: string;
  description?: string;
  scheduled_date: string;
  priority: string;
  estimated_duration_hours?: number;
  workshop_location?: string;
  notes?: string;
  technician_id?: number;
  expenses: Array<{
    expense_category: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    supplier?: string;
    notes?: string;
  }>;
}

interface MaintenanceFormProps {
  vehicles?: Array<{
    id: number;
    registration_number?: string;
    make?: string;
    model?: string;
  }>;
  technicians?: Array<{
    id: number;
    firstname?: string;
    lastname?: string;
  }>;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  loading?: boolean;
}

export function MaintenanceForm({ vehicles = [], technicians = [], onSubmit, loading = false }: MaintenanceFormProps) {
  const [expenses, setExpenses] = useState([{
    expense_category: 'parts',
    item_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    supplier: '',
    notes: ''
  }]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MaintenanceFormData>();

  const watchedValues = watch();

  const addExpense = () => {
    setExpenses([...expenses, {
      expense_category: 'parts',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      supplier: '',
      notes: ''
    }]);
  };

  const removeExpense = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index));
    }
  };

  const updateExpense = (index: number, field: string, value: any) => {
    const updated = expenses.map((expense, i) => {
      if (i === index) {
        const newExpense = { ...expense, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          newExpense.total_price = newExpense.quantity * newExpense.unit_price;
        }
        return newExpense;
      }
      return expense;
    });
    setExpenses(updated);
  };

  const onFormSubmit = async (data: MaintenanceFormData) => {
    const formData = {
      ...data,
      expenses: expenses.filter(exp => exp.item_name.trim() !== '')
    };
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Información del Mantenimiento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="car_id">Vehículo *</Label>
              <Select onValueChange={(value) => setValue('car_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle?.id} value={vehicle?.id?.toString() || 'unknown'}>
                      {vehicle?.registration_number} - {vehicle?.make} {vehicle?.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type">Tipo de Mantenimiento *</Label>
              <Select onValueChange={(value) => setValue('maintenance_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="emergency">Emergencia</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                {...register('title', { required: 'El título es obligatorio' })}
                placeholder="Ej: Cambio de aceite y filtros"
              />
              {errors?.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select onValueChange={(value) => setValue('priority', value)} defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha Programada *</Label>
              <Input
                type="datetime-local"
                {...register('scheduled_date', { required: 'La fecha es obligatoria' })}
              />
              {errors?.scheduled_date && (
                <p className="text-sm text-red-600">{errors.scheduled_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration_hours">Duración Estimada (horas)</Label>
              <Input
                type="number"
                step="0.5"
                {...register('estimated_duration_hours', { valueAsNumber: true })}
                placeholder="2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician_id">Técnico</Label>
              <Select onValueChange={(value) => setValue('technician_id', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar técnico" />
                </SelectTrigger>
                <SelectContent>
                  {technicians?.map((technician) => (
                    <SelectItem key={technician?.id} value={technician?.id?.toString() || 'unknown'}>
                      {technician?.firstname} {technician?.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workshop_location">Ubicación del Taller</Label>
              <Input
                {...register('workshop_location')}
                placeholder="Taller principal, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              {...register('description')}
              placeholder="Descripción detallada del mantenimiento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              {...register('notes')}
              placeholder="Notas especiales, instrucciones, etc."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gastos del Mantenimiento</CardTitle>
            <Button type="button" onClick={addExpense} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {expenses?.map((expense, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
              {expenses?.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeExpense(index)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-red-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select 
                    value={expense?.expense_category}
                    onValueChange={(value) => updateExpense(index, 'expense_category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parts">Repuestos</SelectItem>
                      <SelectItem value="labor">Mano de obra</SelectItem>
                      <SelectItem value="materials">Materiales</SelectItem>
                      <SelectItem value="tools">Herramientas</SelectItem>
                      <SelectItem value="external_service">Servicio externo</SelectItem>
                      <SelectItem value="fuel">Combustible</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre del Artículo</Label>
                  <Input
                    value={expense?.item_name}
                    onChange={(e) => updateExpense(index, 'item_name', e.target.value)}
                    placeholder="Ej: Aceite 5W-30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    value={expense?.supplier}
                    onChange={(e) => updateExpense(index, 'supplier', e.target.value)}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expense?.quantity}
                    onChange={(e) => updateExpense(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Precio Unitario (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expense?.unit_price}
                    onChange={(e) => updateExpense(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expense?.total_price?.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas del Gasto</Label>
                <Textarea
                  value={expense?.notes}
                  onChange={(e) => updateExpense(index, 'notes', e.target.value)}
                  placeholder="Notas adicionales sobre este gasto..."
                  rows={2}
                />
              </div>
            </div>
          ))}

          <div className="text-right">
            <div className="text-lg font-semibold">
              Total: €{expenses?.reduce((sum, exp) => sum + (exp?.total_price || 0), 0)?.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Mantenimiento'}
        </Button>
      </div>
    </form>
  );
}
