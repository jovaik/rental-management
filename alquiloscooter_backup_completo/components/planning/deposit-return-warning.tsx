
'use client'

import React from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, XCircle, CheckCircle2, FileText, CreditCard, IdCard, Wrench } from 'lucide-react'

interface DepositReturnWarningProps {
  open: boolean
  onClose: () => void
  onProceedAnyway: () => void
  missingItems: {
    documents: string[]
    contract: boolean
    payment: boolean
    damages: boolean
    paymentDetails?: {
      totalPrice: number
      totalPaid: number
      pending: number
    }
  }
}

export function DepositReturnWarning({
  open,
  onClose,
  onProceedAnyway,
  missingItems
}: DepositReturnWarningProps) {
  const hasMissingItems = 
    missingItems.documents.length > 0 || 
    missingItems.contract || 
    missingItems.payment ||
    missingItems.damages

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl text-red-600">
              ⚠️ NO DEVOLVER FIANZA
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            <strong className="text-red-700">IMPORTANTE:</strong> El cliente NO cumple con todos los requisitos legales para la devolución del depósito.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Documentos faltantes */}
          {missingItems.documents.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <IdCard className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-lg mb-2">
                    Documentos Faltantes
                  </h3>
                  <ul className="space-y-2">
                    {missingItems.documents.map((doc, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-red-800">
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{doc}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-red-700 font-medium">
                    📋 Se requiere: DNI (frontal + trasero) O Pasaporte + Carnet de Conducir (frontal + trasero)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contrato sin firmar */}
          {missingItems.contract && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-lg mb-2">
                    Contrato No Firmado
                  </h3>
                  <p className="text-red-800 font-medium">
                    El cliente NO ha firmado el contrato de alquiler.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pago incompleto */}
          {missingItems.payment && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-lg mb-2">
                    Pago Incompleto
                  </h3>
                  {missingItems.paymentDetails && (
                    <div className="space-y-2 text-red-800">
                      <div className="flex justify-between font-medium">
                        <span>Total del contrato:</span>
                        <span>€{missingItems.paymentDetails.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total pagado:</span>
                        <span>€{missingItems.paymentDetails.totalPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t-2 border-red-300 pt-2">
                        <span>PENDIENTE DE PAGO:</span>
                        <span className="text-red-600">€{missingItems.paymentDetails.pending.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-red-700 font-medium">
                    ⚠️ El cliente debe pagar el importe total antes de devolver el depósito (incluye extensiones).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Daños en vehículo */}
          {missingItems.damages && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Wrench className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-lg mb-2">
                    Daños Reportados en la Devolución
                  </h3>
                  <p className="text-red-800 font-medium mb-2">
                    Se han registrado <strong>DAÑOS</strong> en la inspección de devolución del vehículo.
                  </p>
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ <strong>NO devolver el depósito</strong> hasta que se evalúen y reparen los daños, o hasta que el cliente abone el coste de la reparación.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resumen */}
          <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-700 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 text-lg mb-2">
                  Acción Requerida
                </h3>
                <p className="text-yellow-800 font-medium">
                  <strong>NO devolver el depósito</strong> hasta que se cumplan TODOS los requisitos legales.
                  El cliente puede recuperar su depósito cuando complete la documentación, el pago pendiente{missingItems.damages ? ', y se resuelvan los daños reportados' : ''}.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Volver y Resolver
          </Button>
          <Button
            variant="destructive"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Continuar de Todas Formas (NO RECOMENDADO)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
