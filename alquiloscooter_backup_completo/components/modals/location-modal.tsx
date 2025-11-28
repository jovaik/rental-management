
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Wrench, Package, User, MapPin } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: any) => void;
  location?: any;
}

interface UserOption {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

const LOCATION_TYPES = [
  { value: 'office', label: 'Oficina', icon: Building2 },
  { value: 'workshop', label: 'Taller', icon: Wrench },
  { value: 'depot', label: 'Depósito', icon: Package },
  { value: 'client', label: 'Cliente', icon: User },
  { value: 'other', label: 'Otro', icon: MapPin },
];

export function LocationModal({ isOpen, onClose, onSave, location }: LocationModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'office',
    address: '',
    city: '',
    postal_code: '',
    country: 'España',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    user_id: null as number | null,
    notes: '',
    is_public_pickup_point: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      
      if (location) {
        setFormData({
          name: location.name || '',
          type: location.type || 'office',
          address: location.address || '',
          city: location.city || '',
          postal_code: location.postal_code || '',
          country: location.country || 'España',
          contact_person: location.contact_person || '',
          contact_phone: location.contact_phone || '',
          contact_email: location.contact_email || '',
          user_id: location.user_id || null,
          notes: location.notes || '',
          is_public_pickup_point: location.is_public_pickup_point || false,
        });
      } else {
        setFormData({
          name: '',
          type: 'office',
          address: '',
          city: '',
          postal_code: '',
          country: 'España',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          user_id: null,
          notes: '',
          is_public_pickup_point: false,
        });
      }
    }
  }, [isOpen, location]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response?.ok) {
        const data = await response.json();
        // Filtrar solo usuarios activos con rol taller, colaborador, u otros relevantes
        const filteredUsers = data.filter(
          (u: UserOption) =>
            u.role === 'taller' || u.role === 'colaborador' || u.role === 'operador'
        );
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {location ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="col-span-2">
              <Label htmlFor="name">Nombre de la Ubicación *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Oficina Marbella, Taller Central..."
                required
              />
            </div>

            {/* Tipo */}
            <div className="col-span-2">
              <Label htmlFor="type">Tipo de Ubicación *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Dirección */}
            <div className="col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Calle, número, etc."
              />
            </div>

            {/* Ciudad */}
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej: Marbella"
              />
            </div>

            {/* Código Postal */}
            <div>
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="Ej: 29600"
              />
            </div>

            {/* País */}
            <div className="col-span-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>

            {/* Persona de Contacto */}
            <div className="col-span-2">
              <Label htmlFor="contact_person">Persona de Contacto</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                placeholder="Nombre completo"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+34 XXX XXX XXX"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="contact_email">Email de Contacto</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="contacto@ejemplo.com"
              />
            </div>

            {/* Usuario Asociado */}
            <div className="col-span-2">
              <Label htmlFor="user_id">Usuario Asociado (Opcional)</Label>
              <Select
                value={formData.user_id?.toString() || 'none'}
                onValueChange={(value) =>
                  handleChange('user_id', value === 'none' ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin usuario asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin usuario asignado</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstname} {user.lastname} - {user.role} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'workshop'
                  ? 'Si asignas un usuario "taller", podrá ver los vehículos en esta ubicación'
                  : 'Asigna un usuario para que tenga acceso a esta ubicación'}
              </p>
            </div>

            {/* Punto de Recogida Público */}
            <div className="col-span-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_public_pickup_point">Punto de Recogida/Devolución Público</Label>
                  <p className="text-xs text-gray-500">
                    Activar si esta ubicación debe aparecer en el widget de reservas público.
                    Los talleres y depósitos internos deben estar desactivados.
                  </p>
                </div>
                <Switch
                  id="is_public_pickup_point"
                  checked={formData.is_public_pickup_point}
                  onCheckedChange={(checked) => handleChange('is_public_pickup_point', checked)}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Información adicional, horarios, instrucciones..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {location ? 'Actualizar' : 'Crear'} Ubicación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
