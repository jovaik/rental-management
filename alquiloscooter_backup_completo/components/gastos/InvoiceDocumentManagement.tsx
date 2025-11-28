
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2, Camera, Crop } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FourPointCropper } from '@/components/planning/FourPointCropper';

// Interfaz para datos extraídos del OCR de facturas/tickets
export interface ExtractedInvoiceData {
  tipo_documento?: string;     // 'FACTURA' o 'TICKET'
  fecha?: string;               // Fecha en formato YYYY-MM-DD
  numero_factura?: string;      // Número de factura
  proveedor?: string;           // Nombre del proveedor
  proveedor_cif?: string;       // CIF/NIF del proveedor (OBLIGATORIO para facturas según Hacienda)
  descripcion?: string;         // Descripción del gasto
  base_imponible?: number;      // Base imponible
  iva_porcentaje?: number;      // % de IVA
  iva_importe?: number;         // Importe IVA
  total?: number;               // Total
  categoria?: string;           // Categoría del gasto
  metodo_pago?: string;         // Método de pago
}

interface InvoiceDocumentManagementProps {
  onExtractedDataChange?: (data: ExtractedInvoiceData) => void;
  onFileSelect?: (file: File) => void;
}

export function InvoiceDocumentManagement({
  onExtractedDataChange,
  onFileSelect
}: InvoiceDocumentManagementProps) {
  // ✅ VERSIÓN COPIADA EXACTAMENTE DE CLIENTES
  console.log('🧾 InvoiceDocumentManagement v5.0 - COPIADO DE CLIENTES');
  
  const [uploading, setUploading] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<{ file: File } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ FUNCIÓN DE COMPRESIÓN - EXACTA DE CLIENTES
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

  // ✅ NUEVA FUNCIÓN: Convertir PDF a JPG (primera página)
  const convertPDFtoJPG = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        
        try {
          // Cargar PDF con PDF.js
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            reject(new Error('PDF.js no está cargado'));
            return;
          }
          
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          const page = await pdf.getPage(1);
          
          const scale = 2.0;
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // Convertir canvas a blob
          canvas.toBlob((blob) => {
            if (blob) {
              const jpgFile = new File([blob], file.name.replace('.pdf', '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              console.log('✅ [PDF→JPG] Conversión exitosa:', {
                original: file.name,
                converted: jpgFile.name,
                size: `${(jpgFile.size / 1024 / 1024).toFixed(2)}MB`
              });
              resolve(jpgFile);
            } else {
              reject(new Error('Error al convertir canvas a blob'));
            }
          }, 'image/jpeg', 0.95);
          
        } catch (error) {
          console.error('❌ [PDF→JPG] Error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer PDF'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Manejar selección de archivo
  const handleFileSelect = async (file: File | null) => {
    if (file) {
      // Verificar tamaño del archivo (max 10MB para móviles)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      // Verificar tipo de archivo (imágenes o PDF)
      const isImage = file.type.match(/^image\/(jpeg|jpg|png)$/);
      const isPDF = file.type === 'application/pdf';

      if (!isImage && !isPDF) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      // ✅ SI ES PDF: convertir a JPG primero y abrir cropper
      if (isPDF) {
        console.log('📄 [PDF] Archivo PDF detectado, convirtiendo a JPG...');
        const loadingToast = toast.loading('🔄 Convirtiendo PDF a imagen...');
        
        try {
          const jpgFile = await convertPDFtoJPG(file);
          toast.success('✅ PDF convertido a imagen', { id: loadingToast });
          
          // Abrir cropper con la imagen convertida
          toast('📐 Ajusta los bordes del documento y recorta', { icon: '✂️' });
          setPendingCrop({ file: jpgFile });
          
        } catch (error) {
          console.error('❌ [PDF] Error al convertir:', error);
          toast.error('Error al convertir PDF. Intenta con una imagen JPG.', { id: loadingToast });
        }
        return;
      }

      // ✅ SI ES IMAGEN: abrir cropper
      toast('📐 Ajusta los bordes del documento y recorta', { icon: '✂️' });
      setPendingCrop({ file });
    }
  };

  // Manejar recorte completado
  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'factura_recortada.jpg', { 
      type: 'image/jpeg' 
    });

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setPendingCrop(null);
    };
    reader.readAsDataURL(croppedFile);

    // Notificar archivo seleccionado
    if (onFileSelect) {
      onFileSelect(croppedFile);
    }

    // ✅ EJECUTAR OCR automáticamente después del recorte
    console.log('📋 [CROPPER] Recorte completado, iniciando extracción OCR...');
    await extractInvoiceData(croppedFile);
  };

  // ✅ FUNCIÓN DE EXTRACCIÓN - EXACTA DE CLIENTES, ADAPTADA PARA FACTURAS
  const extractInvoiceData = async (file: File) => {
    console.log('🎯 [OCR] Iniciando extractInvoiceData...');
    console.log('📁 [OCR] Archivo original:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
    
    try {
      // ✅ COMPRIMIR SOLO IMÁGENES (NO COMPRIMIR PDFs)
      let fileToSend = file;
      const isPDF = file.type === 'application/pdf';
      
      if (file.type.startsWith('image/') && !isPDF) {
        try {
          fileToSend = await compressImage(file);
        } catch (compressError) {
          console.warn('⚠️ [OCR] Error al comprimir, usando original:', compressError);
        }
      } else if (isPDF) {
        console.log('📄 [OCR] PDF detectado, enviando sin comprimir...');
      }
      
      const extractFormData = new FormData();
      extractFormData.append('file', fileToSend);

      console.log('🚀 [OCR] Enviando petición a /api/gastos/extract-invoice-data...');
      const loadingToast = toast.loading('🔍 Extrayendo datos del documento...');
      
      const response = await fetch('/api/gastos/extract-invoice-data', {
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

      // Llamar al callback si existe
      if (onExtractedDataChange) {
        console.log('🔄 [OCR] Ejecutando callback onExtractedDataChange...');
        console.log('📤 [OCR] Datos a enviar al formulario:', extractedData);
        onExtractedDataChange(extractedData);
        console.log('✅ [OCR] Callback ejecutado correctamente');
      } else {
        console.warn('⚠️ [OCR] onExtractedDataChange NO ESTÁ DEFINIDO - Los campos no se rellenarán');
      }

      // Notificar al usuario
      toast.success('✅ Datos extraídos automáticamente. Campos rellenados en el formulario.');
      
      // Log para debugging
      console.log('📋 [OCR] Proceso completo finalizado:', extractedData);
      
    } catch (error) {
      console.error('Error extrayendo datos:', error);
      // No mostrar error al usuario, el OCR es opcional
    }
  };

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <FileText className="h-5 w-5" />
            Escanear Factura/Ticket
          </CardTitle>
          <CardDescription>
            Escanea o sube una foto/PDF de tu ticket o factura.
            <br />
            <span className="font-semibold text-orange-600">✨ JPG, PNG o PDF</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Input oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />

          {/* Botón para seleccionar archivo */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Escanear/Subir Documento
            </Button>
          </div>

          {/* Preview del documento */}
          {preview && (
            <div className="mt-4 p-3 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">
                  ✅ Documento procesado
                </span>
              </div>
              
              {preview === 'PDF' ? (
                // Mostrar ícono de PDF
                <div className="flex flex-col items-center justify-center w-full h-48 bg-white rounded-lg">
                  <FileText className="h-16 w-16 text-orange-500 mb-2" />
                  <span className="text-sm text-gray-600">Documento PDF cargado</span>
                </div>
              ) : (
                // Mostrar imagen normal
                <div className="relative w-full h-48 bg-white rounded-lg overflow-hidden">
                  <Image
                    src={preview}
                    alt="Preview de documento"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Indicador de carga */}
          {uploading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando documento...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de recorte */}
      {pendingCrop && (
        <FourPointCropper
          imageFile={pendingCrop.file}
          onCropComplete={handleCropComplete}
          onCancel={() => setPendingCrop(null)}
        />
      )}
    </>
  );
}
