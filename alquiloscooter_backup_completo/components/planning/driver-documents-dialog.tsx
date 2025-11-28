'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Eye, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FourPointCropper } from '@/components/planning/FourPointCropper';

interface DriverDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: number;
  driverName: string;
  documents: {
    driver_license_front?: string;
    driver_license_back?: string;
    id_document_front?: string;
    id_document_back?: string;
  };
  onDocumentsUpdated: () => void;
}

interface DocumentPreview {
  file: File | null;
  preview: string | null;
  existing: string | null;
  existingPreview: string | null;
}

const documentLabels: { [key: string]: string } = {
  driver_license_front: 'Carnet de Conducir (Frontal)',
  driver_license_back: 'Carnet de Conducir (Reverso)',
  id_document_front: 'Documento de Identidad (Frontal)',
  id_document_back: 'Documento de Identidad (Reverso)',
};

export function DriverDocumentsDialog({
  open,
  onOpenChange,
  driverId,
  driverName,
  documents,
  onDocumentsUpdated,
}: DriverDocumentsDialogProps) {
  console.log('🎯 DriverDocumentsDialog v4.0 - MÓDULO COPIADO DESDE CLIENTES', new Date().toISOString());
  
  const [uploading, setUploading] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  
  // Estado para el modal de recorte
  const [pendingCrop, setPendingCrop] = useState<{ file: File; docType: string } | null>(null);
  
  const [docPreviews, setDocPreviews] = useState<{ [key: string]: DocumentPreview }>({
    driver_license_front: { file: null, preview: null, existing: documents.driver_license_front || null, existingPreview: null },
    driver_license_back: { file: null, preview: null, existing: documents.driver_license_back || null, existingPreview: null },
    id_document_front: { file: null, preview: null, existing: documents.id_document_front || null, existingPreview: null },
    id_document_back: { file: null, preview: null, existing: documents.id_document_back || null, existingPreview: null },
  });

  // Referencias para inputs ocultos
  const licenceFrontRef = useRef<HTMLInputElement>(null);
  const licenceBackRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  // Cargar previews de documentos existentes cuando se abre el diálogo
  useEffect(() => {
    if (open && driverId) {
      loadExistingPreviews();
    }
  }, [open, driverId]);

  const loadExistingPreviews = async () => {
    setLoadingPreviews(true);
    const documentTypes = ['driver_license_front', 'driver_license_back', 'id_document_front', 'id_document_back'];
    
    for (const docType of documentTypes) {
      if (documents[docType as keyof typeof documents]) {
        try {
          const response = await fetch(`/api/drivers/${driverId}/download-document/${docType}`);
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

  // ✅ COPIADO DESDE CLIENTES: Abre FourPointCropper en lugar de cargar directamente
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

  // ✅ COPIADO DESDE CLIENTES: Manejar resultado del recorte
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

    // ✅ EJECUTAR OCR automáticamente después del recorte (para conductores)
    console.log('📋 [CROPPER] Recorte completado, iniciando extracción OCR...');
    await extractDocumentData(croppedFile, docType);
  };

  // ✅ COPIADO DESDE CLIENTES: Comprimir imagen antes de enviar
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
          
          // Convertir a blob con calidad 85%
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

  // ✅ COPIADO DESDE CLIENTES: Función para extraer datos del documento con OCR
  const extractDocumentData = async (file: File, documentType: string) => {
    console.log('🎯 [OCR-DRIVER] Iniciando extractDocumentData...');
    console.log('📄 [OCR-DRIVER] Tipo de documento:', documentType);
    console.log('📁 [OCR-DRIVER] Archivo original:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
    
    // Solo extraer para documentos frontales
    if (!documentType.includes('front')) {
      console.log('⚠️ [OCR-DRIVER] No es documento frontal, saltando extracción');
      return;
    }
    
    try {
      // ✅ COMPRIMIR IMAGEN ANTES DE ENVIAR
      let fileToSend = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToSend = await compressImage(file);
        } catch (compressError) {
          console.warn('⚠️ [OCR-DRIVER] Error al comprimir, usando original:', compressError);
        }
      }
      
      const extractFormData = new FormData();
      extractFormData.append('file', fileToSend);
      
      // Determinar el tipo de documento para la API
      let docTypeForApi = '';
      if (documentType.includes('id_document')) {
        docTypeForApi = 'id_document';
        console.log('✅ [OCR-DRIVER] Tipo detectado: DNI/Pasaporte');
      } else if (documentType.includes('driver_license')) {
        docTypeForApi = 'driver_license';
        console.log('✅ [OCR-DRIVER] Tipo detectado: Carnet de Conducir');
      } else {
        console.log('⚠️ [OCR-DRIVER] Tipo no reconocido, saltando extracción');
        return;
      }
      
      extractFormData.append('documentType', docTypeForApi);

      console.log('🚀 [OCR-DRIVER] Enviando petición a /api/customers/extract-document-data...');
      const loadingToast = toast.loading('🔍 Extrayendo datos del documento...');
      
      const response = await fetch('/api/customers/extract-document-data', {
        method: 'POST',
        body: extractFormData
      });

      toast.dismiss(loadingToast);

      console.log('📡 [OCR-DRIVER] Respuesta recibida, status:', response.status);

      if (!response.ok) {
        console.error('❌ [OCR-DRIVER] Error en respuesta API:', response.status, response.statusText);
        return;
      }

      const result = await response.json();
      console.log('📦 [OCR-DRIVER] Resultado parseado:', result);
      
      if (!result.success || !result.data) {
        console.error('❌ [OCR-DRIVER] Respuesta sin datos o sin éxito:', result);
        return;
      }

      const extractedData = result.data;
      console.log('✅ [OCR-DRIVER] Datos extraídos exitosamente:', extractedData);

      // Notificar al usuario
      toast.success('✅ Datos extraídos automáticamente del documento.');
      
      console.log('📋 [OCR-DRIVER] Proceso completo finalizado');
      
    } catch (error) {
      console.error('Error extrayendo datos:', error);
    }
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

      const response = await fetch(`/api/drivers/${driverId}/upload-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir documento');
      }

      const result = await response.json();
      
      toast.success('✅ Documento subido correctamente');
      
      // Actualizar estado con documento existente
      setDocPreviews(prev => ({
        ...prev,
        [documentType]: {
          file: null,
          preview: null,
          existing: result.cloud_storage_path,
          existingPreview: prev[documentType].preview
        }
      }));
      
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (documentType: string) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/download-document/${documentType}`);
      if (!response.ok) throw new Error('No se pudo obtener el documento');

      const { url } = await response.json();
      
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

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onDocumentsUpdated();
    }
    onOpenChange(open);
  };

  const DocumentCard = ({ documentType, inputRef }: { documentType: string; inputRef: React.RefObject<HTMLInputElement> }) => {
    const docData = docPreviews[documentType];
    const hasDocument = docData.preview || docData.existing || docData.existingPreview;

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors bg-white">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(documentType, e.target.files?.[0] || null)}
          className="hidden"
        />
        
        {hasDocument ? (
          <div className="relative">
            {docData.preview ? (
              <div className="relative w-full h-40 mb-2">
                <Image src={docData.preview} alt={documentLabels[documentType]} fill className="object-cover rounded" />
              </div>
            ) : docData.existingPreview ? (
              <div className="relative w-full h-40 mb-2">
                <Image src={docData.existingPreview} alt={documentLabels[documentType]} fill className="object-cover rounded" unoptimized />
              </div>
            ) : docData.existing ? (
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
            
            <div className="flex gap-2">
              {docData.preview ? (
                <>
                  <Button type="button" variant="default" size="sm" onClick={() => handleUploadSingle(documentType)} disabled={uploading} className="flex-1 bg-green-600 hover:bg-green-700">
                    {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo...</> : <><Upload className="h-4 w-4 mr-2" />Subir</>}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
                    <Camera className="h-4 w-4 mr-2" />Cambiar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeDocument(documentType)} disabled={uploading} className="text-red-600 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleViewDocument(documentType)} className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />Ver
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" />Cambiar
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div onClick={() => inputRef.current?.click()} className="cursor-pointer py-8">
            <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-700 mb-1">{documentLabels[documentType]}</p>
            <p className="text-sm text-gray-500">Clic para capturar/subir</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              📸 Documentos del Conductor - {driverName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg p-4 text-center">
              <p className="text-lg font-bold text-green-700">✅ VERSIÓN v4.0 - COPIADO DESDE CLIENTES</p>
              <p className="text-sm text-gray-600 mt-1">Cropper + OCR + Compresión automática</p>
            </div>

            {/* Carnet de Conducir */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-blue-700 flex items-center gap-2">
                🪪 Carnet de Conducir
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentCard documentType="driver_license_front" inputRef={licenceFrontRef} />
                <DocumentCard documentType="driver_license_back" inputRef={licenceBackRef} />
              </div>
            </div>

            {/* Documento de Identidad */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-green-700 flex items-center gap-2">
                🆔 Documento de Identidad
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentCard documentType="id_document_front" inputRef={idFrontRef} />
                <DocumentCard documentType="id_document_back" inputRef={idBackRef} />
              </div>
            </div>

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
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ FourPointCropper modal */}
      {pendingCrop && (
        <FourPointCropper
          imageFile={pendingCrop.file}
          onCropComplete={(blob) => handleCropComplete(blob, pendingCrop.docType)}
          onCancel={() => setPendingCrop(null)}
        />
      )}
    </>
  );
}
