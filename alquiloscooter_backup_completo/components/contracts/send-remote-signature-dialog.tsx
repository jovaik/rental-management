
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
import { CheckCircle, Loader2, MessageCircle, Mail, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SendRemoteSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  contractId: number;
  onSent?: () => void;
}

export function SendRemoteSignatureDialog({
  open,
  onOpenChange,
  booking,
  contractId,
  onSent
}: SendRemoteSignatureDialogProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMethod, setSentMethod] = useState<'email' | 'whatsapp' | null>(null);

  // Extraer datos del cliente
  const customerEmail = booking?.customer?.email || booking?.customer_email;
  const customerPhone = booking?.customer?.phone || booking?.customer_phone;
  const customerName = booking?.customer_name || 
                       `${booking?.customer?.first_name || ''} ${booking?.customer?.last_name || ''}`.trim();

  const handleSendVia = async (method: 'email' | 'whatsapp') => {
    setSending(true);

    try {
      // Determinar destinatario
      let sendTo = '';
      
      if (method === 'whatsapp') {
        if (!customerPhone) {
          throw new Error('No hay teléfono del cliente disponible');
        }
        // Limpiar y formatear número de teléfono
        let cleanPhone = customerPhone.toString().replace(/[^0-9+]/g, '');
        if (!cleanPhone.startsWith('+')) {
          cleanPhone = '+34' + cleanPhone; // Asumir España si no tiene prefijo
        }
        sendTo = cleanPhone;
      } else {
        if (!customerEmail) {
          throw new Error('No hay email del cliente disponible');
        }
        sendTo = customerEmail;
      }

      console.log('📤 Enviando firma remota:', { contractId, sendTo, method });

      // Llamar al endpoint
      const response = await fetch(`/api/contracts/${contractId}/remote-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendTo, method })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar enlace de firma');
      }

      const data = await response.json();

      if (method === 'email') {
        // EMAIL - Envío automático
        if (data.emailSent) {
          toast.success(
            '✅ Email enviado automáticamente\n\n' +
            `El cliente recibirá el enlace de firma en: ${sendTo}`,
            { duration: 8000, style: { whiteSpace: 'pre-line' } }
          );
        } else {
          // Si no se pudo enviar automáticamente, mostrar mensaje con instrucciones detalladas
          const errorMsg = data.message || 'No se pudo enviar el email';
          toast.error(
            `❌ Error al enviar email\n\n${errorMsg}\n\n` +
            '⚙️ SOLUCIÓN: Ve a Configuración → Empresa → Configuración SMTP\n' +
            'Necesitas configurar el servidor de email (smtp_host, smtp_user, smtp_password)',
            { duration: 15000, style: { whiteSpace: 'pre-line' } }
          );
          throw new Error(errorMsg); // Lanzar error para no marcar como enviado
        }
      } else {
        // WHATSAPP - Abrir WhatsApp Web
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
          toast.success(
            '✅ WhatsApp abierto\n\n' +
            'Revisa la ventana de WhatsApp y envía el mensaje al cliente.',
            { duration: 8000, style: { whiteSpace: 'pre-line' } }
          );
        } else {
          toast.error('No se pudo generar el enlace de WhatsApp');
        }
      }

      // Marcar como enviado
      setSent(true);
      setSentMethod(method);

      if (onSent) {
        onSent();
      }

    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Error al enviar enlace de firma', { duration: 8000 });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Resetear estado después de cerrar
    setTimeout(() => {
      setSent(false);
      setSentMethod(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>¡Reserva Creada!</DialogTitle>
              <DialogDescription>
                Elige cómo enviar el enlace de firma al cliente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info del cliente */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{customerName || 'N/A'}</span>
            </div>
            {customerPhone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{customerPhone}</span>
              </div>
            )}
            {customerEmail && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{customerEmail}</span>
              </div>
            )}
          </div>

          {!sent ? (
            <>
              {/* Botones de envío */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">¿Cómo quiere recibir el cliente el enlace?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Botón WhatsApp */}
                  <Button
                    onClick={() => handleSendVia('whatsapp')}
                    disabled={sending || !customerPhone}
                    className="h-auto py-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    title={!customerPhone ? 'No hay teléfono disponible' : ''}
                  >
                    {sending && sentMethod === 'whatsapp' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-sm font-medium">WhatsApp</span>
                        <span className="text-xs opacity-90">Envío directo</span>
                      </>
                    )}
                  </Button>

                  {/* Botón Email */}
                  <Button
                    onClick={() => handleSendVia('email')}
                    disabled={sending || !customerEmail}
                    className="h-auto py-4 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    title={!customerEmail ? 'No hay email disponible' : ''}
                  >
                    {sending && sentMethod === 'email' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-6 w-6" />
                        <span className="text-sm font-medium">Email</span>
                        <span className="text-xs opacity-90">Automático</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Avisos informativos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  ℹ️ <strong>Firma remota:</strong> El cliente recibirá un enlace para firmar el contrato desde su dispositivo. 
                  El enlace expirará en 30 días o cuando el contrato sea firmado.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  ⚠️ <strong>Importante:</strong> El contrato debe estar firmado ANTES de entregar el vehículo al cliente.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-900">
                  <strong>✅ Enlace enviado correctamente</strong>
                  <p className="mt-2">
                    {sentMethod === 'email' 
                      ? `El cliente recibirá el enlace en su email: ${customerEmail}`
                      : 'El mensaje ha sido abierto en WhatsApp. Por favor envía el mensaje al cliente.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant={sent ? "default" : "outline"}
            onClick={handleClose}
            disabled={sending}
            className={sent ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {sent ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Listo
              </>
            ) : (
              "Enviar Después"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
