'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ExtraModal } from '@/components/modals/extra-modal';

interface Extra {
  id: number;
  name: string;
  description: string | null;
  extra_type: string;
  pricing_type: string;
  price: number;
  distance_range_min: number | null;
  distance_range_max: number | null;
  is_available: boolean;
  display_order: number;
}

export default function ExtrasTab() {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState<Extra | null>(null);

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing/extras');
      if (!response.ok) throw new Error('Failed to fetch extras');
      const data = await response.json();
      setExtras(data);
    } catch (error) {
      console.error('Error fetching extras:', error);
      toast.error('Error al cargar extras');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este extra?')) return;

    try {
      const response = await fetch(`/api/pricing/extras/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete extra');

      toast.success('Extra eliminado');
      fetchExtras();
    } catch (error) {
      console.error('Error deleting extra:', error);
      toast.error('Error al eliminar extra');
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return `€${Number(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Extras & Equipamiento</h2>
          <p className="text-muted-foreground">
            Gestiona equipamiento adicional y accesorios (sillas de bebé, GPS, servicio a domicilio, etc.)
          </p>
        </div>
        <Button onClick={() => { setSelectedExtra(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Extra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Extras Disponibles
          </CardTitle>
          <CardDescription>
            Sillas infantiles, GPS, esquíes y otros equipos de alquiler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay extras configurados. Añade tu primer extra para comenzar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tarifa</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Rango Distancia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extras.map((extra) => (
                  <TableRow key={extra.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{extra.name}</div>
                        {extra.description && (
                          <div className="text-sm text-muted-foreground">
                            {extra.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{extra.extra_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{extra.pricing_type}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(Number(extra.price))}</TableCell>
                    <TableCell>
                      {extra.distance_range_min !== null && extra.distance_range_max !== null
                        ? `${extra.distance_range_min}-${extra.distance_range_max} km`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={extra.is_available ? 'default' : 'secondary'}
                      >
                        {extra.is_available ? 'Disponible' : 'No disponible'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedExtra(extra); setIsModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(extra.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExtraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchExtras}
        extra={selectedExtra}
      />
    </div>
  );
}
