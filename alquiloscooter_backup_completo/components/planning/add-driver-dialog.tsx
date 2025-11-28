
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Users, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Reservation {
  id: number;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_date: string;
  return_date: string;
  drivers?: Array<{
    id: number;
    full_name: string;
    dni_nie: string;
    driver_license: string;
    license_expiry?: string;
    phone?: string;
    email?: string;
  }>;
}

interface AddDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  onDriverAdded: () => void;
}

interface DriverFormData {
  full_name: string;
  dni_nie: string;
  driver_license: string;
  license_expiry: string;
  phone: string;
  email: string;
}

export function AddDriverDialog({
  open,
  onOpenChange,
  reservation,
  onDriverAdded
}: AddDriverDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DriverFormData>({
    full_name: '',
    dni_nie: '',
    driver_license: '',
    license_expiry: '',
    phone: '',
    email: ''
  });

  // Reset form cuando se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        full_name: '',
        dni_nie: '',
        driver_license: '',
        license_expiry: '',
        phone: '',
        email: ''
      });
    }
  }, [open]);

  const handleInputChange = (field: keyof DriverFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      toast.error('El nombre completo es obligatorio');
      return false;
    }
    if (!formData.dni_nie.trim()) {
      toast.error('El DNI/NIE/Pasaporte es obligatorio');
      return false;
    }
    if (!formData.driver_license.trim()) {
      toast.error('El número de carnet es obligatorio');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    return true;
  };

  const handleAddDriver = async () => {
    if (!reservation) return;
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Llamar al endpoint para añadir conductor manual
      const response = await fetch(`/api/bookings/${reservation.id}/drivers/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          dni_nie: formData.dni_nie.trim().toUpperCase(),
          driver_license: formData.driver_license.trim().toUpperCase(),
          license_expiry: formData.license_expiry || null,
          phone: formData.phone.trim(),
          email: formData.email.trim() || null
        })
      });

      if (response.ok) {
        toast.success('Conductor añadido exitosamente');
        
        // Regenerar contrato si existe
        try {
          await fetch(`/api/contracts/${reservation.id}/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              changeReason: `Añadido conductor adicional: ${formData.full_name}`
            })
          });
        } catch (contractError) {
          console.error('Error regenerando contrato:', contractError);
        }
        
        onDriverAdded();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error añadiendo conductor');
      }
    } catch (error) {
      console.error('Error adding driver:', error);
      toast.error('Error añadiendo conductor');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span>Añadir Conductor Adicional</span>
          </DialogTitle>
          <DialogDescription>
            Introduce los datos del conductor adicional autorizado para esta reserva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alerta de privacidad */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>Protección de datos:</strong> Introduce manualmente los datos del conductor. 
                  Por privacidad, no se muestran listas de otros clientes.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conductores actuales */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Conductores Actuales</Label>
            <div className="space-y-2">
              {/* Cliente titular */}
              <Card className="border-green-300 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-semibold">{reservation.customer_name}</div>
                      <div className="text-xs text-green-700">Cliente titular (Firmante del contrato)</div>
                    </div>
                    <Badge variant="default" className="bg-green-600">Principal</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Conductores adicionales ya añadidos */}
              {reservation.drivers && reservation.drivers.map((driver, idx) => (
                <Card key={driver.id} className="border-gray-300">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-semibold">{driver.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {driver.dni_nie} - {driver.driver_license}
                        </div>
                      </div>
                      <Badge variant="outline">Adicional {idx + 1}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Formulario para nuevo conductor */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold mb-2 block">Datos del Nuevo Conductor</Label>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name" className="text-sm">
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Ej: MICHAEL JOHNSON"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dni_nie" className="text-sm">
                  DNI / NIE / Pasaporte <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dni_nie"
                  type="text"
                  placeholder="Ej: X1234567Y o AB123456"
                  value={formData.dni_nie}
                  onChange={(e) => handleInputChange('dni_nie', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="driver_license" className="text-sm">
                  Número de Carnet de Conducir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="driver_license"
                  type="text"
                  placeholder="Ej: 12345678"
                  value={formData.driver_license}
                  onChange={(e) => handleInputChange('driver_license', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="license_expiry" className="text-sm">
                  Fecha de Caducidad del Carnet (Opcional)
                </Label>
                <Input
                  id="license_expiry"
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ej: +34 612345678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm">
                  Email (Opcional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: conductor@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddDriver}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Añadiendo...' : 'Añadir Conductor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
