
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';

interface Experience {
  id?: number;
  name: string;
  description?: string | null;
  experience_type: string;
  price_per_hour?: number | null;
  price_per_day?: number | null;
  price_fixed?: number | null;
  duration_minutes?: number | null;
  max_participants?: number | null;
  min_age?: number | null;
  image_url?: string;
  is_available: boolean;
  requires_booking: boolean;
  advance_booking_hours: number;
  display_order: number;
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  experience?: Experience | null;
}

export function ExperienceModal({ isOpen, onClose, onSave, experience }: ExperienceModalProps) {
  const [formData, setFormData] = useState<Experience>({
    name: '',
    description: '',
    experience_type: 'jetski',
    price_per_hour: null,
    price_per_day: null,
    price_fixed: null,
    duration_minutes: null,
    max_participants: null,
    min_age: null,
    image_url: '',
    is_available: true,
    requires_booking: true,
    advance_booking_hours: 24,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && experience) {
      setFormData(experience);
    } else if (isOpen) {
      setFormData({
        name: '',
        description: '',
        experience_type: 'jetski',
        price_per_hour: null,
        price_per_day: null,
        price_fixed: null,
        duration_minutes: null,
        max_participants: null,
        min_age: null,
        image_url: '',
        is_available: true,
        requires_booking: true,
        advance_booking_hours: 24,
        display_order: 0,
      });
    }
  }, [isOpen, experience]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = experience ? `/api/pricing/experiences/${experience.id}` : '/api/pricing/experiences';
      const method = experience ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save experience');

      toast.success(experience ? 'Experiencia actualizada' : 'Experiencia creada');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Error al guardar la experiencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{experience ? 'Editar Experiencia' : 'Nueva Experiencia'}</DialogTitle>
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
            <Label htmlFor="experience_type">Tipo de Experiencia</Label>
            <Input
              id="experience_type"
              value={formData.experience_type}
              onChange={(e) => setFormData({ ...formData, experience_type: e.target.value })}
              placeholder="jetski, boat_tour, parasailing, etc."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price_per_hour">Precio por Hora (€)</Label>
              <Input
                id="price_per_hour"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_hour || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_hour: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label htmlFor="price_per_day">Precio por Día (€)</Label>
              <Input
                id="price_per_day"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_day || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_day: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label htmlFor="price_fixed">Precio Fijo (€)</Label>
              <Input
                id="price_fixed"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_fixed || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price_fixed: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration_minutes">Duración (minutos)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="0"
                value={formData.duration_minutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label htmlFor="advance_booking_hours">Reserva Anticipada (horas)</Label>
              <Input
                id="advance_booking_hours"
                type="number"
                min="0"
                value={formData.advance_booking_hours}
                onChange={(e) => setFormData({ ...formData, advance_booking_hours: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_participants">Máx. Participantes</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                value={formData.max_participants || ''}
                onChange={(e) =>
                  setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label htmlFor="min_age">Edad Mínima</Label>
              <Input
                id="min_age"
                type="number"
                min="0"
                value={formData.min_age || ''}
                onChange={(e) =>
                  setFormData({ ...formData, min_age: e.target.value ? parseInt(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">URL de Imagen</Label>
            <Input
              id="image_url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_available">Disponible</Label>
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requires_booking">Requiere Reserva</Label>
              <Switch
                id="requires_booking"
                checked={formData.requires_booking}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_booking: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : experience ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
