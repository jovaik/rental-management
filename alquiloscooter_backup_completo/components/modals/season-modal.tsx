
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface Season {
  id?: number;
  season_name: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  is_high_season: boolean;
}

interface SeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  season?: Season | null;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function SeasonModal({ isOpen, onClose, onSave, season }: SeasonModalProps) {
  const [formData, setFormData] = useState<Season>({
    season_name: '',
    start_month: 1,
    start_day: 1,
    end_month: 12,
    end_day: 31,
    is_high_season: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && season) {
      setFormData(season);
    } else if (isOpen) {
      setFormData({
        season_name: '',
        start_month: 1,
        start_day: 1,
        end_month: 12,
        end_day: 31,
        is_high_season: true,
      });
    }
  }, [isOpen, season]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = season ? `/api/seasons/${season.id}` : '/api/seasons';
      const method = season ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save season');

      toast.success(season ? 'Temporada actualizada' : 'Temporada creada');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving season:', error);
      toast.error('Error al guardar la temporada');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{season ? 'Editar Temporada' : 'Nueva Temporada'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="season_name">Nombre de la Temporada *</Label>
            <Input
              id="season_name"
              value={formData.season_name}
              onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
              placeholder="Temporada Alta"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_month">Mes de Inicio *</Label>
              <Select
                value={formData.start_month.toString()}
                onValueChange={(value) => setFormData({ ...formData, start_month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_day">Día de Inicio *</Label>
              <Input
                id="start_day"
                type="number"
                min="1"
                max="31"
                value={formData.start_day}
                onChange={(e) => setFormData({ ...formData, start_day: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end_month">Mes de Fin *</Label>
              <Select
                value={formData.end_month.toString()}
                onValueChange={(value) => setFormData({ ...formData, end_month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="end_day">Día de Fin *</Label>
              <Input
                id="end_day"
                type="number"
                min="1"
                max="31"
                value={formData.end_day}
                onChange={(e) => setFormData({ ...formData, end_day: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_high_season">Es Temporada Alta</Label>
            <Switch
              id="is_high_season"
              checked={formData.is_high_season}
              onCheckedChange={(checked) => setFormData({ ...formData, is_high_season: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : season ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
