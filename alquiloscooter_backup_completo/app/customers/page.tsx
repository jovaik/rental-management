
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { Search, Plus, Phone, Mail, Calendar, Car, Edit, Trash2, MapPin, FileText, Eye, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleGuard } from '@/components/auth/role-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { DocumentManagement, ExtractedDocumentData } from '@/components/customers/DocumentManagement';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  street_address?: string;
  address_details?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  country?: string;
  dni_nie?: string;
  driver_license?: string;
  license_expiry?: string;
  date_of_birth?: string;
  customer_type: string;
  company_name?: string;
  tax_id?: string;
  preferred_language?: string;
  notes?: string;
  status: string;
  driver_license_front?: string;
  driver_license_back?: string;
  id_document_front?: string;
  id_document_back?: string;
  bookings?: any[];
}

export default function CustomersPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'operador']}>
      <CustomersPageContent />
    </RoleGuard>
  );
}

function CustomersPageContent() {
  const { data: session } = useSession() || {};
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Customer>>({
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
    customer_type: 'individual',
    status: 'active'
  });

  const [files, setFiles] = useState<{
    driver_license_front?: File;
    driver_license_back?: File;
    id_document_front?: File;
    id_document_back?: File;
  }>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (response?.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
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
        customer_type: 'individual',
        status: 'active'
      });
    }
    setFiles({});
    setDialogOpen(true);
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  // ✅ NUEVO: Auto-rellenar formulario con datos extraídos del OCR
  const handleExtractedData = (data: ExtractedDocumentData) => {
    console.log('🎯 [FORMULARIO] handleExtractedData recibido en /customers');
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
    // Validación MÍNIMA - SOLO los campos absolutamente esenciales
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      toast.error('Por favor complete: Nombre, Apellidos y Teléfono');
      return;
    }

    setSaving(true);

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      console.log('💾 Guardando cliente:', { url, method, formData });

      // Enviar como JSON (la API espera JSON)
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response?.ok) {
        const savedCustomer = await response.json();
        
        // Si hay archivos nuevos, subirlos ahora (TODOS EN UNA SOLA PETICIÓN como inspecciones)
        if (Object.keys(files).length > 0 && savedCustomer.id) {
          try {
            const uploadFormData = new FormData();
            
            // Añadir todos los archivos al FormData (igual que inspecciones)
            for (const [docType, file] of Object.entries(files)) {
              if (file) {
                console.log('📤 Añadiendo documento:', docType, file.name);
                uploadFormData.append(docType, file);
              }
            }
            
            console.log('📤 Subiendo todos los documentos juntos...');
            
            const uploadResponse = await fetch(`/api/customers/${savedCustomer.id}/documents`, {
              method: 'POST',
              body: uploadFormData,
            });
            
            if (uploadResponse.ok) {
              const result = await uploadResponse.json();
              console.log('✅ Documentos subidos:', result);
              toast.success('Documentos subidos correctamente');
              
              // Actualizar editingCustomer con los nuevos documentos
              if (editingCustomer) {
                setEditingCustomer({
                  ...editingCustomer,
                  ...result.customer
                });
              }
            } else {
              const error = await uploadResponse.json();
              console.error('❌ Error subiendo documentos:', error);
              toast.error(error.error || 'Error al subir documentos');
            }
          } catch (uploadError) {
            console.error('❌ Error subiendo archivos:', uploadError);
            toast.error('Error al subir documentos');
          }
        }
        
        // Recargar los datos del cliente específico para actualizar la vista
        await fetchCustomers();
        
        // Si estamos editando, actualizar el estado con los datos más recientes
        if (editingCustomer && savedCustomer.id) {
          const updatedCustomerResponse = await fetch(`/api/customers/${savedCustomer.id}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (updatedCustomerResponse.ok) {
            const updatedCustomer = await updatedCustomerResponse.json();
            setEditingCustomer(updatedCustomer);
          }
        }
        
        setDialogOpen(false);
        toast.success(editingCustomer ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar cliente');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este cliente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response?.ok) {
        await fetchCustomers();
        toast.success('Cliente eliminado');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar cliente');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error al eliminar cliente');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.dni_nie?.includes(searchTerm)
  );

  const hasCompleteData = (customer: Customer) => {
    return !!(
      customer.street_address &&
      customer.postal_code &&
      customer.city &&
      customer.country &&
      customer.dni_nie &&
      customer.driver_license &&
      customer.id_document_front &&
      customer.id_document_back &&
      customer.driver_license_front &&
      customer.driver_license_back
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Clientes</h1>
          <p className="text-gray-600">
            Administra la información completa de tus clientes, direcciones y documentación legal
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const complete = hasCompleteData(customer);
          
          return (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {customer.first_name} {customer.last_name}
                      {complete ? (
                        <span title="Datos completos">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </span>
                      ) : (
                        <span title="Datos incompletos">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {customer.dni_nie || 'Sin DNI/NIE'}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(customer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={customer.status === 'active' ? 'default' : customer.status === 'incomplete' ? 'destructive' : 'secondary'}>
                    {customer.status === 'active' ? 'Activo' : customer.status === 'incomplete' ? '⚠️ Incompleto' : 'Inactivo'}
                  </Badge>
                  {customer.status === 'incomplete' && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      Faltan datos
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>

                  {customer.city && customer.country && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{customer.city}, {customer.country}</span>
                    </div>
                  )}

                  {customer.bookings && customer.bookings.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Car className="w-4 h-4 mr-1 text-blue-600" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {customer.bookings.length}
                        </div>
                        <div className="text-xs text-gray-500">Reservas</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Calendar className="w-4 h-4 mr-1 text-green-600" />
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          €{customer.bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0).toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">Total gastado</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Intenta con términos de búsqueda diferentes'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Solo necesita completar: Nombre, Apellidos y Teléfono (*). Los demás campos son opcionales y puede agregarlos más tarde.
            </DialogDescription>
          </DialogHeader>

          {/* Alerta de cliente incompleto */}
          {editingCustomer && formData.status === 'incomplete' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    ⚠️ Cliente con datos incompletos
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Este cliente fue creado desde una reserva rápida. <strong>Debe completar los siguientes datos obligatorios antes de la devolución del vehículo:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {!formData.dni_nie && <li>DNI/NIE/Pasaporte</li>}
                      {!formData.street_address && <li>Dirección permanente completa</li>}
                      {!formData.driver_license_front && <li>Carnet de conducir (fotos ambas caras)</li>}
                      {!formData.id_document_front && <li>Documento de identidad (fotos ambas caras)</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Datos Personales y Dirección</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              {/* DATOS PERSONALES */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nombre *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Apellidos *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="García López"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="dni_nie">DNI/NIE/Pasaporte</Label>
                    <Input
                      id="dni_nie"
                      value={formData.dni_nie || ''}
                      onChange={(e) => setFormData({ ...formData, dni_nie: e.target.value })}
                      placeholder="12345678A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_license">Número Carnet Conducir</Label>
                    <Input
                      id="driver_license"
                      value={formData.driver_license || ''}
                      onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })}
                      placeholder="99999999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="customer_type">Tipo de Cliente</Label>
                    <Select
                      value={formData.customer_type || 'individual'}
                      onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {/* Espacio para mantener alineación */}
                  </div>
                </div>

                {formData.customer_type === 'business' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="company_name">Nombre Empresa</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name || ''}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Mi Empresa S.L."
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax_id">CIF/NIF Empresa</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id || ''}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        placeholder="B12345678"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DIRECCIÓN */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dirección Permanente</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    <strong>Recomendado:</strong> La dirección permanente completa es recomendable para gestionar los alquileres. Puede añadirla más tarde.
                  </p>
                </div>

                <div>
                  <Label htmlFor="street_address">Calle y Número</Label>
                  <Input
                    id="street_address"
                    value={formData.street_address || ''}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    placeholder="Calle Principal 123"
                  />
                </div>

                <div className="mt-4">
                  <Label htmlFor="address_details">Detalles Adicionales</Label>
                  <Input
                    id="address_details"
                    value={formData.address_details || ''}
                    onChange={(e) => setFormData({ ...formData, address_details: e.target.value })}
                    placeholder="Piso 2, Puerta B, Edificio Norte..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="28001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Madrid"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Select
                      value={formData.country || 'España'}
                      onValueChange={(value) => {
                        if (value === 'otro') {
                          // Si selecciona "otro", poner un input manual
                          setFormData({ ...formData, country: '' });
                        } else {
                          setFormData({ ...formData, country: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="España">España</SelectItem>
                        <SelectItem value="Francia">Francia</SelectItem>
                        <SelectItem value="Portugal">Portugal</SelectItem>
                        <SelectItem value="Italia">Italia</SelectItem>
                        <SelectItem value="Alemania">Alemania</SelectItem>
                        <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                        <SelectItem value="Países Bajos">Países Bajos</SelectItem>
                        <SelectItem value="Bélgica">Bélgica</SelectItem>
                        <SelectItem value="Suiza">Suiza</SelectItem>
                        <SelectItem value="Austria">Austria</SelectItem>
                        <SelectItem value="otro">Otro (escribir manualmente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(!formData.country || (formData.country && !['España', 'Francia', 'Portugal', 'Italia', 'Alemania', 'Reino Unido', 'Países Bajos', 'Bélgica', 'Suiza', 'Austria'].includes(formData.country))) && (
                  <div className="mt-4">
                    <Label htmlFor="country_manual">País (escribir manualmente)</Label>
                    <Input
                      id="country_manual"
                      value={formData.country || ''}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Escriba el país"
                    />
                  </div>
                )}
              </div>

              {/* NOTAS */}
              <div className="border-t pt-4">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Información adicional sobre el cliente..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              {editingCustomer ? (
                <DocumentManagement
                  customerId={editingCustomer.id}
                  documents={{
                    driver_license_front: editingCustomer.driver_license_front || undefined,
                    driver_license_back: editingCustomer.driver_license_back || undefined,
                    id_document_front: editingCustomer.id_document_front || undefined,
                    id_document_back: editingCustomer.id_document_back || undefined
                  }}
                  onUpdate={fetchCustomers}
                  onExtractedDataChange={handleExtractedData}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Por favor, guarde el cliente primero para poder subir documentos.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : (editingCustomer ? 'Guardar Cambios' : 'Crear Cliente')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
