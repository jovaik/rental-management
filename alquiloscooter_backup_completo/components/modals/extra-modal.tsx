
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface Extra {
  id?: number;
  name: string;
  description?: string | null;
  extra_type: string;
  pricing_type: string;
  price: number;
  distance_range_min?: number | null;
  distance_range_max?: number | null;
  is_available: boolean;
  display_order: number;
}

interface ExtraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  extra?: Extra | null;
}

export function ExtraModal({ isOpen, onClose, onSave, extra }: ExtraModalProps) {
  const [formData, setFormData] = useState<Extra>({
    name: '',
    description: '',
    extra_type: 'home_delivery',
    pricing_type: 'fixed',
    price: 0,
    distance_range_min: null,
    distance_range_max: null,
    is_available: true,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && extra) {
      setFormData(extra);
    } else if (isOpen) {
      setFormData({
        name: '',
        description: '',
        extra_type: 'home_delivery',
        pricing_type: 'fixed',
        price: 0,
        distance_range_min: null,
        distance_range_max: null,
        is_available: true,
        display_order: 0,
      });
    }
  }, [isOpen, extra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = extra ? `/api/pricing/extras/${extra.id}` : '/api/pricing/extras';
      const method = extra ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save extra');

      toast.success(extra ? 'Extra actualizado' : 'Extra creado');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving extra:', error);
      toast.error('Error al guardar el extra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{extra ? 'Editar Extra' : 'Nuevo Extra'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="extra_type">Tipo de Extra</Label>
            <Input
              id="extra_type"
              value={formData.extra_type}
              onChange={(e) => setFormData({ ...formData, extra_type: e.target.value })}
              placeholder="home_delivery, airport_pickup, etc."
            />
          </div>

          <div>
            <Label htmlFor="pricing_type">Tipo de Tarifa</Label>
            <Select
              value={formData.pricing_type}
              onValueChange={(value) => setFormData({ ...formData, pricing_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fija</SelectItem>
                <SelectItem value="per_km">Por Kilómetro</SelectItem>
                <SelectItem value="per_day">Por Día</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Precio (€) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="distance_range_min">Distancia Mínima (km)</Label>
              <Input
                id="distance_range_min"
                type="number"
                min="0"
                value={formData.distance_range_min || ''}
                onChange={(e) =>
                  setFormData({ ...formData, distance_range_min: e.target.value ? parseInt(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label htmlFor="distance_range_max">Distancia Máxima (km)</Label>
              <Input
                id="distance_range_max"
                type="number"
                min="0"
                value={formData.distance_range_max || ''}
                onChange={(e) =>
                  setFormData({ ...formData, distance_range_max: e.target.value ? parseInt(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="display_order">Orden de Visualización</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_available">Disponible</Label>
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : extra ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
