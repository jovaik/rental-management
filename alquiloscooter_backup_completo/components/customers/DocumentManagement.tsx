
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Eye, Loader2, CheckCircle, X, Camera, Crop } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FourPointCropper } from '@/components/planning/FourPointCropper';

// ✅ Interfaz para datos extraídos del OCR (exportada para uso en formularios)
export interface ExtractedDocumentData {
  documentNumber?: string;       // DNI/NIE/Pasaporte
  firstName?: string;             // Nombre
  lastName?: string;              // Apellidos
  dateOfBirth?: string;           // Fecha nacimiento (YYYY-MM-DD)
  address?: string;               // Dirección completa (calle + número)
  city?: string;                  // Ciudad
  postalCode?: string;            // Código postal
  expiryDate?: string;            // Fecha caducidad carnet (YYYY-MM-DD)
  licenseNumber?: string;         // Número carnet conducir
}

interface DocumentManagementProps {
  customerId: number;
  documents: {
    driver_license_front?: string;
    driver_license_back?: string;
    id_document_front?: string;
    id_document_back?: string;
  };
  onUpdate: () => void;
  onExtractedDataChange?: (data: ExtractedDocumentData) => void; // ✅ NUEVO: Callback para datos extraídos
}

interface DocumentPreview {
  file: File | null;
  preview: string | null;
  existing: string | null;
  existingPreview: string | null; // URL de preview del documento existente
}

