
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SparePartModal from '@/components/spare-part-modal';

interface SparePart {
  id: number;
  vehicle_model: string;
  part_name: string;
  part_code?: string;
  part_category: string;
  price: number;
  supplier?: string;
  supplier_code?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

const CATEGORIES = [
  { value: 'carroceria', label: 'Carrocería' },
  { value: 'mecanica', label: 'Mecánica' },
  { value: 'electrica', label: 'Eléctrica' },
  { value: 'neumaticos', label: 'Neumáticos' },
  { value: 'otros', label: 'Otros' }
];

export default function SparePartsPage() {
  const { toast } = useToast();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [filteredParts, setFilteredParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  useEffect(() => {
    fetchSpareParts();
    fetchModels();
  }, []);

  useEffect(() => {
    filterParts();
  }, [spareParts, searchTerm, selectedCategory, selectedModel]);

  const fetchSpareParts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spare-parts');
      if (!response.ok) throw new Error('Error al obtener repuestos');
      const data = await response.json();
      setSpareParts(data);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los repuestos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/spare-parts/models');
      if (!response.ok) throw new Error('Error al obtener modelos');
      const data = await response.json();
      setAvailableModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const filterParts = () => {
    let filtered = [...spareParts];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (part) =>
          part.part_name.toLowerCase().includes(search) ||
          part.vehicle_model.toLowerCase().includes(search) ||
          part.part_code?.toLowerCase().includes(search) ||
          part.supplier?.toLowerCase().includes(search)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((part) => part.part_category === selectedCategory);
    }

    if (selectedModel !== 'all') {
      filtered = filtered.filter((part) => part.vehicle_model === selectedModel);
    }

    setFilteredParts(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este repuesto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/spare-parts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Repuesto eliminado correctamente',
      });

      fetchSpareParts();
    } catch (error) {
      console.error('Error deleting spare part:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el repuesto',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (part: SparePart) => {
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedPart(null);
    setIsModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setIsModalOpen(false);
    setSelectedPart(null);
    if (refresh) {
      fetchSpareParts();
      fetchModels();
    }
  };

  const getCategoryLabel = (value: string) => {
    const category = CATEGORIES.find((cat) => cat.value === value);
    return category?.label || value;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Catálogo de Repuestos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los repuestos y piezas por modelo de vehículo
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Repuesto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra repuestos por modelo o categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código, proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los modelos</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando repuestos...
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron repuestos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo Vehículo</TableHead>
                    <TableHead>Repuesto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.vehicle_model}</TableCell>
                      <TableCell>{part.part_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.part_code || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(part.part_category)}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(part.price.toString()).toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.supplier || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(part)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(part.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SparePartModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        sparePart={selectedPart}
      />
    </div>
  );
}
