
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentManagement, ExtractedDocumentData } from '@/components/customers/DocumentManagement';
import { ArrowLeft, Save, User, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  street_address: string | null;
  address_details: string | null;
  postal_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  dni_nie: string | null;
  driver_license: string | null;
  license_expiry: string | null;
  date_of_birth: string | null;
  customer_type: string;
  company_name: string | null;
  tax_id: string | null;
  preferred_language: string | null;
  notes: string | null;
  status: string;
  driver_license_front: string | null;
  driver_license_back: string | null;
  id_document_front: string | null;
  id_document_back: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function ClienteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setFormData(data);
      } else {
        toast.error('Error al cargar cliente');
        router.push('/clientes');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Error al cargar cliente');
      router.push('/clientes');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Auto-rellenar formulario con datos extraídos del OCR
  const handleExtractedData = (data: ExtractedDocumentData) => {
    console.log('🎯 [FORMULARIO] handleExtractedData recibido en /clientes/[id]');
    console.log('📥 [FORMULARIO] Datos recibidos:', data);
    console.log('📝 [FORMULARIO] Estado formData ANTES:', formData);
    
    setFormData(prev => ({
      ...prev,
      // ✅ CAMPOS PRIORITARIOS PARA MULTAS
      first_name: data.firstName || prev.first_name,           // NOMBRE
      last_name: data.lastName || prev.last_name,              // APELLIDOS
      dni_nie: data.documentNumber || prev.dni_nie,            // DNI/NIE/PASAPORTE
      driver_license: data.licenseNumber || prev.driver_license, // NRO CARNET CONDUCIR
      street_address: data.address || prev.street_address,     // DIRECCIÓN COMPLETA
      city: data.city || prev.city,                            // CIUDAD
      postal_code: data.postalCode || prev.postal_code,        // CÓDIGO POSTAL
      
      // Otros campos útiles
      date_of_birth: data.dateOfBirth || prev.date_of_birth,  // Fecha nacimiento
      license_expiry: data.expiryDate || prev.license_expiry  // Fecha caducidad carnet
    }));

    console.log('✅ [FORMULARIO] setFormData ejecutado correctamente');

    // Notificación detallada de los campos rellenados
    const filledFields = [];
    if (data.firstName) filledFields.push('Nombre');
    if (data.lastName) filledFields.push('Apellidos');
    if (data.documentNumber) filledFields.push('DNI/Pasaporte');
    if (data.licenseNumber) filledFields.push('Nro. Carnet');
    if (data.address) filledFields.push('Dirección');
    if (data.city) filledFields.push('Ciudad');
    if (data.postalCode) filledFields.push('C.P.');
    
    console.log('🎉 [FORMULARIO] Campos que serán rellenados:', filledFields.join(', '));
    toast.success(`✅ Campos rellenados: ${filledFields.join(', ')}`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Cliente actualizado correctamente');
        fetchCustomer();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error al actualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cliente no encontrado</p>
          <Button onClick={() => router.push('/clientes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/clientes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Cliente desde {format(new Date(customer.created_at), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* ⚠️ ALERTA CRÍTICA: Cliente con datos incompletos */}
      {customer.status === 'incomplete' && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">
                ⚠️ ATENCIÓN: CLIENTE CON DATOS INCOMPLETOS
              </h3>
              <p className="text-base text-red-700 mb-3 font-semibold">
                NO PUEDE DEVOLVER EL DEPÓSITO HASTA COMPLETAR LOS SIGUIENTES DATOS OBLIGATORIOS:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-2 ml-2 bg-white/50 p-4 rounded">
                {!customer.first_name && (
                  <li className="font-semibold">
                    ❌ <strong>Nombre</strong> - Campo obligatorio
                  </li>
                )}
                {!customer.last_name && (
                  <li className="font-semibold">
                    ❌ <strong>Apellidos</strong> - Campo obligatorio
                  </li>
                )}
                {!customer.email && (
                  <li className="font-semibold">
                    ❌ <strong>Email</strong> - Correo electrónico
                  </li>
                )}
                {!customer.phone && (
                  <li className="font-semibold">
                    ❌ <strong>Teléfono</strong> - Número de contacto
                  </li>
                )}
                {!customer.driver_license_front && (
                  <li className="font-semibold">
                    ❌ <strong>Carnet de conducir</strong> - Foto del documento
                  </li>
                )}
                {!customer.id_document_front && (
                  <li className="font-semibold">
                    ❌ <strong>Pasaporte o DNI/NIE</strong> - Foto del documento
                  </li>
                )}
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Importante:</strong> Complete todos los datos en las pestañas "Información Personal" y "Documentación" abajo. 
                  El cliente se marcará automáticamente como "Activo" cuando complete todos los campos obligatorios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">
            <User className="w-4 h-4 mr-2" />
            Información Personal
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documentación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Básicos</CardTitle>
              <CardDescription>Información personal del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellidos *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni_nie">DNI/NIE/Pasaporte</Label>
                  <Input
                    id="dni_nie"
                    value={formData.dni_nie || ''}
                    onChange={(e) => handleInputChange('dni_nie', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_license">Nº Carnet de Conducir</Label>
                  <Input
                    id="driver_license"
                    value={formData.driver_license || ''}
                    onChange={(e) => handleInputChange('driver_license', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth?.split('T')[0] || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dirección */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
              <CardDescription>Dirección permanente del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street_address">Calle y Número</Label>
                <Input
                  id="street_address"
                  value={formData.street_address || ''}
                  onChange={(e) => handleInputChange('street_address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_details">Piso, Puerta, Otros</Label>
                <Input
                  id="address_details"
                  value={formData.address_details || ''}
                  onChange={(e) => handleInputChange('address_details', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Provincia</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country || 'España'}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>Información adicional del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Internas</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Información adicional, preferencias, observaciones..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-6">
          <DocumentManagement
            customerId={customer.id}
            documents={{
              driver_license_front: customer.driver_license_front || undefined,
              driver_license_back: customer.driver_license_back || undefined,
              id_document_front: customer.id_document_front || undefined,
              id_document_back: customer.id_document_back || undefined
            }}
            onUpdate={fetchCustomer}
            onExtractedDataChange={handleExtractedData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
