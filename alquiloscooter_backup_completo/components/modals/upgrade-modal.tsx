
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';

interface Upgrade {
  id?: number;
  name: string;
  description?: string | null;
  upgrade_type: string;
  fee_per_day: number;
  is_available: boolean;
  display_order: number;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  upgrade?: Upgrade | null;
}

export function UpgradeModal({ isOpen, onClose, onSave, upgrade }: UpgradeModalProps) {
  const [formData, setFormData] = useState<Upgrade>({
    name: '',
    description: '',
    upgrade_type: 'unlimited_km',
    fee_per_day: 0,
    is_available: true,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && upgrade) {
      setFormData(upgrade);
    } else if (isOpen) {
      setFormData({
        name: '',
        description: '',
        upgrade_type: 'unlimited_km',
        fee_per_day: 0,
        is_available: true,
        display_order: 0,
      });
    }
  }, [isOpen, upgrade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = upgrade ? `/api/pricing/upgrades/${upgrade.id}` : '/api/pricing/upgrades';
      const method = upgrade ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save upgrade');

      toast.success(upgrade ? 'Upgrade actualizado' : 'Upgrade creado');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving upgrade:', error);
      toast.error('Error al guardar el upgrade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{upgrade ? 'Editar Upgrade' : 'Nuevo Upgrade'}</DialogTitle>
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
            <Label htmlFor="upgrade_type">Tipo de Upgrade</Label>
            <Input
              id="upgrade_type"
              value={formData.upgrade_type}
              onChange={(e) => setFormData({ ...formData, upgrade_type: e.target.value })}
              placeholder="unlimited_km, second_driver, etc."
            />
          </div>

          <div>
            <Label htmlFor="fee_per_day">Tarifa por Día (€) *</Label>
            <Input
              id="fee_per_day"
              type="number"
              step="0.01"
              min="0"
              value={formData.fee_per_day}
              onChange={(e) => setFormData({ ...formData, fee_per_day: parseFloat(e.target.value) })}
              required
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
              {saving ? 'Guardando...' : upgrade ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
