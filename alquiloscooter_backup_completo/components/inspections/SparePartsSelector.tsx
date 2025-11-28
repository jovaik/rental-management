
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Minus, Wrench } from 'lucide-react';

interface SparePart {
  id: number;
  part_name: string;
  part_code?: string;
  part_category: string;
  price: number;
  supplier?: string;
  notes?: string;
}

interface SelectedSparePart {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface SparePartsSelectorProps {
  vehicleModel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (parts: SelectedSparePart[]) => void;
  initialSelected?: SelectedSparePart[];
}

const categoryNames: Record<string, string> = {
  carroceria: '🔧 Carrocería',
  mecanica: '⚙️ Mecánica',
  electrica: '⚡ Eléctrica',
  neumaticos: '🛞 Neumáticos',
  otros: '📦 Otros'
};

export function SparePartsSelector({
  vehicleModel,
  open,
  onOpenChange,
  onConfirm,
  initialSelected = []
}: SparePartsSelectorProps) {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParts, setSelectedParts] = useState<Map<number, SelectedSparePart>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (open) {
      fetchSpareParts();
    }
  }, [open, vehicleModel]);

  useEffect(() => {
    // Inicializar con partes previamente seleccionadas
    if (initialSelected.length > 0) {
      const map = new Map<number, SelectedSparePart>();
      initialSelected.forEach(part => {
        map.set(part.id, part);
      });
      setSelectedParts(map);
    }
  }, [initialSelected]);

  const fetchSpareParts = async () => {
    try {
      setLoading(true);
      // Si no hay modelo específico o está vacío, cargar todos los repuestos
      const url = vehicleModel && vehicleModel.trim() !== ''
        ? `/api/spare-parts/by-model?model=${encodeURIComponent(vehicleModel)}`
        : '/api/spare-parts';
      
      console.log('Fetching spare parts from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Spare parts loaded:', data.length);
        setSpareParts(data);
      } else {
        console.error('Error response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePartSelection = (part: SparePart) => {
    const newSelected = new Map(selectedParts);
    if (newSelected.has(part.id)) {
      newSelected.delete(part.id);
    } else {
      newSelected.set(part.id, {
        id: part.id,
        name: part.part_name,
        quantity: 1,
        price: Number(part.price),
        total: Number(part.price)
      });
    }
    setSelectedParts(newSelected);
  };

  const updateQuantity = (partId: number, delta: number) => {
    const newSelected = new Map(selectedParts);
    const part = newSelected.get(partId);
    if (part) {
      const newQuantity = Math.max(1, part.quantity + delta);
      part.quantity = newQuantity;
      part.total = newQuantity * part.price;
      setSelectedParts(newSelected);
    }
  };

  const handleConfirm = () => {
    const partsArray = Array.from(selectedParts.values());
    onConfirm(partsArray);
    onOpenChange(false);
  };

  const filteredParts = spareParts.filter(part => {
    const matchesSearch = part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.part_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || part.part_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedParts = filteredParts.reduce((acc, part) => {
    const category = part.part_category || 'otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(part);
    return acc;
  }, {} as Record<string, SparePart[]>);

  const totalCost = Array.from(selectedParts.values()).reduce((sum, part) => sum + part.total, 0);
  const totalItems = Array.from(selectedParts.values()).reduce((sum, part) => sum + part.quantity, 0);

  const categories = ['all', ...Object.keys(categoryNames)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-3 sm:p-6 gap-3">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Repuestos - {vehicleModel}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Búsqueda y Filtros */}
        <div className="space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              placeholder="Buscar repuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 h-9 text-sm"
            />
          </div>

          {/* Filtro de categorías */}
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-2 min-w-max">
              {categories.map(cat => (
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs sm:text-sm shrink-0"
                >
                  {cat === 'all' ? '📋 Todos' : categoryNames[cat] || cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Repuestos - Área con scroll - Ocupa el espacio restante */}
        <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-gray-50/50 p-3">
          {loading ? (
            <div className="text-center py-8 text-sm">Cargando repuestos...</div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No se encontraron repuestos</p>
              <p className="text-xs mt-1">Prueba con otro término de búsqueda o categoría</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {Object.entries(groupedParts).map(([category, parts]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-700 pb-2 border-b bg-gray-50/50 -mx-3 px-3 sticky top-0 z-10">
                    {categoryNames[category] || category}
                  </h4>
                  <div className="space-y-2">
                    {parts.map((part) => {
                      const isSelected = selectedParts.has(part.id);
                      const selectedPart = selectedParts.get(part.id);

                      return (
                        <div
                          key={part.id}
                          className={`border rounded-lg p-2 sm:p-3 transition-all touch-manipulation ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div 
                              className="pt-1 cursor-pointer"
                              onClick={() => togglePartSelection(part)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => togglePartSelection(part)}
                                className="pointer-events-none"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs sm:text-sm truncate">{part.part_name}</p>
                                  {part.part_code && (
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">Código: {part.part_code}</p>
                                  )}
                                  {part.supplier && (
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">Proveedor: {part.supplier}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                                  €{Number(part.price).toFixed(2)}
                                </Badge>
                              </div>

                              {isSelected && selectedPart && (
                                <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-[10px] sm:text-xs">Cant:</Label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(part.id, -1);
                                        }}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation active:scale-95"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 sm:w-10 text-center font-medium text-xs sm:text-sm">
                                        {selectedPart.quantity}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(part.id, 1);
                                        }}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation active:scale-95"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-xs sm:text-sm font-semibold text-blue-600">
                                    Total: €{selectedPart.total.toFixed(2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Resumen y Acciones */}
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 border-t pt-3 sm:pt-4 shrink-0">
          <div className="flex-1 text-left">
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="font-semibold">{selectedParts.size}</span> repuesto(s)
              {' · '}
              <span className="font-semibold">{totalItems}</span> unidad(es)
            </div>
            <div className="text-base sm:text-lg font-bold text-blue-600">
              Total: €{totalCost.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedParts.size === 0}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
            >
              Confirmar ({selectedParts.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
