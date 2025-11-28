
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SparePartModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  sparePart?: {
    id: number;
    vehicle_model: string;
    part_name: string;
    part_code?: string;
    part_category: string;
    price: number;
    supplier?: string;
    supplier_code?: string;
    notes?: string;
  } | null;
}

const CATEGORIES = [
  { value: 'carroceria', label: 'Carrocería' },
  { value: 'mecanica', label: 'Mecánica' },
  { value: 'electrica', label: 'Eléctrica' },
  { value: 'neumaticos', label: 'Neumáticos' },
  { value: 'otros', label: 'Otros' }
];

export default function SparePartModal({ isOpen, onClose, sparePart }: SparePartModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const [openModelCombo, setOpenModelCombo] = useState(false);
  const [openSupplierCombo, setOpenSupplierCombo] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_model: '',
    part_name: '',
    part_code: '',
    part_category: 'otros',
    price: '',
    supplier: '',
    supplier_code: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Cargar modelos y proveedores disponibles
      fetchAvailableModels();
      fetchAvailableSuppliers();
      
      if (sparePart) {
        setFormData({
          vehicle_model: sparePart.vehicle_model || '',
          part_name: sparePart.part_name || '',
          part_code: sparePart.part_code || '',
          part_category: sparePart.part_category || 'otros',
          price: sparePart.price?.toString() || '',
          supplier: sparePart.supplier || '',
          supplier_code: sparePart.supplier_code || '',
          notes: sparePart.notes || ''
        });
      } else {
        setFormData({
          vehicle_model: '',
          part_name: '',
          part_code: '',
          part_category: 'otros',
          price: '',
          supplier: '',
          supplier_code: '',
          notes: ''
        });
      }
    }
  }, [isOpen, sparePart]);

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('/api/vehicles/models');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchAvailableSuppliers = async () => {
    try {
      const response = await fetch('/api/spare-parts/suppliers');
      if (response.ok) {
        const data = await response.json();
        setAvailableSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_model.trim() || !formData.part_name.trim() || !formData.price) {
      toast({
        title: 'Error',
        description: 'El modelo, nombre del repuesto y precio son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({
        title: 'Error',
        description: 'El precio debe ser un valor numérico positivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const url = sparePart ? `/api/spare-parts/${sparePart.id}` : '/api/spare-parts';
      const method = sparePart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast({
        title: 'Éxito',
        description: `Repuesto ${sparePart ? 'actualizado' : 'creado'} correctamente`,
      });

      onClose(true);
    } catch (error: any) {
      console.error('Error saving spare part:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el repuesto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sparePart ? 'Editar Repuesto' : 'Nuevo Repuesto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_model">
                Modelo de Vehículo <span className="text-red-500">*</span>
              </Label>
              <Popover open={openModelCombo} onOpenChange={setOpenModelCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openModelCombo}
                    className="w-full justify-between font-normal"
                  >
                    {formData.vehicle_model || "Selecciona o escribe un modelo..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar modelo o escribir uno nuevo..." 
                      value={formData.vehicle_model}
                      onValueChange={(value) => {
                        setFormData({ ...formData, vehicle_model: value });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          <p className="font-medium mb-1">No hay resultados</p>
                          <p className="text-muted-foreground">
                            Escribe el modelo manualmente y presiona Enter
                          </p>
                        </div>
                      </CommandEmpty>
                      {availableModels.length > 0 && (
                        <CommandGroup heading="Modelos de tu flota">
                          {availableModels.map((model) => (
                            <CommandItem
                              key={model}
                              value={model}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, vehicle_model: currentValue });
                                setOpenModelCombo(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.vehicle_model === model ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {model}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Selecciona de la lista o escribe uno nuevo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="part_category">Categoría</Label>
              <Select
                value={formData.part_category}
                onValueChange={(value) =>
                  setFormData({ ...formData, part_category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part_name">
                Nombre del Repuesto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="part_name"
                value={formData.part_name}
                onChange={(e) =>
                  setFormData({ ...formData, part_name: e.target.value })
                }
                placeholder="Ej: Espejo retrovisor derecho"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="part_code">Código/Referencia</Label>
              <Input
                id="part_code"
                value={formData.part_code}
                onChange={(e) =>
                  setFormData({ ...formData, part_code: e.target.value })
                }
                placeholder="Código del repuesto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio (€) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Popover open={openSupplierCombo} onOpenChange={setOpenSupplierCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSupplierCombo}
                    className="w-full justify-between font-normal"
                  >
                    {formData.supplier || "Selecciona o escribe un proveedor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar proveedor o escribir uno nuevo..." 
                      value={formData.supplier}
                      onValueChange={(value) => {
                        setFormData({ ...formData, supplier: value });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          <p className="font-medium mb-1">No hay resultados</p>
                          <p className="text-muted-foreground">
                            Escribe el proveedor manualmente
                          </p>
                        </div>
                      </CommandEmpty>
                      {availableSuppliers.length > 0 && (
                        <CommandGroup heading="Proveedores habituales">
                          {availableSuppliers.map((supplier) => (
                            <CommandItem
                              key={supplier}
                              value={supplier}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, supplier: currentValue });
                                setOpenSupplierCombo(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.supplier === supplier ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {supplier}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Selecciona de la lista o escribe uno nuevo
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_code">Código del Proveedor</Label>
            <Input
              id="supplier_code"
              value={formData.supplier_code}
              onChange={(e) =>
                setFormData({ ...formData, supplier_code: e.target.value })
              }
              placeholder="Referencia del proveedor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Información adicional sobre el repuesto"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : sparePart ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
