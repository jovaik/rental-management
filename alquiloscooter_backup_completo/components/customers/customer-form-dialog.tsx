// Versión estable sin OCR - Sistema clásico de subida de documentos
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { FileText, AlertCircle, CheckCircle2, X, Phone, Loader2 } from 'lucide-react';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number | null;
  onSuccess: (customer: any) => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess
}: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{[key: string]: File}>({});
  
  // Estado para verificación de teléfono
  const [phoneVerification, setPhoneVerification] = useState<{
    verified: boolean;
    checking: boolean;
    method: string;
    date: string | null;
  }>({
    verified: false,
    checking: false,
    method: '',
    date: null
  });
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street_address: '',
    address_details: '',
    postal_code: '',
    city: '',
    state: '',
    country: 'España',
    dni_nie: '',
    driver_license: '',
    license_expiry: '',
    date_of_birth: '',
    customer_type: 'individual',
    company_name: '',
    tax_id: '',
    preferred_language: 'es',
    notes: '',
    driver_license_front: '',
    driver_license_back: '',
    id_document_front: '',
    id_document_back: ''
  });

  useEffect(() => {
    if (customerId && open) {
      fetchCustomer(customerId);
    } else if (!customerId && open) {
      resetForm();
    }
  }, [customerId, open]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      street_address: '',
      address_details: '',
      postal_code: '',
      city: '',
      state: '',
      country: 'España',
      dni_nie: '',
      driver_license: '',
      license_expiry: '',
      date_of_birth: '',
      customer_type: 'individual',
      company_name: '',
      tax_id: '',
      preferred_language: 'es',
      notes: '',
      driver_license_front: '',
      driver_license_back: '',
      id_document_front: '',
      id_document_back: ''
    });
    setPendingFiles({});
    setPhoneVerification({
      verified: false,
      checking: false,
      method: '',
      date: null
    });
  };

  const fetchCustomer = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) throw new Error('Error al cargar cliente');
      const customer = await response.json();
      
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        street_address: customer.street_address || '',
        address_details: customer.address_details || '',
        postal_code: customer.postal_code || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || 'España',
        dni_nie: customer.dni_nie || '',
        driver_license: customer.driver_license || '',
        license_expiry: customer.license_expiry ? customer.license_expiry.split('T')[0] : '',
        date_of_birth: customer.date_of_birth ? customer.date_of_birth.split('T')[0] : '',
        customer_type: customer.customer_type || 'individual',
        company_name: customer.company_name || '',
        tax_id: customer.tax_id || '',
        preferred_language: customer.preferred_language || 'es',
        notes: customer.notes || '',
        driver_license_front: customer.driver_license_front || '',
        driver_license_back: customer.driver_license_back || '',
        id_document_front: customer.id_document_front || '',
        id_document_back: customer.id_document_back || ''
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  // Verificar teléfono automáticamente
  const verifyPhone = async (phone: string, name: string) => {
    if (!phone || phone.length < 8) return;

    try {
      setPhoneVerification(prev => ({ ...prev, checking: true }));
      
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          customerName: name 
        })
      });

      const result = await response.json();

      if (result.success && result.verified) {
        setPhoneVerification({
          verified: true,
          checking: false,
          method: result.method || 'whatsapp',
          date: result.verificationDate || new Date().toISOString()
        });
        toast.success('✅ Número verificado - Mensaje enviado', { duration: 3000 });
      } else {
        setPhoneVerification({
          verified: false,
          checking: false,
          method: 'none',
          date: null
        });
        toast.error('⚠️ No se pudo verificar el número', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error verificando teléfono:', error);
      setPhoneVerification({
        verified: false,
        checking: false,
        method: 'none',
        date: null
      });
    }
  };

  // Verificar teléfono cuando se ingrese un número válido
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const phone = formData.phone;
      const name = `${formData.first_name} ${formData.last_name}`.trim();
      
      // Solo verificar si el teléfono tiene al menos 8 dígitos y hay un nombre
      if (phone && phone.length >= 8 && name && !customerId) {
        verifyPhone(phone, name);
      }
    }, 2000); // Esperar 2 segundos después de que el usuario deje de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [formData.phone, formData.first_name, formData.last_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Para clientes NUEVOS: validamos que los documentos estén subidos
    if (!customerId) {
      if (!formData.driver_license_front || !formData.driver_license_back) {
        toast.error('Debe subir ambas caras del carnet de conducir');
        return;
      }

      if (!formData.id_document_front || !formData.id_document_back) {
        toast.error('Debe subir ambas caras del documento de identidad');
        return;
      }
    }

    // NOTA: Para clientes EXISTENTES (edición), NO validamos campos
    // porque pueden estar incompletos y completarse gradualmente

    try {
      setLoading(true);
      const url = customerId ? `/api/customers/${customerId}` : '/api/customers';
      const method = customerId ? 'PUT' : 'POST';

      // Preparar datos sin los campos "pending"
      const dataToSave = { 
        ...formData,
        // Agregar campos de verificación de teléfono
        phone_verified: phoneVerification.verified,
        phone_verification_date: phoneVerification.date ? new Date(phoneVerification.date) : null,
        phone_verification_method: phoneVerification.method || null
      };
      Object.keys(dataToSave).forEach(key => {
        if ((dataToSave as any)[key] === 'pending') {
          (dataToSave as any)[key] = '';
        }
      });

      console.log('💾 Datos a guardar:', dataToSave);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el cliente');
      }

      let customer = await response.json();

      // Si es un cliente nuevo y hay archivos pendientes, subirlos ahora
      if (!customerId && Object.keys(pendingFiles).length > 0) {
        toast.loading('Subiendo documentos...');
        
        for (const [docType, file] of Object.entries(pendingFiles)) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          formDataUpload.append('documentType', docType);

          const uploadResponse = await fetch(`/api/customers/${customer.id}/upload-document`, {
            method: 'POST',
            body: formDataUpload
          });

          if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            customer[docType] = result.cloud_storage_path;
          }
        }
        
        setPendingFiles({});
        toast.dismiss();
      }

      toast.success(customerId ? 'Cliente actualizado' : 'Cliente creado exitosamente');
      onSuccess(customer);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    // Si el cliente ya existe, subir directamente
    if (customerId) {
      try {
        setUploadingDoc(documentType);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('documentType', documentType);

        const response = await fetch(`/api/customers/${customerId}/upload-document`, {
          method: 'POST',
          body: formDataUpload
        });

        if (!response.ok) throw new Error('Error al subir el documento');

        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          [documentType]: result.cloud_storage_path
        }));
        toast.success('Documento guardado');
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Error al subir el documento');
      } finally {
        setUploadingDoc(null);
      }
    } else {
      // Si es un cliente nuevo, guardar el archivo temporalmente
      setPendingFiles(prev => ({
        ...prev,
        [documentType]: file
      }));
      setFormData(prev => ({
        ...prev,
        [documentType]: 'pending' // Marcador temporal
      }));
      toast.success('Documento agregado (se subirá al guardar)');
    }
  };

  const handleDeleteDocument = async (documentType: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    // Si el cliente ya existe, eliminar del servidor
    if (customerId) {
      try {
        setUploadingDoc(documentType);
        const response = await fetch(`/api/customers/${customerId}/delete-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType })
        });

        if (!response.ok) throw new Error('Error al eliminar el documento');

        setFormData(prev => ({
          ...prev,
          [documentType]: ''
        }));
        toast.success('Documento eliminado');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Error al eliminar el documento');
      } finally {
        setUploadingDoc(null);
      }
    } else {
      // Si es un cliente nuevo, eliminar del estado temporal
      setPendingFiles(prev => {
        const updated = { ...prev };
        delete updated[documentType];
        return updated;
      });
      setFormData(prev => ({
        ...prev,
        [documentType]: ''
      }));
      toast.success('Documento eliminado');
    }
  };

  const renderDocumentUpload = (
    documentType: string,
    label: string,
    description: string
  ) => {
    const fieldValue = (formData as any)[documentType];
    const hasDocument = fieldValue && fieldValue !== '';
    const isPending = fieldValue === 'pending';
    const isUploading = uploadingDoc === documentType;

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-sm text-gray-500">{description}</p>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(documentType, file);
              }
            }}
            disabled={isUploading}
            className="flex-1"
          />
          {hasDocument && !isPending && (
            <>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Subido
              </Badge>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteDocument(documentType)}
                disabled={isUploading}
                className="h-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {isPending && (
            <>
              <Badge variant="default" className="bg-blue-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Listo
              </Badge>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteDocument(documentType)}
                disabled={isUploading}
                className="h-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {!hasDocument && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Requerido
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customerId ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Datos Personales</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="address">Dirección</TabsTrigger>
            </TabsList>

            {/* Personal Data */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Obligatorio"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellidos *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Obligatorio"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Obligatorio"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Obligatorio"
                      required
                      className={`pr-10 ${
                        phoneVerification.verified ? 'border-green-500' : 
                        phoneVerification.checking ? 'border-blue-400' : ''
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneVerification.checking && (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                      {!phoneVerification.checking && phoneVerification.verified && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {!phoneVerification.checking && !phoneVerification.verified && formData.phone && formData.phone.length >= 8 && (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                  {phoneVerification.verified && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Número verificado - Mensaje enviado
                    </p>
                  )}
                  {!phoneVerification.verified && !phoneVerification.checking && formData.phone && formData.phone.length >= 8 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      El número no pudo ser verificado
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_language">Idioma Preferido</Label>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="customer_type">Tipo de Cliente</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.customer_type === 'company' && (
                  <>
                    <div>
                      <Label htmlFor="company_name">Nombre de Empresa</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax_id">CIF/NIF</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Address */}
            <TabsContent value="address" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street_address">Dirección (Calle y Número)</Label>
                  <Input
                    id="street_address"
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    placeholder="Se puede completar después"
                  />
                </div>
                <div>
                  <Label htmlFor="address_details">Detalles Adicionales (Piso, Puerta)</Label>
                  <Input
                    id="address_details"
                    value={formData.address_details}
                    onChange={(e) => setFormData({ ...formData, address_details: e.target.value })}
                    placeholder="3º B"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">Provincia/Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="España"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">📋 Documentos Obligatorios</h4>
                    <p className="text-sm text-blue-800">
                      Para crear un nuevo cliente es obligatorio subir:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-800 mt-2">
                      <li><strong>Carnet de conducir</strong> (cara frontal y trasera)</li>
                      <li><strong>Documento de identidad/Pasaporte</strong> (cara frontal y trasera)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Carnet de Conducir
                  </h3>
                  <div className="space-y-4">
                    {renderDocumentUpload(
                      'driver_license_front',
                      'Cara Frontal del Carnet *',
                      'Fotografía o escaneo de la parte delantera del carnet de conducir'
                    )}
                    {renderDocumentUpload(
                      'driver_license_back',
                      'Cara Trasera del Carnet *',
                      'Fotografía o escaneo de la parte trasera del carnet de conducir'
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documento de Identidad/Pasaporte
                  </h3>
                  <div className="space-y-4">
                    {renderDocumentUpload(
                      'id_document_front',
                      'Cara Frontal del Documento *',
                      'Fotografía o escaneo de la parte delantera del DNI/NIE/Pasaporte'
                    )}
                    {renderDocumentUpload(
                      'id_document_back',
                      'Cara Trasera del Documento *',
                      'Fotografía o escaneo de la parte trasera del DNI/NIE/Pasaporte'
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dni_nie">DNI/NIE/Pasaporte (Opcional)</Label>
                      <Input
                        id="dni_nie"
                        value={formData.dni_nie}
                        onChange={(e) => setFormData({ ...formData, dni_nie: e.target.value })}
                        placeholder="Número del documento"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="driver_license">Número de Carnet (Opcional)</Label>
                        <Input
                          id="driver_license"
                          value={formData.driver_license}
                          onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })}
                          placeholder="Número del carnet"
                        />
                      </div>
                      <div>
                        <Label htmlFor="license_expiry">Fecha de Caducidad del Carnet</Label>
                        <Input
                          id="license_expiry"
                          type="date"
                          value={formData.license_expiry}
                          onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Guardando...' : customerId ? 'Actualizar' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
