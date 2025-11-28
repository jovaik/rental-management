
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, RotateCcw, Sparkles } from 'lucide-react';
import { detectDocumentCorners } from '@/lib/document-detection-ai';
import { applyPerspectiveTransform } from '@/lib/perspective-transform';
import { rotateImageIfNeeded } from '@/lib/exif-rotation';
import { toast } from 'react-hot-toast';

interface Point {
  x: number;
  y: number;
}

interface FourPointCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function FourPointCropper({ imageFile, onCropComplete, onCancel }: FourPointCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [detectingAI, setDetectingAI] = useState(false);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ MEJORA: Cargar imagen con rotación automática EXIF
  useEffect(() => {
    const loadAndRotateImage = async () => {
      try {
        // 1. Rotar imagen según EXIF si es necesario
        console.log('📸 Verificando orientación EXIF...');
        const rotatedFile = await rotateImageIfNeeded(imageFile);
        
        // 2. Crear URL de la imagen rotada
        const url = URL.createObjectURL(rotatedFile);
        setImageUrl(url);

        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          
          // Inicializar esquinas con margen del 5%
          const margin = 0.05;
          setCorners([
            { x: img.width * margin, y: img.height * margin },
            { x: img.width * (1 - margin), y: img.height * margin },
            { x: img.width * (1 - margin), y: img.height * (1 - margin) },
            { x: img.width * margin, y: img.height * (1 - margin) }
          ]);
          
          // ✅ YA NO SE LLAMA AUTOMÁTICAMENTE - Solo con botón manual
          // autoDetectWithAI();
        };
        img.src = url;

        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('❌ Error al cargar imagen:', error);
        toast.error('Error al cargar la imagen');
      }
    };

    loadAndRotateImage();
  }, [imageFile]);

  // Detección automática con IA
  const autoDetectWithAI = async () => {
    console.log('🔍 [IA] CLICK EN BOTÓN - Iniciando detección AI...');
    
    // ✅ FEEDBACK INMEDIATO
    setDetectingAI(true);
    const toastId = toast.loading('🤖 Detectando bordes con IA...', { 
      id: 'ai-detect',
      duration: 30000 // 30 segundos de timeout
    });
    
    console.log('📸 [IA] Archivo:', imageFile?.name, imageFile?.size);

    try {
      if (!imageFile) {
        throw new Error('No hay imagen cargada');
      }

      console.log('🚀 [IA] Llamando a detectDocumentCorners...');
      const result = await detectDocumentCorners(imageFile);
      console.log('📦 [IA] Resultado recibido:', JSON.stringify(result, null, 2));
      
      if (result.success && result.confidence > 0.7) {
        setCorners(result.corners);
        console.log('✅ [IA] Esquinas actualizadas:', result.corners);
        toast.success(`✅ Bordes detectados (${Math.round(result.confidence * 100)}%)`, { 
          id: 'ai-detect',
          duration: 3000
        });
      } else if (result.success && result.confidence > 0) {
        // Confianza baja pero detectó algo
        setCorners(result.corners);
        console.log('⚠️ [IA] Confianza baja pero aplicando:', result.corners);
        toast.success(`⚠️ Bordes detectados pero confianza baja (${Math.round(result.confidence * 100)}%). Revisa los puntos.`, {
          id: 'ai-detect',
          duration: 5000
        });
      } else {
        console.warn('⚠️ [IA] Detección falló:', result);
        toast.error('⚠️ No se pudo detectar el documento. Ajusta manualmente.', {
          id: 'ai-detect',
          duration: 4000
        });
      }
    } catch (error: any) {
      console.error('❌ [IA] ERROR:', error);
      console.error('❌ [IA] Stack:', error?.stack);
      console.error('❌ [IA] Mensaje:', error?.message);
      
      // Mensaje de error más específico
      let errorMsg = '⚠️ Error en detección IA';
      if (error?.message?.includes('API key')) {
        errorMsg = '❌ Error de configuración (API key)';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMsg = '❌ Error de conexión. Verifica tu internet.';
      } else if (error?.message) {
        errorMsg = `❌ Error: ${error.message}`;
      }
      
      toast.error(errorMsg, { id: 'ai-detect', duration: 5000 });
    } finally {
      setDetectingAI(false);
      console.log('🏁 [IA] Proceso finalizado');
    }
  };

  // Dibujar overlay en canvas
  useEffect(() => {
    if (!canvasRef.current || !imageUrl || imageDimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Ajustar tamaño del canvas al contenedor
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      
      // ✅ ARREGLO: Ajustar dimensiones según rotación
      let imageWidth = imageDimensions.width;
      let imageHeight = imageDimensions.height;
      
      // Si rotación es 90° o 270°, intercambiar width/height
      if (rotation === 90 || rotation === 270) {
        [imageWidth, imageHeight] = [imageHeight, imageWidth];
      }
      
      const scale = containerWidth / imageWidth;
      const displayHeight = imageHeight * scale;

      canvas.width = containerWidth;
      canvas.height = displayHeight;

      // Dibujar imagen CON rotación ajustada
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Dibujar con dimensiones originales para rotación correcta
      const drawWidth = rotation === 90 || rotation === 270 ? canvas.height : canvas.width;
      const drawHeight = rotation === 90 || rotation === 270 ? canvas.width : canvas.height;
      
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // ✅ MEJORA: Overlay muy tenue para no molestar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Reducido de 0.3 a 0.15
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ✅ NUEVO: Área seleccionada con REJILLA en lugar de blanco sólido
      const scaledCorners = corners.map(c => ({
        x: (c.x / imageDimensions.width) * canvas.width,
        y: (c.y / imageDimensions.height) * canvas.height
      }));

      // Crear un path con el área seleccionada
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scaledCorners[0].x, scaledCorners[0].y);
      scaledCorners.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.clip(); // Limitar dibujo al área seleccionada

      // ✅ DIBUJAR REJILLA TRANSPARENTE (líneas sutiles)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Blanco semi-transparente
      ctx.lineWidth = 1;
      
      // Líneas verticales cada 30px
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Líneas horizontales cada 30px
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      ctx.restore(); // Restaurar clip

      // Dibujar borde del área seleccionada
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scaledCorners[0].x, scaledCorners[0].y);
      scaledCorners.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.stroke();

      // Dibujar puntos de esquina (EXTRA GRANDES PARA FACILITAR TOQUE)
      scaledCorners.forEach((corner, i) => {
        // Puntos inferiores (BR, BL) aún más grandes
        const radius = (i === 2 || i === 3) ? 25 : 22;
        
        ctx.fillStyle = i === draggingIndex ? '#EF4444' : '#3B82F6';
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Etiquetas
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labels = ['TL', 'TR', 'BR', 'BL'];
        ctx.fillText(labels[i], corner.x, corner.y);
      });
    };
    img.src = imageUrl;
  }, [corners, draggingIndex, imageUrl, imageDimensions, rotation]);

  // ✅ ARREGLO: Usar window listeners para arrastre global (MOUSE + TOUCH)
  useEffect(() => {
    if (draggingIndex === null) return;

    const handleGlobalMove = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Convertir a coordenadas de imagen original
      const realX = (x / canvas.width) * imageDimensions.width;
      const realY = (y / canvas.height) * imageDimensions.height;

      // Actualizar esquina
      const newCorners = [...corners] as [Point, Point, Point, Point];
      newCorners[draggingIndex] = {
        x: Math.max(0, Math.min(imageDimensions.width, realX)),
        y: Math.max(0, Math.min(imageDimensions.height, realY))
      };
      setCorners(newCorners);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleGlobalMove(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      // SOLO prevenir scroll si estamos arrastrando un punto
      if (draggingIndex !== null) {
        e.preventDefault();
        if (e.touches.length > 0) {
          handleGlobalMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }
      // Si NO estamos arrastrando, dejar que el scroll funcione normalmente
    };

    const handleGlobalEnd = () => {
      console.log('✅ Punto soltado:', draggingIndex);
      setDraggingIndex(null);
    };

    // Agregar listeners de MOUSE y TOUCH
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [draggingIndex, imageDimensions, corners]);

  // Manejar inicio de arrastre (compartido para mouse y touch)
  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Buscar punto cercano
    const scaledCorners = corners.map(c => ({
      x: (c.x / imageDimensions.width) * canvas.width,
      y: (c.y / imageDimensions.height) * canvas.height
    }));

    const clickedIndex = scaledCorners.findIndex((c, i) => {
      const dist = Math.sqrt(Math.pow(c.x - x, 2) + Math.pow(c.y - y, 2));
      // Puntos inferiores (BR=2, BL=3) tienen zona de captura aún más grande
      const threshold = (i === 2 || i === 3) ? 70 : 60;
      return dist < threshold;
    });

    if (clickedIndex !== -1) {
      setDraggingIndex(clickedIndex);
      console.log('✅ Punto capturado:', clickedIndex, scaledCorners[clickedIndex]);
    } else {
      console.log('❌ No se capturó ningún punto. Click/Touch en:', {x, y}, 'Esquinas:', scaledCorners);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Aplicar recorte
  const handleCrop = async () => {
    setProcessing(true);
    toast.loading('📐 Aplicando transformación...', { id: 'crop' });

    try {
      // ✅ PASO 1: Rotar imagen si es necesario
      let fileToProcess = imageFile;
      if (rotation !== 0) {
        console.log(`🔄 Rotando imagen ${rotation}° antes de recortar...`);
        fileToProcess = await rotateImage(imageFile, rotation);
      }

      // ✅ PASO 2: Aplicar recorte con perspectiva
      const { blob } = await applyPerspectiveTransform(fileToProcess, corners);
      
      // ✅ PASO 3: Convertir a blanco y negro
      const grayscaleBlob = await convertToGrayscale(blob);
      
      toast.success('✅ Documento recortado y procesado', { id: 'crop' });
      onCropComplete(grayscaleBlob);
    } catch (error) {
      console.error('Error al recortar:', error);
      toast.error('❌ Error al procesar el documento', { id: 'crop' });
    } finally {
      setProcessing(false);
    }
  };

  // Rotar imagen manualmente
  const rotateImage = async (file: File, degrees: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear canvas'));
          return;
        }

        // Ajustar dimensiones del canvas según rotación
        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Aplicar rotación
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob((blob) => {
          if (blob) {
            const rotatedFile = new File([blob], file.name, { type: file.type });
            resolve(rotatedFile);
          } else {
            reject(new Error('Error al rotar imagen'));
          }
        }, file.type, 0.92);

        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Convertir a blanco y negro
  const convertToGrayscale = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Error al crear canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = data[i + 1] = data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Error al convertir a blob'));
        }, 'image/jpeg', 0.92);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Contenedor modal con tamaño controlado */}
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 md:p-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-semibold">Recortar Documento</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              ✕ Cancelar
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <p className="text-xs md:text-sm text-gray-600">
              {detectingAI ? '🤖 Detectando automáticamente...' : '📍 Arrastra los 4 puntos azules a las esquinas'}
            </p>
            <div className="flex gap-2">
              {/* Botón de Rotación */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                disabled={detectingAI || processing}
                title="Rotar 90° en sentido horario"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Rotar</span> {rotation}°
              </Button>
              
              {/* Botón IA Automática */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={autoDetectWithAI}
                disabled={detectingAI}
              >
                {detectingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    <span className="hidden sm:inline">Detectando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">IA Auto</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas - Contenedor con altura máxima definida y scroll visible */}
        <div 
          ref={containerRef} 
          className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden p-2 min-h-0"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            // Forzar altura máxima para que el scroll sea visible
            maxHeight: 'calc(90vh - 250px)' // Restar header + leyenda + footer
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair rounded-lg shadow-lg"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ 
              touchAction: 'auto',
              userSelect: 'none',
              // Asegurar que el canvas tiene altura mínima para generar scroll
              minHeight: '600px'
            }}
          />
        </div>

        {/* Leyenda */}
        <div className="px-4 py-2 bg-blue-50 border-t border-b shrink-0">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <strong>TL</strong> = Arriba Izq.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <strong>TR</strong> = Arriba Der.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <strong>BR</strong> = Abajo Der.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <strong>BL</strong> = Abajo Izq.
            </span>
          </div>
        </div>

        {/* Actions - Footer fijo */}
        <div className="p-3 md:p-4 flex flex-wrap gap-2 justify-end border-t shrink-0 bg-white">
          <Button
            variant="outline"
            onClick={autoDetectWithAI}
            disabled={detectingAI || processing}
          >
            {detectingAI ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detectando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Detectar Automáticamente
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const margin = 0.05;
              setCorners([
                { x: imageDimensions.width * margin, y: imageDimensions.height * margin },
                { x: imageDimensions.width * (1 - margin), y: imageDimensions.height * margin },
                { x: imageDimensions.width * (1 - margin), y: imageDimensions.height * (1 - margin) },
                { x: imageDimensions.width * margin, y: imageDimensions.height * (1 - margin) }
              ]);
            }}
            disabled={processing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetear
          </Button>

          <Button
            onClick={handleCrop}
            disabled={processing || detectingAI}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Recortar Documento
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
