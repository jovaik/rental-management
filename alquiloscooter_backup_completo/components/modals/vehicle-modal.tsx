
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, FileText, Upload, Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { VehicleMaintenanceSection } from '@/components/vehicle-maintenance-section';
import { VehicleSparePartsSection } from '@/components/vehicle-spare-parts-section';
import { VehicleModelPhotosManager } from '@/components/vehicles/vehicle-model-photos-manager';
import { DocumentImageProcessor } from '@/lib/image-processor';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: any) => void;
  vehicle?: any;
}

interface PricingGroup {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface VehicleDocument {
  id: number;
  document_type: string;
  title: string;
  description?: string;
  file_name: string;
  file_size?: number;
  created_at: string;
  uploader?: {
    firstname: string;
    lastname: string;
  };
}

export function VehicleModal({ isOpen, onClose, onSave, vehicle }: VehicleModalProps) {
  const { data: session } = useSession() || {};
  const userRole = session?.user?.role;
  const isTaller = userRole === 'taller';
  
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [owners, setOwners] = useState<User[]>([]);
  const [depositors, setDepositors] = useState<User[]>([]);
  const [businessLocations, setBusinessLocations] = useState<any[]>([]);
  
  // Estados para documentos
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [newDocument, setNewDocument] = useState<{
    file: File | null;
    type: string;
    title: string;
    description: string;
  }>({
    file: null,
    type: 'permiso_circulacion',
    title: '',
    description: ''
  });
  
  // Estado para el procesamiento automático de imágenes
  const [processingImage, setProcessingImage] = useState(false);
  
  // Referencia para el input de archivo (mismo patrón que en inspecciones)
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    // Información básica
    registration_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    fuel_type: 'Gasolina',
    mileage: 0,
    condition_rating: 'Bueno',
    status: 'T',
    pricing_group_id: null as number | null,
    
    // Seguro
    insurance_policy: '',
    insurance_start_date: '',
    insurance_expiry: '',
    insurance_policy_type: 'daily',
    insurance_active: false,
    
    // ITV
    itv_valid: false,
    last_itv_date: '',
    itv_expiry: '',
    
    // Propiedad
    ownership_type: 'owned',
    rental_contract_end: '',
    rental_monthly_payment: 0,
    commission_percentage: 0,
    monthly_fixed_costs: 0,
    rental_conditions: '',
    owner_user_id: null as number | null,
    depositor_user_id: null as number | null,
    
    // Valoración
    purchase_price: 0,
    market_value: 0,
    sale_price: 0,
    
    // Adicionales
    document_status: '',
    spare_keys: false,
    assigned_to: '',
    current_location: '',  // LEGACY - mantener por compatibilidad
    
    // Business Location (NEW)
    current_business_location_id: null as number | null,
    location_reason: '',
    location_since: '',
    
    // Archive Management (for sold/retired vehicles)
    archived_status: null as string | null,
    archived_date: '',
    archived_reason: '',
    buyer_name: '',
    sale_amount: 0,
    
    notes: ''
  });

  // Calcular si el seguro está activo
  const calculateInsuranceActive = () => {
    if (!formData.insurance_expiry) return false;
    const expiryDate = new Date(formData.insurance_expiry);
    const today = new Date();
    return expiryDate > today;
  };

  // Calcular si la ITV está válida
  const calculateITVValid = () => {
    if (!formData.itv_expiry) return false;
    const expiryDate = new Date(formData.itv_expiry);
    const today = new Date();
    return expiryDate > today;
  };

  // Cargar grupos de tarifas, usuarios propietarios/cesionarios y ubicaciones
  useEffect(() => {
    if (isOpen) {
      setLoadingGroups(true);
      // Cargar pricing groups
      fetch('/api/pricing-groups')
        .then(res => {
          if (!res?.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          setPricingGroups(data || []);
        })
        .catch(err => {
          console.error('Error loading pricing groups:', err);
          setPricingGroups([]);
        })
        .finally(() => setLoadingGroups(false));
      
      // Cargar usuarios propietarios y cesionarios
      fetch('/api/users/owners-depositors')
        .then(res => {
          if (!res?.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then(data => {
          setOwners(data.owners || []);
          setDepositors(data.depositors || []);
        })
        .catch(err => {
          console.error('Error loading owners/depositors:', err);
          setOwners([]);
          setDepositors([]);
        });
      
      // Cargar ubicaciones de negocio
      fetch('/api/business-locations')
        .then(res => {
          if (!res?.ok) throw new Error('Failed to fetch locations');
          return res.json();
        })
        .then(data => {
          setBusinessLocations(data || []);
        })
        .catch(err => {
          console.error('Error loading business locations:', err);
          setBusinessLocations([]);
        });
    }
  }, [isOpen]);

  // Actualizar el formulario cuando cambie el vehículo
  useEffect(() => {
    if (isOpen) {
      setFormData({
        registration_number: vehicle?.registration_number || '',
        make: vehicle?.make || '',
        model: vehicle?.model || '',
        year: vehicle?.year || new Date().getFullYear(),
        color: vehicle?.color || '',
        vin: vehicle?.vin || '',
        fuel_type: vehicle?.fuel_type || 'Gasolina',
        mileage: vehicle?.mileage || 0,
        condition_rating: vehicle?.condition_rating || 'Bueno',
        status: vehicle?.status || 'T',
        pricing_group_id: vehicle?.pricing_group_id || null,
        
        insurance_policy: vehicle?.insurance_policy || '',
        insurance_start_date: vehicle?.insurance_start_date || '',
        insurance_expiry: vehicle?.insurance_expiry || '',
        insurance_policy_type: vehicle?.insurance_policy_type || 'daily',
        insurance_active: vehicle?.insurance_active || false,
        
        itv_valid: vehicle?.itv_valid || false,
        last_itv_date: vehicle?.last_itv_date || '',
        itv_expiry: vehicle?.itv_expiry || '',
        
        ownership_type: vehicle?.ownership_type || 'owned',
        rental_contract_end: vehicle?.rental_contract_end || '',
        rental_monthly_payment: vehicle?.rental_monthly_payment || 0,
        commission_percentage: vehicle?.commission_percentage || 0,
        monthly_fixed_costs: vehicle?.monthly_fixed_costs || 0,
        rental_conditions: vehicle?.rental_conditions || '',
        owner_user_id: vehicle?.owner_user_id || null,
        depositor_user_id: vehicle?.depositor_user_id || null,
        
        purchase_price: vehicle?.purchase_price || 0,
        market_value: vehicle?.market_value || 0,
        sale_price: vehicle?.sale_price || 0,
        
        document_status: vehicle?.document_status || '',
        spare_keys: vehicle?.spare_keys || false,
        assigned_to: vehicle?.assigned_to || '',
        current_location: vehicle?.current_location || '',
        
        current_business_location_id: vehicle?.current_business_location_id || null,
        location_reason: vehicle?.location_reason || '',
        location_since: vehicle?.location_since || '',
        
        archived_status: vehicle?.archived_status || null,
        archived_date: vehicle?.archived_date || '',
        archived_reason: vehicle?.archived_reason || '',
        buyer_name: vehicle?.buyer_name || '',
        sale_amount: vehicle?.sale_amount || 0,
        
        notes: vehicle?.notes || ''
      });
    }
  }, [isOpen, vehicle]);

  // Actualizar el estado de seguro cuando cambie la fecha
  useEffect(() => {
    if (formData.insurance_expiry) {
      setFormData(prev => ({
        ...prev,
        insurance_active: calculateInsuranceActive()
      }));
    }
  }, [formData.insurance_expiry]);

  // Actualizar el estado de ITV cuando cambie la fecha
  useEffect(() => {
    if (formData.itv_expiry) {
      setFormData(prev => ({
        ...prev,
        itv_valid: calculateITVValid()
      }));
    }
  }, [formData.itv_expiry]);

  // Cargar documentos cuando se abre el modal y hay un vehículo
  useEffect(() => {
    if (isOpen && vehicle?.id) {
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [isOpen, vehicle?.id]);

  // Función para cargar documentos
  const loadDocuments = async () => {
    if (!vehicle?.id) return;
    
    setLoadingDocuments(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/documents`);
      if (response?.ok) {
        const data = await response.json();
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Función para manejar la selección de archivo con procesamiento automático
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('📁 Archivo seleccionado:', file);
    if (!file) return;

    // Verificar si es una imagen
    const isImage = file.type.startsWith('image/');
    console.log('🖼️ ¿Es imagen?:', isImage, 'Tipo:', file.type);
    
    if (isImage) {
      // Si es imagen, procesar automáticamente
      console.log('🔄 Iniciando procesamiento automático...');
      setProcessingImage(true);
      toast.loading('Procesando imagen automáticamente...', { id: 'processing' });
      
      try {
        console.log('📷 Creando procesador de imágenes...');
        const processor = new DocumentImageProcessor();
        console.log('📐 Procesando documento...');
        const processedBlob = await processor.processDocument(file);
        console.log('✅ Documento procesado, blob size:', processedBlob.size);
        
        // Convertir el blob procesado a File
        const processedFile = new File([processedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        console.log('💾 Archivo procesado creado:', processedFile);
        setNewDocument({ ...newDocument, file: processedFile });
        toast.success('✅ Imagen procesada y recortada automáticamente', { id: 'processing' });
      } catch (error) {
        console.error('❌ Error procesando imagen:', error);
        toast.error('Error al procesar la imagen. Se usará la original.', { id: 'processing' });
        // En caso de error, usar la imagen original
        setNewDocument({ ...newDocument, file });
      } finally {
        setProcessingImage(false);
      }
    } else {
      // Si no es imagen (PDF, DOC, etc.), guardar directamente
      console.log('📄 No es imagen, guardando directamente');
      setNewDocument({ ...newDocument, file });
    }
  };

  // Función para subir documento
  // Función auxiliar para generar título del tipo de documento
  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'permiso_circulacion': 'Permiso de Circulación',
      'ficha_tecnica': 'Ficha Técnica',
      'itv': 'ITV',
      'seguro': 'Seguro',
      'contrato_renting': 'Contrato Renting',
      'contrato_compra': 'Contrato Compra/Venta',
      'transferencia': 'Transferencia',
      'factura': 'Factura',
      'otro': 'Otro Documento'
    };
    return labels[type] || 'Documento';
  };

  const handleUploadDocument = async () => {
    console.log('handleUploadDocument llamada');
    console.log('vehicle:', vehicle);
    console.log('newDocument:', newDocument);
    
    if (!vehicle?.id) {
      console.log('Error: No hay ID de vehículo');
      toast.error('Debe guardar el vehículo antes de subir documentos');
      return;
    }

    if (!newDocument.file) {
      console.log('Error: No hay archivo seleccionado');
      toast.error('Debe seleccionar un archivo');
      return;
    }

    // Si no hay título, usar el tipo de documento como título
    const documentTitle = newDocument.title.trim() || getDocumentTypeLabel(newDocument.type);

    console.log('Iniciando subida...');
    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('file', newDocument.file);
      formData.append('documentType', newDocument.type);
      formData.append('title', documentTitle);
      formData.append('description', newDocument.description);

      console.log('Enviando petición a:', `/api/vehicles/${vehicle.id}/upload-document`);
      const response = await fetch(`/api/vehicles/${vehicle.id}/upload-document`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response?.ok) {
        toast.success('Documento subido exitosamente');
        setNewDocument({
          file: null,
          type: 'permiso_circulacion',
          title: '',
          description: ''
        });
        // Resetear el input file usando la referencia
        if (documentFileInputRef.current) {
          documentFileInputRef.current.value = '';
        }
        
        loadDocuments(); // Recargar lista
      } else {
        const error = await response.json();
        console.log('Error response:', error);
        toast.error(error.error || 'Error al subir documento');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir documento');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Función para eliminar documento
  const handleDeleteDocument = async (documentId: number) => {
    if (!vehicle?.id) return;

    if (!confirm('¿Está seguro de eliminar este documento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response?.ok) {
        toast.success('Documento eliminado exitosamente');
        loadDocuments(); // Recargar lista
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  // Función para descargar documento
  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    if (!vehicle?.id) return;

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/download-document?documentId=${documentId}`);
      
      if (response?.ok) {
        const data = await response.json();
        // Abrir en nueva pestaña
        window.open(data.url, '_blank');
      } else {
        toast.error('Error al descargar documento');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 Guardando vehículo...', {
      id: vehicle?.id,
      registration: formData.registration_number,
      ownership_type: formData.ownership_type,
      owner_user_id: formData.owner_user_id,
      depositor_user_id: formData.depositor_user_id
    });
    
    // Validar fechas
    const insuranceWarning = !formData.insurance_expiry || !calculateInsuranceActive();
    const itvWarning = !formData.itv_expiry || !calculateITVValid();
    
    if (insuranceWarning || itvWarning) {
      const warnings = [];
      if (insuranceWarning) warnings.push('El seguro no está activo o no tiene fecha de caducidad');
      if (itvWarning) warnings.push('La ITV no está vigente o no tiene fecha de caducidad');
      
      const confirmed = confirm(`ADVERTENCIA:\n\n${warnings.join('\n')}\n\n¿Desea continuar de todos modos?`);
      if (!confirmed) return;
    }
    
    const dataToSave = {
      ...formData,
      id: vehicle?.id
    };
    
    console.log('📤 Enviando datos al servidor:', dataToSave);
    onSave(dataToSave);
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'owner_user_id' || field === 'depositor_user_id') {
      console.log(`✏️  Cambiando ${field}:`, value, `(tipo: ${typeof value})`);
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            {isTaller ? (
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-9">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="insurance">Seguro</TabsTrigger>
                <TabsTrigger value="itv">ITV</TabsTrigger>
                <TabsTrigger value="ownership">Propiedad</TabsTrigger>
                <TabsTrigger value="valuation">Valoración</TabsTrigger>
                <TabsTrigger value="additional">Documentación</TabsTrigger>
                <TabsTrigger value="archive">Archivo</TabsTrigger>
                <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
              </TabsList>
            )}

            {/* Pestaña: Información Básica */}
            <TabsContent value="basic" className="space-y-4">
              {isTaller && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Información:</strong> Esta información es solo de consulta. Para gestionar mantenimientos, usa la pestaña "Mantenimiento".
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registration_number">Matrícula *</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => handleChange('registration_number', e.target.value)}
                    required
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="vin">Número de Bastidor</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => handleChange('vin', e.target.value)}
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="make">Marca *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    required
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleChange('year', parseInt(e.target.value))}
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel_type">Tipo de Combustible</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => handleChange('fuel_type', value)}
                    disabled={isTaller}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mileage">Kilometraje</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleChange('mileage', parseInt(e.target.value))}
                    disabled={isTaller}
                  />
                </div>
                <div>
                  <Label htmlFor="condition_rating">Estado General</Label>
                  <Select
                    value={formData.condition_rating}
                    onValueChange={(value) => handleChange('condition_rating', value)}
                    disabled={isTaller}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excelente">Excelente</SelectItem>
                      <SelectItem value="Bueno">Bueno</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Malo">Malo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                    disabled={isTaller}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">Activo</SelectItem>
                      <SelectItem value="F">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pricing_group_id">Grupo de Tarifas</Label>
                  <Select
                    value={formData.pricing_group_id?.toString() || 'no-group'}
                    onValueChange={(value) => handleChange('pricing_group_id', value === 'no-group' ? null : parseInt(value))}
                    disabled={isTaller}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-group">Sin grupo</SelectItem>
                      {pricingGroups.map(group => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="current_business_location_id">Ubicación Actual</Label>
                  <Select
                    value={formData.current_business_location_id?.toString() || 'no-location'}
                    onValueChange={(value) => {
                      const locationId = value === 'no-location' ? null : parseInt(value);
                      handleChange('current_business_location_id', locationId);
                      if (locationId === null) {
                        handleChange('location_reason', '');
                        handleChange('location_since', '');
                      } else if (!formData.location_since) {
                        // Auto-rellenar fecha actual si está vacía
                        handleChange('location_since', new Date().toISOString().split('T')[0]);
                      }
                    }}
                    disabled={isTaller}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-location">Sin ubicación asignada</SelectItem>
                      {businessLocations.map(location => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name} ({location.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {businessLocations.length === 0 && !isTaller && (
                    <p className="text-xs text-gray-500 mt-1">
                      No hay ubicaciones. Créalas en "Vehículos → Ubicaciones"
                    </p>
                  )}
                </div>
                
                {/* Motivo y fecha de ubicación - solo si hay ubicación asignada */}
                {formData.current_business_location_id && (
                  <>
                    <div>
                      <Label htmlFor="location_reason">Motivo de Asignación</Label>
                      <Select
                        value={formData.location_reason || 'none'}
                        onValueChange={(value) => handleChange('location_reason', value === 'none' ? '' : value)}
                        disabled={isTaller}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          <SelectItem value="disponible">Disponible</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                          <SelectItem value="reparacion">Reparación</SelectItem>
                          <SelectItem value="inspeccion">Inspección</SelectItem>
                          <SelectItem value="limpieza">Limpieza</SelectItem>
                          <SelectItem value="deposito">En depósito</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location_since">En esta ubicación desde</Label>
                      <Input
                        id="location_since"
                        type="date"
                        value={formData.location_since}
                        onChange={(e) => handleChange('location_since', e.target.value)}
                        disabled={isTaller}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Pestaña: Seguro */}
            <TabsContent value="insurance" className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  {calculateInsuranceActive() ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-medium">Seguro ACTIVO</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 font-medium">Seguro NO ACTIVO - Contratar antes de alquilar</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insurance_policy">Número de Póliza</Label>
                  <Input
                    id="insurance_policy"
                    value={formData.insurance_policy}
                    onChange={(e) => handleChange('insurance_policy', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance_policy_type">Tipo de Póliza</Label>
                  <Select
                    value={formData.insurance_policy_type}
                    onValueChange={(value) => handleChange('insurance_policy_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="daily">Por Días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="insurance_start_date">Fecha Inicio Seguro</Label>
                  <Input
                    id="insurance_start_date"
                    type="date"
                    value={formData.insurance_start_date}
                    onChange={(e) => handleChange('insurance_start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance_expiry">Fecha Caducidad Seguro</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => handleChange('insurance_expiry', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña: ITV */}
            <TabsContent value="itv" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  {calculateITVValid() ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-medium">ITV VIGENTE</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 font-medium">ITV CADUCADA - Realizar inspección antes de alquilar</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="last_itv_date">Última Revisión ITV</Label>
                  <Input
                    id="last_itv_date"
                    type="date"
                    value={formData.last_itv_date}
                    onChange={(e) => handleChange('last_itv_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="itv_expiry">Próxima Revisión ITV</Label>
                  <Input
                    id="itv_expiry"
                    type="date"
                    value={formData.itv_expiry}
                    onChange={(e) => handleChange('itv_expiry', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña: Propiedad */}
            <TabsContent value="ownership" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownership_type">Tipo de Propiedad</Label>
                  <Select
                    value={formData.ownership_type}
                    onValueChange={(value) => handleChange('ownership_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Propiedad</SelectItem>
                      <SelectItem value="renting">Renting</SelectItem>
                      <SelectItem value="commission">Depósito Comisionado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="document_status">Situación Documental</Label>
                  <Input
                    id="document_status"
                    value={formData.document_status}
                    onChange={(e) => handleChange('document_status', e.target.value)}
                    placeholder="Ej: Transferida, Pendiente..."
                  />
                </div>
                
                {(formData.ownership_type === 'renting') && (
                  <>
                    <div>
                      <Label htmlFor="rental_contract_end">Fin de Contrato de Renting</Label>
                      <Input
                        id="rental_contract_end"
                        type="date"
                        value={formData.rental_contract_end}
                        onChange={(e) => handleChange('rental_contract_end', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rental_monthly_payment">Pago Mensual Renting (€)</Label>
                      <Input
                        id="rental_monthly_payment"
                        type="number"
                        step="0.01"
                        value={formData.rental_monthly_payment}
                        onChange={(e) => handleChange('rental_monthly_payment', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="rental_conditions">Condiciones del Renting</Label>
                      <Textarea
                        id="rental_conditions"
                        value={formData.rental_conditions}
                        onChange={(e) => handleChange('rental_conditions', e.target.value)}
                        rows={3}
                        placeholder="Duración del contrato, kilometraje permitido, condiciones de devolución..."
                      />
                    </div>
                  </>
                )}
                
                {/* ✅ CAMPOS DE ASIGNACIÓN - SIEMPRE VISIBLES */}
                <div className="col-span-2">
                  <Label htmlFor="owner_user_id">Usuario Propietario (Opcional)</Label>
                  <Select 
                    value={formData.owner_user_id !== null && formData.owner_user_id !== undefined ? String(formData.owner_user_id) : "none"} 
                    onValueChange={(value) => {
                      console.log('✏️  Owner seleccionado:', value, 'tipo:', typeof value);
                      const newValue = value === "none" ? null : Number(value);
                      console.log('✏️  Valor convertido:', newValue, 'tipo:', typeof newValue);
                      
                      setFormData(prev => ({
                        ...prev,
                        owner_user_id: newValue
                      }));
                    }}
                    disabled={owners.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={owners.length === 0 ? "No hay propietarios disponibles" : "Seleccionar propietario..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin propietario asignado</SelectItem>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={String(owner.id)}>
                          {owner.firstname} {owner.lastname} - {owner.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {owners.length === 0 ? (
                    <p className="text-xs text-red-500 mt-1">
                      No hay usuarios con rol "propietario" disponibles
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Si asignas un usuario propietario, podrá ver los datos de comisiones de este vehículo
                    </p>
                  )}
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="depositor_user_id">Usuario Cesionario (Opcional)</Label>
                  <Select 
                    value={formData.depositor_user_id !== null && formData.depositor_user_id !== undefined ? String(formData.depositor_user_id) : "none"} 
                    onValueChange={(value) => {
                      console.log('✏️  Depositor seleccionado:', value, 'tipo:', typeof value);
                      const newValue = value === "none" ? null : Number(value);
                      console.log('✏️  Valor convertido:', newValue, 'tipo:', typeof newValue);
                      handleChange('depositor_user_id', newValue);
                    }}
                    disabled={depositors.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={depositors.length === 0 ? "No hay cesionarios disponibles" : "Seleccionar cesionario..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cesionario asignado</SelectItem>
                      {depositors.map((depositor) => (
                        <SelectItem key={depositor.id} value={String(depositor.id)}>
                          {depositor.firstname} {depositor.lastname} - {depositor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {depositors.length === 0 ? (
                    <p className="text-xs text-red-500 mt-1">
                      No hay usuarios con rol "cesionario" disponibles
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Si asignas un usuario cesionario, podrá ver los datos de comisiones de este vehículo
                    </p>
                  )}
                </div>
                
                {/* CAMPOS ESPECÍFICOS PARA DEPÓSITO COMISIONADO */}
                {(formData.ownership_type === 'commission') && (
                  <>
                    <div>
                      <Label htmlFor="commission_percentage">Porcentaje de Comisión (%)</Label>
                      <Input
                        id="commission_percentage"
                        type="number"
                        step="0.01"
                        value={formData.commission_percentage}
                        onChange={(e) => handleChange('commission_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="Ej: 20 (para 20%)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly_fixed_costs">Gastos Fijos Mensuales (€)</Label>
                      <Input
                        id="monthly_fixed_costs"
                        type="number"
                        step="0.01"
                        value={formData.monthly_fixed_costs}
                        onChange={(e) => handleChange('monthly_fixed_costs', parseFloat(e.target.value) || 0)}
                        placeholder="Precio/gastos mensuales del vehículo"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="current_business_location_id">Ubicación del Vehículo</Label>
                      <Select 
                        value={formData.current_business_location_id?.toString() || "none"} 
                        onValueChange={(value) => handleChange('current_business_location_id', value === "none" ? null : parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar ubicación..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin ubicación asignada</SelectItem>
                          {businessLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name} - {location.address || 'Sin dirección'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Define en qué ubicación está operando este vehículo
                      </p>
                    </div>
                    
                    <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Información del sistema de comisiones</h4>
                      <p className="text-xs text-gray-600">
                        El sistema calculará automáticamente los ingresos netos (Ingresos - Gastos Fijos) y 
                        aplicará el porcentaje de comisión establecido para el reparto con el propietario.
                        Puedes ver los reportes detallados en la sección "Gestión de Comisiones".
                      </p>
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="assigned_to">Asignado a</Label>
                  <Input
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => handleChange('assigned_to', e.target.value)}
                    placeholder="Ej: Paolo, Donato, Municipio..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña: Valoración */}
            <TabsContent value="valuation" className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> La valoración solo es necesaria para vehículos en propiedad. 
                  No aplica para renting o depósito comisionado.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_price">Precio de Compra (€)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', parseFloat(e.target.value) || 0)}
                    disabled={formData.ownership_type !== 'owned'}
                  />
                </div>
                <div>
                  <Label htmlFor="market_value">Precio de Mercado (€)</Label>
                  <Input
                    id="market_value"
                    type="number"
                    step="0.01"
                    value={formData.market_value}
                    onChange={(e) => handleChange('market_value', parseFloat(e.target.value) || 0)}
                    disabled={formData.ownership_type !== 'owned'}
                  />
                </div>
                <div>
                  <Label htmlFor="sale_price">Precio de Venta (€)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => handleChange('sale_price', parseFloat(e.target.value) || 0)}
                    disabled={formData.ownership_type !== 'owned'}
                  />
                </div>
                
                {formData.ownership_type === 'owned' && formData.purchase_price > 0 && (
                  <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Resumen de Valoración</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Inversión</p>
                        <p className="font-bold text-lg">{Number(formData.purchase_price || 0).toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Valor Mercado</p>
                        <p className="font-bold text-lg">{Number(formData.market_value || 0).toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Precio Venta</p>
                        <p className="font-bold text-lg">{Number(formData.sale_price || 0).toFixed(2)} €</p>
                      </div>
                    </div>
                    {Number(formData.sale_price || 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-gray-600">Ganancia estimada</p>
                        <p className={`font-bold text-xl ${(Number(formData.sale_price || 0) - Number(formData.purchase_price || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(Number(formData.sale_price || 0) - Number(formData.purchase_price || 0)).toFixed(2)} € 
                          ({((Number(formData.sale_price || 0) - Number(formData.purchase_price || 0)) / Number(formData.purchase_price || 1) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pestaña: Adicional - SOLO DOCUMENTACIÓN - SOLO para roles no-taller */}
            {!isTaller && (
              <TabsContent value="additional" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-1">📄 Documentación del Vehículo</h3>
                  <p className="text-sm text-blue-800">
                    Gestión de permisos de circulación, fichas técnicas, ITV, seguros y otros documentos
                  </p>
                </div>

                {/* Sección de Documentos */}
                <div>
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" />
                  Documentos del Vehículo
                </h4>

                {!vehicle?.id ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Información:</strong> Debe guardar el vehículo antes de poder subir documentos.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Formulario para subir nuevo documento */}
                    <div className="bg-gray-50 border rounded-lg p-4 space-y-3 mb-4">
                      <h5 className="font-medium text-sm">Subir Nuevo Documento</h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="document_type" className="text-xs">Tipo de Documento</Label>
                          <Select
                            value={newDocument.type}
                            onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permiso_circulacion">Permiso de Circulación</SelectItem>
                              <SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem>
                              <SelectItem value="itv">ITV</SelectItem>
                              <SelectItem value="seguro">Seguro</SelectItem>
                              <SelectItem value="contrato_renting">Contrato Renting</SelectItem>
                              <SelectItem value="contrato_compra">Contrato Compra/Venta</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="factura">Factura</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="document_title" className="text-xs">Título (opcional)</Label>
                          <Input
                            id="document_title"
                            className="h-9"
                            value={newDocument.title}
                            onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                            placeholder="Se usará el tipo de documento si se deja vacío"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="document_description" className="text-xs">Descripción (opcional)</Label>
                        <Input
                          id="document_description"
                          className="h-9"
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                          placeholder="Detalles adicionales..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicle-document-file" className="text-xs">Archivo *</Label>
                        {/* Input oculto con referencia - mismo patrón que funciona en inspecciones */}
                        <input
                          ref={documentFileInputRef}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        {/* Botón que activa el input oculto */}
                        <div className="mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => documentFileInputRef.current?.click()}
                            disabled={processingImage}
                            className="w-full h-9"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {processingImage ? 'Procesando imagen...' : 
                             newDocument.file ? newDocument.file.name : 'Seleccionar archivo...'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {processingImage ? 
                            '⚡ Detectando y recortando automáticamente...' :
                            'Formatos: JPG, PNG, PDF, DOC, DOCX. Máx: 10MB. Las imágenes se procesan automáticamente.'}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUploadDocument}
                        disabled={uploadingDocument || processingImage || !newDocument.file || !newDocument.type}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingDocument ? 'Subiendo...' : 
                         processingImage ? 'Procesando...' : 'Subir Documento'}
                      </Button>
                    </div>

                    {/* Lista de documentos existentes */}
                    <div>
                      <h5 className="font-medium text-sm mb-2">Documentos Cargados</h5>
                      
                      {loadingDocuments ? (
                        <p className="text-sm text-gray-500">Cargando documentos...</p>
                      ) : documents.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay documentos cargados aún.</p>
                      ) : (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{doc.title}</p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {doc.file_name}
                                    {doc.uploader && ` • ${doc.uploader.firstname} ${doc.uploader.lastname}`}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(doc.created_at).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                                  title="Ver/Descargar"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              </TabsContent>
            )}

            {/* Pestaña: Mantenimiento - SOLO MANTENIMIENTOS E HISTORIAL */}
            <TabsContent value="maintenance" className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-orange-900 mb-1">🔧 Mantenimiento del Vehículo</h3>
                <p className="text-sm text-orange-800">
                  Solicita mantenimientos, revisa el historial y programa próximas revisiones
                </p>
              </div>

              {vehicle && vehicle.id ? (
                <VehicleMaintenanceSection vehicleId={vehicle.id} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Guarda el vehículo primero para poder gestionar su mantenimiento</p>
                </div>
              )}
            </TabsContent>

            {/* Pestaña: Archivo - Vender o dar de baja vehículos */}
            <TabsContent value="archive" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-amber-900 mb-1">📦 Archivo de Vehículos</h3>
                <p className="text-sm text-amber-800">
                  Marca un vehículo como vendido o dado de baja. El vehículo seguirá en el sistema para consultas históricas pero no aparecerá en el listado principal.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Label className="font-semibold">Estado actual:</Label>
                  {formData.archived_status ? (
                    <Badge variant="destructive" className="ml-2">
                      {formData.archived_status === 'vendido' ? '🏷️ Vendido' : '⛔ Dado de Baja'}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="ml-2 bg-green-600">✓ Activo</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="archived_status">Acción de archivo</Label>
                    <Select
                      value={formData.archived_status || 'none'}
                      onValueChange={(value) =>
                        handleChange('archived_status', value === 'none' ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar acción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🟢 Mantener activo</SelectItem>
                        <SelectItem value="vendido">🏷️ Marcar como vendido</SelectItem>
                        <SelectItem value="dado_de_baja">⛔ Dar de baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.archived_status && formData.archived_status !== 'none' && (
                    <>
                      <div>
                        <Label htmlFor="archived_date">Fecha de archivo</Label>
                        <Input
                          id="archived_date"
                          name="archived_date"
                          type="date"
                          value={formData.archived_date || ''}
                          onChange={(e) => handleChange('archived_date', e.target.value)}
                        />
                      </div>

                      {formData.archived_status === 'vendido' && (
                        <>
                          <div>
                            <Label htmlFor="buyer_name">Comprador</Label>
                            <Input
                              id="buyer_name"
                              name="buyer_name"
                              placeholder="Nombre del comprador"
                              value={formData.buyer_name || ''}
                              onChange={(e) => handleChange('buyer_name', e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="sale_amount">Precio de venta (€)</Label>
                            <Input
                              id="sale_amount"
                              name="sale_amount"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData.sale_amount || ''}
                              onChange={(e) => handleChange('sale_amount', e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label htmlFor="archived_reason">Motivo / Notas</Label>
                        <Textarea
                          id="archived_reason"
                          name="archived_reason"
                          placeholder={
                            formData.archived_status === 'vendido'
                              ? 'Ej: Vendido a particular, estado excelente...'
                              : 'Ej: Accidente grave, reparación no rentable...'
                          }
                          value={formData.archived_reason || ''}
                          onChange={(e) => handleChange('archived_reason', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Pestaña: Catálogo - SOLO FOTOS Y REPUESTOS DEL MODELO */}
            <TabsContent value="catalog" className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-purple-900 mb-1">📦 Catálogo del Modelo</h3>
                <p className="text-sm text-purple-800">
                  Fotos y catálogo de repuestos para el modelo: <strong>{formData.make} {formData.model}</strong>
                </p>
              </div>

              {/* Sección 1: Fotos del Modelo */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📸 Fotos del Modelo
                </h3>
                <VehicleModelPhotosManager 
                  make={formData.make || ''}
                  model={formData.model || ''}
                />
              </div>

              {/* Sección 2: Catálogo de Repuestos */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🔧 Catálogo de Repuestos
                </h3>
                <VehicleSparePartsSection 
                  vehicleModel={formData.make && formData.model ? `${formData.make} ${formData.model}` : ''}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isTaller ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!isTaller && (
              <Button type="submit">
                {vehicle ? 'Actualizar' : 'Crear'} Vehículo
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
