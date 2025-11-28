
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: any) => void;
  expense?: any;
}

export function ExpenseModal({ isOpen, onClose, onSave, expense }: ExpenseModalProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Repuestos');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [carId, setCarId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItemName(expense?.item_name || '');
      setCategory(expense?.expense_category || 'Repuestos');
      setQuantity(expense?.quantity || 1);
      setUnitPrice(expense?.unit_price || 0);
      setSupplier(expense?.supplier || '');
      setPurchaseDate(expense?.purchase_date 
        ? new Date(expense.purchase_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      );
      setCarId(expense?.maintenance?.car?.id?.toString() || '');
      loadVehicles();
    }
  }, [isOpen, expense]);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) {
      alert('Por favor ingresa el nombre del artículo');
      return;
    }

    if (!carId) {
      alert('Por favor selecciona un vehículo');
      return;
    }
    
    const totalPrice = quantity * unitPrice;
    
    const expenseData = {
      id: expense?.id || Date.now(),
      car_id: parseInt(carId),
      item_name: itemName.trim(),
      expense_category: category,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      supplier: supplier.trim(),
      purchase_date: purchaseDate,
      invoice_number: `INV-${Date.now()}`,
      warranty_months: 0,
      description: ''
    };
    
    onSave(expenseData);
    onClose();
  };

  const totalPrice = quantity * unitPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicle">Vehículo *</Label>
              <Select value={carId} onValueChange={setCarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingVehicles ? (
                    <SelectItem value="loading" disabled>Cargando vehículos...</SelectItem>
                  ) : vehicles.length === 0 ? (
                    <SelectItem value="none" disabled>No hay vehículos disponibles</SelectItem>
                  ) : (
                    vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="item_name">Artículo *</Label>
              <Input
                id="item_name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej: Pastillas de freno"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoría</Label>
              <select 
                id="category" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Repuestos">Repuestos</option>
                <option value="Mano de obra">Mano de obra</option>
                <option value="Neumáticos">Neumáticos</option>
                <option value="Combustible">Combustible</option>
                <option value="Seguros">Seguros</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="unit_price">Precio unitario (€)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nombre del proveedor"
              />
            </div>
            
            <div>
              <Label htmlFor="purchase_date">Fecha de compra</Label>
              <Input
                id="purchase_date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Total: €{totalPrice.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {expense ? 'Actualizar' : 'Crear'} Gasto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
