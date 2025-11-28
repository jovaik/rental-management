
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { FileText, Download, Check, X, RotateCcw, Edit3, CheckCircle, Send, Link as LinkIcon, Mail, MessageCircle } from 'lucide-react';

interface ContractSignatureProps {
  bookingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSigned?: () => void;
}

export function ContractSignature({ bookingId, open, onOpenChange, onSigned }: ContractSignatureProps) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasEmpty, setCanvasEmpty] = useState(true);

  useEffect(() => {
    if (open && bookingId) {
      // ✅ CRÍTICO: Limpiar el estado del contrato antes de recargar para forzar refrescamiento
      setContract(null);
      setLoading(true);
      loadContract();
      setHasAccepted(false);
      setCanvasEmpty(true);
    } else if (!open) {
      // ✅ Limpiar el estado cuando se cierra el diálogo para evitar IDs obsoletos
      setContract(null);
      setCanvasEmpty(true);
      setHasAccepted(false);
    }
  }, [open, bookingId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      
      // ✅ FORZAR NO-CACHE: Agregar timestamp y headers para evitar caché del navegador
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/contracts?bookingId=${bookingId}&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Contrato cargado:', { bookingId, contractId: data.id, contractNumber: data.contract_number });
        setContract(data);
        
        // Si ya está firmado, cargar la firma
        if (data.signature_data && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              setCanvasEmpty(false);
            };
            img.src = data.signature_data;
          }
        }
      } else {
        toast.error('Error cargando contrato');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando contrato');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de dibujo para ratón
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setCanvasEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Funciones de dibujo para táctil
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setCanvasEmpty(false);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasEmpty(true);
  };

  const handleSign = async () => {
    if (!hasAccepted) {
      toast.error('Debe aceptar los términos del contrato');
      return;
    }

    if (canvasEmpty) {
      toast.error('Debe firmar en el recuadro');
      return;
    }

    try {
      setSigning(true);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureData = canvas.toDataURL('image/png');

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          signatureData
        })
      });

      if (response.ok) {
        toast.success('Contrato firmado exitosamente');
        onSigned?.();
        onOpenChange(false);
      } else {
        toast.error('Error firmando contrato');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error firmando contrato');
    } finally {
      setSigning(false);
    }
  };

  const downloadContract = async () => {
    console.log('🖱️ [DEBUG] downloadContract llamado', { 
      hasContract: !!contract,
      contractId: contract?.id,
      bookingId 
    });
    
    if (!contract) {
      console.error('❌ [DEBUG] No hay contrato disponible');
      toast.error('No hay contrato disponible para descargar');
      return;
    }

    try {
      console.log('🔽 Iniciando descarga de contrato:', { 
        bookingId, 
        contractId: contract.id, 
        contractNumber: contract.contract_number
      });
      
      // ✅ SOLUCIÓN MÓVIL: Usar enlace directo en lugar de blob (funciona en todos los dispositivos)
      const downloadUrl = `/api/contracts/${contract.id}/html`;
      
      toast.loading('📄 Abriendo contrato...', { id: 'pdf-download' });
      
      // Abrir en nueva ventana para que el usuario pueda imprimir
      window.open(downloadUrl, '_blank');
      
      // Dar feedback inmediato
      setTimeout(() => {
        toast.success('✅ Contrato abierto. Usa Ctrl+P o el botón "Imprimir" para guardar como PDF.', { 
          id: 'pdf-download',
          duration: 6000
        });
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error descargando PDF:', error);
      toast.error(`❌ Error: ${error.message || 'Error desconocido'}`, { id: 'pdf-download' });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e40af'; // Azul moderno
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-gray-600">Cargando contrato...</p>
            </div>
          </div>
        )}

        {!loading && contract && (
          <>
            {/* Header moderno */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Contrato de Alquiler</h2>
                    <p className="text-blue-100 text-xs mt-1">
                      Contrato Nº {contract.contract_number}
                    </p>
                  </div>
                </div>
                {contract.signed_at && (
                  <div className="bg-green-500 px-3 py-1.5 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-semibold text-sm">Firmado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="px-6 py-4 bg-gray-50 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Texto del contrato */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 overflow-hidden">
                <ScrollArea className="h-[500px] w-full">
                  <iframe
                    srcDoc={contract.contract_text}
                    className="w-full min-h-[800px] border-0"
                    title="Contrato de Alquiler"
                    sandbox="allow-same-origin"
                  />
                </ScrollArea>
              </div>

              {/* Sección de firma */}
              {!contract.signed_at ? (
                <>
                  {/* Checkbox de aceptación */}
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <label className="flex items-start space-x-2 cursor-pointer group">
                      <div className="flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={hasAccepted}
                          onChange={(e) => setHasAccepted(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-800 group-hover:text-gray-900">
                        He leído y acepto todos los términos y condiciones del contrato. Confirmo que todos los datos proporcionados son correctos y que estoy autorizado para conducir el vehículo.
                      </span>
                    </label>
                  </div>

                  {/* Área de firma */}
                  <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 p-1.5 rounded">
                          <Edit3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Firme aquí</h3>
                          <p className="text-xs text-gray-500">Use su ratón o dedo</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                        disabled={canvasEmpty}
                        className="flex items-center space-x-1 text-xs hover:bg-red-50 hover:text-red-600"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Limpiar</span>
                      </Button>
                    </div>
                    
                    <canvas
                      ref={canvasRef}
                      width={700}
                      height={140}
                      className="border-3 border-blue-300 rounded-lg cursor-crosshair bg-white w-full"
                      style={{ touchAction: 'none', maxHeight: '140px' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawingTouch}
                      onTouchMove={drawTouch}
                      onTouchEnd={stopDrawingTouch}
                    />
                    
                    <div className="mt-2 flex items-start space-x-1 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      <svg className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Firme dentro del recuadro. Si se equivoca, use "Limpiar".</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Contrato firmado */
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-green-500 rounded-full p-2">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-green-900 mb-1">Contrato Firmado</h3>
                      <div className="space-y-1 text-xs text-green-800">
                        <p>
                          <span className="font-semibold">Fecha:</span>{' '}
                          {new Date(contract.signed_at).toLocaleString('es-ES', {
                            dateStyle: 'full',
                            timeStyle: 'short'
                          })}
                        </p>
                        {contract.ip_address && (
                          <p className="text-green-600">
                            <span className="font-semibold">IP:</span> {contract.ip_address}
                          </p>
                        )}
                      </div>
                      {contract.signature_data && (
                        <div className="mt-3 p-3 bg-white rounded border border-green-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Firma:</p>
                          <img 
                            src={contract.signature_data} 
                            alt="Firma" 
                            className="max-h-20 border border-gray-300 rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer siempre visible */}
            <div className="border-t bg-white px-6 py-3">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('🖱️ [DEBUG] Click en botón Descargar detectado');
                    downloadContract();
                  }}
                  disabled={!contract}
                  className="flex items-center space-x-2 text-sm"
                  title={!contract ? 'No hay contrato disponible' : 'Descargar contrato en PDF'}
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar</span>
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="min-w-[100px] text-sm"
                  >
                    {contract?.signed_at ? 'Cerrar' : 'Cancelar'}
                  </Button>
                  
                  {!contract?.signed_at && (
                    <Button
                      onClick={handleSign}
                      disabled={!hasAccepted || canvasEmpty || signing}
                      className="min-w-[140px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-sm"
                    >
                      {signing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Firmando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Firmar Contrato
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
