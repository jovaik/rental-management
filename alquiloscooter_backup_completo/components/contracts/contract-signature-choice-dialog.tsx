
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
import { Edit3, Send, CheckCircle, ArrowRight } from 'lucide-react';

interface ContractSignatureChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onPresencialChoice: () => void;
  onRemoteChoice: () => void;
}

export function ContractSignatureChoiceDialog({
  open,
  onOpenChange,
  booking,
  onPresencialChoice,
  onRemoteChoice
}: ContractSignatureChoiceDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>¡Reserva Completada!</DialogTitle>
              <DialogDescription>
                Ahora procederemos con la firma del contrato
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info de la reserva */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{booking?.customer_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vehículo:</span>
              <span className="font-medium">
                {booking?.car?.make} {booking?.car?.model} - {booking?.car?.registration_number}
              </span>
            </div>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">¿Cómo desea firmar el contrato?</h3>
            <p className="text-sm text-muted-foreground">
              Elija el método de firma más conveniente
            </p>
          </div>

          {/* Opciones de firma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Firma Presencial */}
            <button
              onClick={() => {
                onPresencialChoice();
                onOpenChange(false);
              }}
              className="group relative flex flex-col items-center gap-3 p-6 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200 transition-colors">
                <Edit3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-1">Firma Presencial</h4>
                <p className="text-xs text-gray-600">
                  El cliente firma ahora en pantalla o tablet
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Firma Remota */}
            <button
              onClick={() => {
                onRemoteChoice();
                onOpenChange(false);
              }}
              className="group relative flex flex-col items-center gap-3 p-6 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
            >
              <div className="bg-green-100 p-4 rounded-full group-hover:bg-green-200 transition-colors">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-1">Firma Remota</h4>
                <p className="text-xs text-gray-600">
                  Enviar enlace por WhatsApp o Email
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-900">
              ℹ️ <strong>Nota:</strong> El contrato debe firmarse para completar el proceso de alquiler.
              Puede hacerlo ahora presencialmente o enviar un enlace al cliente.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Firmar Después
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
