
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Mail, 
  MessageCircle, 
  Copy, 
  Loader2, 
  CheckCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RemoteSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  contractId: number;
  onSuccess?: () => void;
}

export function RemoteSignatureDialog({
  open,
  onOpenChange,
  booking,
  contractId,
  onSuccess
}: RemoteSignatureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [sendTo, setSendTo] = useState('');

  const generateSignatureLink = async () => {
    try {
      setLoading(true);
      
      // Generar el enlace sin enviar (enviando un placeholder)
      const response = await fetch(`/api/contracts/${contractId}/remote-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'email',
          sendTo: booking?.customer?.email || 'placeholder@example.com'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error generando enlace');
      }

      setSignatureUrl(data.signatureUrl);
      setExpiresAt(new Date(data.expiresAt));
      toast.success('Enlace de firma generado correctamente');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error generando enlace de firma');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (method: 'whatsapp' | 'email') => {
    if (!sendTo) {
      toast.error(`Por favor ingresa un ${method === 'whatsapp' ? 'número de teléfono' : 'email'}`);
      return;
    }

    try {
      setLoading(true);

      // Limpiar el número de teléfono si es WhatsApp
      const cleanSendTo = method === 'whatsapp' 
        ? sendTo.replace(/[^0-9+]/g, '') 
        : sendTo;

      console.log('📤 Enviando enlace:', { 
        method, 
        sendTo, 
        cleanSendTo, 
        contractId 
      });

      const response = await fetch(`/api/contracts/${contractId}/remote-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          sendTo: cleanSendTo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || 'Error enviando enlace');
      }

      console.log('✅ Respuesta del servidor:', data);

      setSignatureUrl(data.signatureUrl);
      setExpiresAt(new Date(data.expiresAt));
      
      if (method === 'whatsapp') {
        // Abrir WhatsApp con el mensaje
        const message = data.message || `Hola, por favor firma tu contrato de alquiler: ${data.signatureUrl}`;
        const whatsappUrl = `https://wa.me/${cleanSendTo}?text=${encodeURIComponent(message)}`;
        
        console.log('📱 Abriendo WhatsApp:', whatsappUrl);
        
        const whatsappWindow = window.open(whatsappUrl, '_blank');
        
        if (whatsappWindow) {
          toast.success('¡WhatsApp abierto! Envía el mensaje al cliente.', {
            duration: 5000
          });
        } else {
          toast.info(
            'Por favor permite los popups en tu navegador.',
            { duration: 7000 }
          );
        }
      } else {
        toast.success('Enlace generado. Envíalo por email al cliente.', {
          duration: 5000
        });
      }

      // Copiar al portapapeles también
      try {
        await navigator.clipboard.writeText(data.signatureUrl);
        console.log('📋 Enlace copiado al portapapeles');
      } catch (clipErr) {
        console.warn('⚠️ No se pudo copiar al portapapeles');
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Error enviando enlace', {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (signatureUrl) {
      navigator.clipboard.writeText(signatureUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  React.useEffect(() => {
    if (open && !signatureUrl) {
      generateSignatureLink();
    }
    
    // Pre-llenar email/teléfono del cliente
    if (booking?.customer) {
      if (booking.customer.email) {
        setSendTo(booking.customer.email);
      } else if (booking.customer.phone) {
        setSendTo(booking.customer.phone);
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Enviar Contrato para Firma Remota
          </DialogTitle>
          <DialogDescription>
            Genera y envía un enlace seguro para que el cliente firme el contrato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del cliente */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{booking?.customer_name || 'N/A'}</span>
            </div>
            {booking?.customer?.email && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{booking.customer.email}</span>
              </div>
            )}
            {booking?.customer?.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{booking.customer.phone}</span>
              </div>
            )}
          </div>

          {/* Enlace generado */}
          {signatureUrl && (
            <div className="space-y-3">
              <Label>Enlace de Firma</Label>
              <div className="flex gap-2">
                <Input 
                  value={signatureUrl} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(signatureUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {expiresAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Expira el {format(expiresAt, "d 'de' MMMM 'a las' HH:mm", { locale: es })}</span>
                </div>
              )}
            </div>
          )}

          {/* Opciones de envío */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Enviar por:</h4>
            
            <div className="grid grid-cols-1 gap-3">
              {/* WhatsApp */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <Label className="text-base font-semibold">WhatsApp</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="+34 612 345 678"
                    value={sendMethod === 'whatsapp' ? sendTo : booking?.customer?.phone || ''}
                    onChange={(e) => {
                      setSendMethod('whatsapp');
                      setSendTo(e.target.value);
                    }}
                    onFocus={() => setSendMethod('whatsapp')}
                  />
                  <Button
                    onClick={() => handleSend('whatsapp')}
                    disabled={loading || !signatureUrl}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading && sendMethod === 'whatsapp' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <Label className="text-base font-semibold">Email</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="cliente@example.com"
                    value={sendMethod === 'email' ? sendTo : booking?.customer?.email || ''}
                    onChange={(e) => {
                      setSendMethod('email');
                      setSendTo(e.target.value);
                    }}
                    onFocus={() => setSendMethod('email')}
                  />
                  <Button
                    onClick={() => handleSend('email')}
                    disabled={loading || !signatureUrl}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading && sendMethod === 'email' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              💡 <strong>Consejo:</strong> El enlace es único y expira en 7 días. El cliente podrá 
              firmar desde cualquier dispositivo con acceso a internet.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