export function DocumentManagement({ customerId, documents, onUpdate, onExtractedDataChange }: DocumentManagementProps) {
  // VERSIÓN CON RECORTE Y OPTIMIZACIÓN - v4.0  
  console.log('🎯 DocumentManagement v4.0 - CON RECORTE Y COMPRESIÓN cargado', new Date().toISOString());
  
  const [uploading, setUploading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  
  // Estado para el modal de recorte
  // ✅ ACTUALIZADO: Estado para FourPointCropper
  const [pendingCrop, setPendingCrop] = useState<{ file: File; docType: string } | null>(null);
  
  // Estado para previsualizaciones de documentos
  const [docPreviews, setDocPreviews] = useState<{ [key: string]: DocumentPreview }>({
    driver_license_front: { file: null, preview: null, existing: documents.driver_license_front || null, existingPreview: null },
    driver_license_back: { file: null, preview: null, existing: documents.driver_license_back || null, existingPreview: null },
    id_document_front: { file: null, preview: null, existing: documents.id_document_front || null, existingPreview: null },
    id_document_back: { file: null, preview: null, existing: documents.id_document_back || null, existingPreview: null },
  });

  // Cargar previews de documentos existentes
  useEffect(() => {
    loadExistingPreviews();
  }, [customerId, JSON.stringify(documents)]);

  const loadExistingPreviews = async () => {
    setLoadingPreviews(true);
    const documentTypes = ['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'];
    
    for (const docType of documentTypes) {
      if (documents[docType as keyof typeof documents]) {
        try {
          const response = await fetch(`/api/customers/${customerId}/download-document/${docType}`);
          if (response.ok) {
            const { url } = await response.json();
            
            setDocPreviews(prev => ({
              ...prev,
              [docType]: {
                ...prev[docType],
                existingPreview: url
              }
            }));
          }
        } catch (error) {
          console.error(`Error loading preview for ${docType}:`, error);
        }
      }
    }
    setLoadingPreviews(false);
  };

  // Referencias para inputs ocultos
  const licenceFrontRef = useRef<HTMLInputElement>(null);
  const licenceBackRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const documentLabels: { [key: string]: string } = {
    driver_license_front: 'Carnet de Conducir (Frontal)',
    driver_license_back: 'Carnet de Conducir (Reverso)',
    id_document_front: 'Documento de Identidad (Frontal)',
    id_document_back: 'Documento de Identidad (Reverso)',
  };

  // ✅ ACTUALIZADO: Abre FourPointCropper en lugar de cargar directamente
  const handleFileSelect = (documentType: string, file: File | null) => {
    if (file) {
      // Verificar tamaño del archivo (max 10MB para móviles)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      // Verificar tipo de archivo
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error('Solo se permiten archivos JPG o PNG');
        return;
      }

      // Abrir cropper con detección AI automática
      toast('📐 Ajusta los bordes del documento y recorta', { icon: '✂️' });
      setPendingCrop({ file, docType: documentType });
    }
  };

  // ✅ NUEVO: Manejar resultado del recorte
  const handleCropComplete = async (croppedBlob: Blob, docType: string) => {
    const croppedFile = new File([croppedBlob], `${docType}_cropped.jpg`, { 
      type: 'image/jpeg' 
    });

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocPreviews(prev => ({
        ...prev,
        [docType]: {
          file: croppedFile,
          preview: reader.result as string,
          existing: prev[docType].existing,
          existingPreview: prev[docType].existingPreview
        }
      }));
      
      // Cerrar cropper
      setPendingCrop(null);
    };
    reader.readAsDataURL(croppedFile);

    // ✅ CRÍTICO: Ejecutar OCR automáticamente después del recorte
    console.log('📋 [CROPPER] Recorte completado, iniciando extracción OCR...');
    await extractDocumentData(croppedFile, docType);
  };

  const removeDocument = (documentType: string) => {
    setDocPreviews(prev => ({
      ...prev,
      [documentType]: {
        file: null,
        preview: null,
        existing: prev[documentType].existing,
        existingPreview: prev[documentType].existingPreview
      }
    }));
  };

  // ✅ NUEVA FUNCIÓN: Comprimir imagen antes de enviar (CRÍTICO PARA MÓVIL)
  const compressImage = async (file: File): Promise<File> => {
    console.log('🗜️ [COMPRESS] Comprimiendo imagen para móvil...', {
      original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = document.createElement('img');
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto 2D'));
            return;
          }

          // Calcular dimensiones (máximo 1200px para móvil)
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a blob con calidad 85% (balance tamaño/legibilidad)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                console.log('✅ [COMPRESS] Compresión exitosa:', {
                  original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                  compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                  reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`,
                  dimensions: `${width}x${height}`
                });
                
                resolve(compressedFile);
              } else {
                reject(new Error('Error al comprimir imagen'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        
        img.onerror = () => reject(new Error('Error al cargar imagen'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  };

  // Función para extraer datos del documento con OCR
  const extractDocumentData = async (file: File, documentType: string) => {
    console.log('🎯 [OCR] Iniciando extractDocumentData...');
    console.log('📄 [OCR] Tipo de documento:', documentType);
    console.log('📁 [OCR] Archivo original:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
    
    // Solo extraer para documentos de identidad y carnet de conducir (frontal)
    if (!documentType.includes('front')) {
      console.log('⚠️ [OCR] No es documento frontal, saltando extracción');
      return;
    }
    
    try {
      // ✅ COMPRIMIR IMAGEN ANTES DE ENVIAR
      let fileToSend = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToSend = await compressImage(file);
        } catch (compressError) {
          console.warn('⚠️ [OCR] Error al comprimir, usando original:', compressError);
        }
      }
      
      const extractFormData = new FormData();
      extractFormData.append('file', fileToSend);
      
      // Determinar el tipo de documento para la API
      let docTypeForApi = '';
      if (documentType.includes('id_document')) {
        docTypeForApi = 'id_document';
        console.log('✅ [OCR] Tipo detectado: DNI/Pasaporte');
      } else if (documentType.includes('driver_license')) {
        docTypeForApi = 'driver_license';
        console.log('✅ [OCR] Tipo detectado: Carnet de Conducir');
      } else {
        console.log('⚠️ [OCR] Tipo no reconocido, saltando extracción');
        return; // No extraer datos de otros tipos
      }
      
      extractFormData.append('documentType', docTypeForApi);

      console.log('🚀 [OCR] Enviando petición a /api/customers/extract-document-data...');
      const loadingToast = toast.loading('🔍 Extrayendo datos del documento...');
      
      const response = await fetch('/api/customers/extract-document-data', {
        method: 'POST',
        body: extractFormData
      });

      toast.dismiss(loadingToast);

      console.log('📡 [OCR] Respuesta recibida, status:', response.status);

      if (!response.ok) {
        console.error('❌ [OCR] Error en respuesta API:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ [OCR] Detalle error:', errorText);
        return; // No mostrar error, es opcional
      }

      const result = await response.json();
      console.log('📦 [OCR] Resultado parseado:', result);
      
      if (!result.success || !result.data) {
        console.error('❌ [OCR] Respuesta sin datos o sin éxito:', result);
        return;
      }

      const extractedData = result.data;
      console.log('✅ [OCR] Datos extraídos exitosamente:', extractedData);

      // ✅ NUEVO: Mapear y enviar datos al componente padre
      const mappedData: ExtractedDocumentData = {
        documentNumber: extractedData.documentNumber || extractedData.licenseNumber,
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        dateOfBirth: extractedData.dateOfBirth,
        address: extractedData.address,
        city: extractedData.city,
        postalCode: extractedData.postalCode,
        expiryDate: extractedData.expiryDate,
        licenseNumber: extractedData.licenseNumber
      };

      // Llamar al callback si existe
      if (onExtractedDataChange) {
        console.log('🔄 [OCR] Ejecutando callback onExtractedDataChange...');
        console.log('📤 [OCR] Datos a enviar al formulario:', mappedData);
        onExtractedDataChange(mappedData);
        console.log('✅ [OCR] Callback ejecutado correctamente');
      } else {
        console.warn('⚠️ [OCR] onExtractedDataChange NO ESTÁ DEFINIDO - Los campos no se rellenarán');
      }

      // Notificar al usuario
      toast.success('✅ Datos extraídos automáticamente. Campos rellenados en el formulario.');
      
      // Log para debugging
      console.log('📋 [OCR] Proceso completo finalizado:', mappedData);
      
    } catch (error) {
      console.error('Error extrayendo datos:', error);
      // No mostrar error al usuario, el OCR es opcional
    }
  };

  const handleUploadSingle = async (documentType: string) => {
    const docData = docPreviews[documentType];
    if (!docData.file) {
      toast.error('Selecciona un documento primero');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', docData.file);
      formData.append('documentType', documentType);

      const response = await fetch(`/api/customers/${customerId}/upload-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir documento');
      }

      const result = await response.json();
      
      toast.success('✅ Documento subido correctamente');
      
      // Actualizar estado con documento existente y mantener el preview
      setDocPreviews(prev => ({
        ...prev,
        [documentType]: {
          file: null,
          preview: null,
          existing: result.cloud_storage_path,
          existingPreview: prev[documentType].preview // Usar el preview actual como existingPreview
        }
      }));
      
      // Extraer datos del documento automáticamente
      await extractDocumentData(docData.file, documentType);
      
      onUpdate();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (documentType: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/download-document/${documentType}`);
      if (!response.ok) throw new Error('No se pudo obtener el documento');

      const { url } = await response.json();
      
      // Crear un link temporal y simular click para descargar
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Error al ver documento');
    }
  };

  const DocumentCard = ({
    title,
    documentType,
    inputRef,
  }: {
    title: string;
    documentType: string;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => {
    const docData = docPreviews[documentType];
    const hasDocument = docData.preview || docData.existing || docData.existingPreview;

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors bg-white">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={(e) => handleFileSelect(documentType, e.target.files?.[0] || null)}
          className="hidden"
        />
        
        {hasDocument ? (
          <div className="relative">
            {/* Previsualización del documento */}
            {docData.preview ? (
              // Nueva foto seleccionada - mostrar preview inmediato
              <div className="relative w-full h-40 mb-2">
                <Image
                  src={docData.preview}
                  alt={title}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : docData.existingPreview ? (
              // Documento existente - mostrar imagen real
              <div className="relative w-full h-40 mb-2">
                <Image
                  src={docData.existingPreview}
                  alt={title}
                  fill
                  className="object-cover rounded"
                  unoptimized
                />
              </div>
            ) : docData.existing ? (
              // Cargando preview del documento existente
              <div className="relative w-full h-40 mb-2 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
                <div className="text-center">
                  {loadingPreviews ? (
                    <>
                      <Loader2 className="h-8 w-8 mx-auto text-gray-400 mb-2 animate-spin" />
                      <p className="text-sm text-gray-500">Cargando...</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                      <p className="text-sm font-medium text-green-800">Documento Existente</p>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              {docData.preview ? (
                // Si hay una nueva foto seleccionada
                <>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => handleUploadSingle(documentType)}
                    disabled={uploading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(documentType)}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                // Si solo hay documento existente
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(documentType)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Cambiar
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          // Estado vacío - sin documento
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer py-8"
          >
            <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-700 mb-1">{title}</p>
            <p className="text-sm text-gray-500">Clic para capturar/subir</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          📸 Gestión de Documentos - EXACTO COMO RESERVAS
        </CardTitle>
        <CardDescription>
          ⚡ Sistema v3.0 - Las fotos se ven directamente en los recuadros (como en reservas)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg p-4 text-center">
          <p className="text-lg font-bold text-green-700">✅ VERSIÓN v3.0 - PREVIEW DIRECTO ACTIVADO</p>
          <p className="text-sm text-gray-600 mt-1">Ahora las fotos se ven directamente en los recuadros, igual que en el módulo de reservas</p>
        </div>
        {/* Carnet de Conducir */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg text-blue-700 flex items-center gap-2">
            🪪 Carnet de Conducir
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentCard
              title="Carnet (Frontal)"
              documentType="driver_license_front"
              inputRef={licenceFrontRef}
            />
            <DocumentCard
              title="Carnet (Reverso)"
              documentType="driver_license_back"
              inputRef={licenceBackRef}
            />
          </div>
        </div>

        {/* Documento de Identidad */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg text-green-700 flex items-center gap-2">
            🆔 Documento de Identidad / Pasaporte
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentCard
              title="DNI/Pasaporte (Frontal)"
              documentType="id_document_front"
              inputRef={idFrontRef}
            />
            <DocumentCard
              title="DNI/Pasaporte (Reverso)"
              documentType="id_document_back"
              inputRef={idBackRef}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">ℹ️ Instrucciones:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>🤖 IA automática:</strong> Detecta bordes del documento instantáneamente</li>
            <li><strong>✂️ Recorte manual:</strong> Ajusta 4 puntos en las esquinas si necesario</li>
            <li><strong>📐 Transformación:</strong> Endereza y convierte a blanco y negro</li>
            <li>Captura fotos directamente con la cámara del dispositivo</li>
            <li>Cada documento se sube individualmente al hacer clic en "Subir"</li>
            <li>Tamaño máximo por archivo: 10MB</li>
            <li>Formatos aceptados: JPG, PNG</li>
          </ul>
        </div>
      </CardContent>

      {/* ✅ NUEVO: FourPointCropper modal */}
      {pendingCrop && (
        <FourPointCropper
          imageFile={pendingCrop.file}
          onCropComplete={(blob) => handleCropComplete(blob, pendingCrop.docType)}
          onCancel={() => setPendingCrop(null)}
        />
      )}
    </Card>
  );
}
