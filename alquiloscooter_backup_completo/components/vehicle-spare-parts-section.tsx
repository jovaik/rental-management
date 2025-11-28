
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, AlertCircle } from 'lucide-react';

interface SparePart {
  id: number;
  part_name: string;
  part_code?: string;
  part_category: string;
  price: number;
  supplier?: string;
  notes?: string;
}

interface VehicleSparePartsSectionProps {
  vehicleModel: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  carroceria: 'Carrocería',
  mecanica: 'Mecánica',
  electrica: 'Eléctrica',
  neumaticos: 'Neumáticos',
  otros: 'Otros'
};

export function VehicleSparePartsSection({ vehicleModel }: VehicleSparePartsSectionProps) {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vehicleModel) {
      fetchSpareParts();
    }
  }, [vehicleModel]);

  const fetchSpareParts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/spare-parts?model=${encodeURIComponent(vehicleModel)}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener repuestos');
      }

      const data = await response.json();
      setSpareParts(data);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const calculateTotal = () => {
    return spareParts.reduce((sum, part) => sum + parseFloat(part.price.toString()), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-muted-foreground">Cargando catálogo...</div>
      </div>
    );
  }

  if (!vehicleModel) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Guarda el vehículo con marca y modelo para ver el catálogo de repuestos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (spareParts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catálogo de Repuestos
          </CardTitle>
          <CardDescription>
            Modelo: <strong>{vehicleModel}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No hay repuestos registrados para este modelo</p>
            <p className="text-sm mt-2">
              Ve a <strong>Catálogo de Repuestos</strong> para añadir repuestos comunes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por categoría
  const partsByCategory = spareParts.reduce((acc, part) => {
    const category = part.part_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(part);
    return acc;
  }, {} as Record<string, SparePart[]>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catálogo de Repuestos
          </CardTitle>
          <CardDescription>
            Modelo: <strong>{vehicleModel}</strong> • {spareParts.length} repuestos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(partsByCategory).map(([category, parts]) => (
              <div key={category}>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  {getCategoryLabel(category)} ({parts.length})
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Repuesto</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parts.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell className="font-medium">{part.part_name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {part.part_code || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {part.supplier || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {parseFloat(part.price.toString()).toFixed(2)}€
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total de todos los repuestos:</span>
              <span className="text-2xl font-bold">{calculateTotal().toFixed(2)}€</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              * Este es el valor total de todo el catálogo. Selecciona solo los repuestos necesarios para cada reparación.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Este catálogo muestra los repuestos comunes y sus precios para agilizar la gestión de daños y reparaciones. 
            Para añadir más repuestos, ve al módulo de <strong>Catálogo de Repuestos</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
