'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, FileText, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FourPointCropper } from './FourPointCropper';

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

interface DocumentPreview {
  file: File | null;
  preview: string | null;
  type: 'id_front' | 'id_back' | 'license_front' | 'license_back' | null;
}

interface QuickDocumentUploadProps {
  onDocumentsChange: (documents: { [key: string]: File | null }) => void;
  onExtractedDataChange?: (data: ExtractedDocumentData) => void; // ✅ NUEVO: Callback para datos extraídos
}

export function QuickDocumentUpload({ onDocumentsChange, onExtractedDataChange }: QuickDocumentUploadProps) {
  console.log('🎯 QuickDocumentUpload v5.0 - CON OCR CALLBACK COMPLETO', new Date().toISOString());
  
  const [documents, setDocuments] = useState<{ [key: string]: DocumentPreview }>({
    id_front: { file: null, preview: null, type: 'id_front' },
    id_back: { file: null, preview: null, type: 'id_back' },
    license_front: { file: null, preview: null, type: 'license_front' },
    license_back: { file: null, preview: null, type: 'license_back' },
  });

  // Estado para el cropper
  const [pendingCrop, setPendingCrop] = useState<{ file: File; docType: string } | null>(null);

  // Referencias para inputs ocultos
  const idFrontCameraRef = useRef<HTMLInputElement>(null);
  const idFrontGalleryRef = useRef<HTMLInputElement>(null);
  const idBackCameraRef = useRef<HTMLInputElement>(null);
  const idBackGalleryRef = useRef<HTMLInputElement>(null);
  const licenseFrontCameraRef = useRef<HTMLInputElement>(null);
  const licenseFrontGalleryRef = useRef<HTMLInputElement>(null);
  const licenseBackCameraRef = useRef<HTMLInputElement>(null);
  const licenseBackGalleryRef = useRef<HTMLInputElement>(null);

  const documentLabels: { [key: string]: string } = {
    id_front: 'DNI/Pasaporte (Frontal)',
    id_back: 'DNI/Pasaporte (Reverso)',
    license_front: 'Carnet de Conducir (Frontal)',
    license_back: 'Carnet de Conducir (Reverso)',
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
    console.log('🎯 [OCR-RESERVAS] Iniciando extractDocumentData...');
    console.log('📄 [OCR-RESERVAS] Tipo de documento:', documentType);
    console.log('📁 [OCR-RESERVAS] Archivo original:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
    
    // Solo extraer para documentos frontales
    if (!documentType.includes('front')) {
      console.log('⚠️ [OCR-RESERVAS] No es documento frontal, saltando extracción');
      return;
    }
    
    try {
      // ✅ COMPRIMIR IMAGEN ANTES DE ENVIAR
      let fileToSend = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToSend = await compressImage(file);
        } catch (compressError) {
          console.warn('⚠️ [OCR-RESERVAS] Error al comprimir, usando original:', compressError);
        }
      }
      
      const extractFormData = new FormData();
      extractFormData.append('file', fileToSend);
      
      // Determinar el tipo de documento para la API
      let docTypeForApi = '';
      if (documentType.includes('id_')) {
        docTypeForApi = 'id_document';
        console.log('✅ [OCR-RESERVAS] Tipo detectado: DNI/Pasaporte');
      } else if (documentType.includes('license_')) {
        docTypeForApi = 'driver_license';
        console.log('✅ [OCR-RESERVAS] Tipo detectado: Carnet de Conducir');
      } else {
        console.log('⚠️ [OCR-RESERVAS] Tipo no reconocido, saltando extracción');
        return;
      }
      
      extractFormData.append('documentType', docTypeForApi);

      console.log('🚀 [OCR-RESERVAS] Enviando petición a /api/customers/extract-document-data...');
      const loadingToast = toast.loading('🔍 Extrayendo datos del documento...');
      
      const response = await fetch('/api/customers/extract-document-data', {
        method: 'POST',
        body: extractFormData
      });

      toast.dismiss(loadingToast);

      console.log('📡 [OCR-RESERVAS] Respuesta recibida, status:', response.status);

      if (!response.ok) {
        console.error('❌ [OCR-RESERVAS] Error en respuesta API:', response.status, response.statusText);
        return;
      }

      const result = await response.json();
      console.log('📦 [OCR-RESERVAS] Resultado parseado:', result);
      
      if (!result.success || !result.data) {
        console.error('❌ [OCR-RESERVAS] Respuesta sin datos o sin éxito:', result);
        return;
      }

      const extractedData = result.data;
      console.log('✅ [OCR-RESERVAS] Datos extraídos exitosamente:', extractedData);

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
        console.log('🔄 [OCR-RESERVAS] Ejecutando callback onExtractedDataChange...');
        console.log('📤 [OCR-RESERVAS] Datos a enviar al formulario:', mappedData);
        onExtractedDataChange(mappedData);
        console.log('✅ [OCR-RESERVAS] Callback ejecutado correctamente');
        toast.success('✅ Datos extraídos automáticamente. Campos rellenados en el formulario.');
      } else {
        console.warn('⚠️ [OCR-RESERVAS] onExtractedDataChange NO ESTÁ DEFINIDO - Los campos no se rellenarán');
        toast.success('✅ Datos extraídos automáticamente del documento.');
      }
      
      console.log('📋 [OCR-RESERVAS] Proceso completo finalizado');
      
    } catch (error) {
      console.error('Error extrayendo datos:', error);
    }
  };

  // ✅ COPIADO DESDE CLIENTES: Abre FourPointCropper en lugar de cargar directamente
  const handleFileSelect = async (docType: string, file: File | null) => {
    if (file) {
      // Verificar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      // Verificar tipo de archivo
      if (!file.type.match(/^image\/(jpeg|jpg|png|pdf)$/)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      // Si es PDF, guardarlo directamente
      if (file.type === 'application/pdf') {
        setDocuments(prev => ({
          ...prev,
          [docType]: { file, preview: null, type: docType as any }
        }));
        
        const newDocs = { ...documents };
        newDocs[docType] = { file, preview: null, type: docType as any };
        notifyParent(newDocs);
        return;
      }

      // ✅ Abrir cropper para imágenes
      toast('📐 Ajusta los bordes del documento y recorta', { icon: '✂️' });
      setPendingCrop({ file, docType });
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
      const preview = reader.result as string;
      
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          file: croppedFile,
          preview,
          type: docType as any
        }
      }));

      const newDocs = { ...documents };
      newDocs[docType] = {
        file: croppedFile,
        preview,
        type: docType as any
      };
      notifyParent(newDocs);
    };
    reader.readAsDataURL(croppedFile);

    // ✅ EJECUTAR OCR automáticamente después del recorte
    console.log('📋 [CROPPER] Recorte completado, iniciando extracción OCR...');
    await extractDocumentData(croppedFile, docType);

    // Cerrar cropper
    setPendingCrop(null);
  };

  const removeDocument = (docType: string) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { file: null, preview: null, type: docType as any }
    }));

    // Notificar cambio al componente padre
    const newDocs = { ...documents };
    newDocs[docType] = { file: null, preview: null, type: docType as any };
    notifyParent(newDocs);
  };

  const notifyParent = (docs: { [key: string]: DocumentPreview }) => {
    const filesMap: { [key: string]: File | null } = {};
    Object.keys(docs).forEach(key => {
      filesMap[key] = docs[key].file;
    });
    onDocumentsChange(filesMap);
  };

  const renderDocumentCard = (
    docType: string,
    cameraRef: React.RefObject<HTMLInputElement>,
    galleryRef: React.RefObject<HTMLInputElement>
  ) => {
    const doc = documents[docType];
    const hasDocument = doc.file !== null;

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{documentLabels[docType]}</Label>
          {hasDocument && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeDocument(docType)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasDocument ? (
          <div className="space-y-2">
            {doc.preview ? (
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={doc.preview}
                  alt={documentLabels[docType]}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                <FileText className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">PDF cargado</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Input oculto para cámara */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files && handleFileSelect(docType, e.target.files[0])}
              className="hidden"
            />
            
            {/* Input oculto para galería */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files && handleFileSelect(docType, e.target.files[0])}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraRef.current?.click()}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Cámara
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => galleryRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Galería
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">
                Documentos del Cliente (Opcional)
              </h4>
              <p className="text-sm text-blue-700">
                Sube los documentos ahora o complétalos más tarde desde la ficha del cliente.
                Las imágenes se procesarán automáticamente en blanco y negro para mayor seguridad.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderDocumentCard('id_front', idFrontCameraRef, idFrontGalleryRef)}
          {renderDocumentCard('id_back', idBackCameraRef, idBackGalleryRef)}
          {renderDocumentCard('license_front', licenseFrontCameraRef, licenseFrontGalleryRef)}
          {renderDocumentCard('license_back', licenseBackCameraRef, licenseBackGalleryRef)}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• <strong>🤖 IA automática:</strong> Detecta bordes del documento instantáneamente</p>
          <p>• <strong>✂️ Recorte manual:</strong> Ajusta 4 puntos en las esquinas si necesario</p>
          <p>• <strong>📐 Transformación:</strong> Endereza y convierte a blanco y negro</p>
          <p>• Formatos aceptados: JPG, PNG, PDF</p>
          <p>• Tamaño máximo: 10MB por archivo</p>
        </div>
      </div>

      {/* ✅ Cropper modal */}
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
