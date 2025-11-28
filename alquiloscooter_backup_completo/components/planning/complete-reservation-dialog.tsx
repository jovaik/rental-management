
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, Wallet, Receipt, MessageCircle, Mail, CheckCircle2, ExternalLink, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { generateWhatsAppReviewLink } from '@/lib/whatsapp-link-generator'
import { DepositReturnWarning } from './deposit-return-warning'

interface CompleteReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
  onShowSignatureChoice?: (contractId: number) => void
}

export function CompleteReservationDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
  onShowSignatureChoice
}: CompleteReservationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDepositWarning, setShowDepositWarning] = useState(false)
  const [depositWarningData, setDepositWarningData] = useState<{
    documents: string[]
    contract: boolean
    payment: boolean
    damages: boolean
    paymentDetails?: {
      totalPrice: number
      totalPaid: number
      pending: number
    }
  }>({
    documents: [],
    contract: false,
    payment: false,
    damages: false
  })
  
  // DEBUG: Verificar props al renderizar
  console.log('🔍 CompleteReservationDialog renderizado:', {
    open,
    hasBooking: !!booking,
    bookingId: booking?.id,
    bookingStatus: booking?.status
  })
  const [completedData, setCompletedData] = useState<{
    contractId: number | null
    whatsappLink: string | null
    reviewConfigError?: string
  }>({
    contractId: null,
    whatsappLink: null,
    reviewConfigError: ''
  })

  // Función para validar requisitos de devolución de depósito
  const validateDepositReturn = async () => {
    if (!booking || !booking.id) return { valid: true, missingItems: { documents: [], contract: false, payment: false, damages: false } }

    const missingDocuments: string[] = []
    let missingContract = false
    let missingPayment = false
    let hasDamages = false
    let paymentDetails = undefined

    try {
      // 1. Verificar documentos del cliente
      const customerResponse = await fetch(`/api/customers/${booking.customer_id}`)
      if (customerResponse.ok) {
        const customer = await customerResponse.json()
        
        // Verificar DNI O Pasaporte
        const hasDNI = customer.id_document_front && customer.id_document_back
        const hasPassport = customer.passport
        
        if (!hasDNI && !hasPassport) {
          if (!hasDNI) {
            if (!customer.id_document_front) missingDocuments.push('DNI/ID - Cara frontal')
            if (!customer.id_document_back) missingDocuments.push('DNI/ID - Cara trasera')
          }
          if (!hasPassport) {
            missingDocuments.push('Pasaporte (alternativa al DNI)')
          }
        }
        
        // Verificar Carnet de Conducir (SIEMPRE requerido)
        if (!customer.driver_license_front) missingDocuments.push('Carnet de Conducir - Cara frontal')
        if (!customer.driver_license_back) missingDocuments.push('Carnet de Conducir - Cara trasera')
      }

      // 2. Verificar contrato firmado
      const contractsResponse = await fetch(`/api/contracts?bookingId=${booking.id}`)
      if (contractsResponse.ok) {
        const contract = await contractsResponse.json()
        if (!contract || !contract.signed_at) {
          missingContract = true
        }
      } else {
        missingContract = true
      }

      // 3. Verificar pago completo
      const paymentsResponse = await fetch(`/api/bookings/${booking.id}/payments`)
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        const totalPaid = paymentsData.payments?.reduce((sum: number, p: any) => sum + Number(p.monto), 0) || 0
        const totalPrice = Number(booking.total_price) || 0
        
        if (totalPaid < totalPrice) {
          missingPayment = true
          paymentDetails = {
            totalPrice,
            totalPaid,
            pending: totalPrice - totalPaid
          }
        }
      }

      // 4. VERIFICAR DAÑOS EN INSPECCIÓN DE DEVOLUCIÓN
      const inspectionsResponse = await fetch(`/api/inspections?bookingId=${booking.id}`)
      if (inspectionsResponse.ok) {
        const inspections = await inspectionsResponse.json()
        
        // Buscar inspecciones de tipo "return" con daños reportados
        const returnInspections = inspections.filter((insp: any) => insp.inspection_type === 'return')
        
        for (const inspection of returnInspections) {
          // Verificar si hay daños registrados
          if (inspection.damages && inspection.damages.length > 0) {
            hasDamages = true
            break
          }
        }
      }

      const hasIssues = missingDocuments.length > 0 || missingContract || missingPayment || hasDamages

      return {
        valid: !hasIssues,
        missingItems: {
          documents: missingDocuments,
          contract: missingContract,
          payment: missingPayment,
          damages: hasDamages,
          paymentDetails
        }
      }
    } catch (error) {
      console.error('Error validando requisitos de depósito:', error)
      // En caso de error, permitir continuar pero avisar
      toast.error('⚠️ No se pudo verificar todos los requisitos. Revisa manualmente.')
      return { valid: true, missingItems: { documents: [], contract: false, payment: false, damages: false } }
    }
  }

  const handleComplete = async () => {
    console.log('🎬 handleComplete llamado. Booking:', booking)
    
    // Validación preventiva
    if (!booking || !booking.id) {
      toast.error('❌ Error: No hay reserva seleccionada')
      return
    }

    // VALIDAR REQUISITOS DE DEPÓSITO ANTES DE COMPLETAR
    setLoading(true)
    const validation = await validateDepositReturn()
    setLoading(false)

    if (!validation.valid) {
      // Mostrar warning de depósito
      setDepositWarningData(validation.missingItems)
      setShowDepositWarning(true)
      return
    }

    // Si todo está bien, proceder
    await proceedWithCompletion()
  }

  const proceedWithCompletion = async () => {
    setLoading(true)

    try {
      console.log('🚀 Iniciando completar reserva:', {
        bookingId: booking.id,
        currentStatus: booking.status
      })

      // 1. Completar la reserva
      console.log('📡 Enviando PUT a /api/bookings/' + booking.id)
      
      const updateResponse = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed'
        })
      })

      console.log('📨 Respuesta recibida:', {
        status: updateResponse.status,
        ok: updateResponse.ok
      })

      if (!updateResponse.ok) {
        let errorMsg = 'Error al completar la reserva'
        try {
          const updateData = await updateResponse.json()
          errorMsg = updateData.error || errorMsg
        } catch (e) {
          errorMsg = `Error HTTP ${updateResponse.status}: ${updateResponse.statusText}`
        }
        
        toast.error('❌ ' + errorMsg)
        console.error('❌ Error al actualizar reserva:', errorMsg)
        return
      }

      const updateData = await updateResponse.json()
      console.log('📝 Respuesta actualizar reserva:', updateData)

      console.log('✅ Reserva actualizada a completed')

      // 2. Verificar/generar contrato
      console.log('📋 Verificando contrato...')
      toast.loading('📄 Verificando/generando contrato...', { id: 'contract-check' })
      
      const contractsResponse = await fetch(`/api/contracts?bookingId=${booking.id}`)
      let contractId: number | null = null

      if (contractsResponse.ok) {
        const contractData = await contractsResponse.json()
        // La API devuelve directamente el contrato, no un array
        if (contractData && contractData.id) {
          contractId = contractData.id
          console.log('✅ Contrato existente encontrado:', contractId)
          toast.success('✅ Contrato verificado', { id: 'contract-check' })
        }
      } else {
        // Si el GET falla, intentar crear uno nuevo
        console.log('📝 Generando contrato...')
        toast.loading('📝 Generando contrato nuevo (esto puede tardar unos segundos)...', { id: 'contract-check' })
        
        const createContractResponse = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id })
        })

        if (createContractResponse.ok) {
          const contractData = await createContractResponse.json()
          contractId = contractData.id || contractData.contract?.id
          console.log('✅ Contrato generado:', contractId)
          toast.success('✅ Contrato generado correctamente', { id: 'contract-check' })
        } else {
          console.error('❌ Error generando contrato')
          toast.error('⚠️ No se pudo generar el contrato', { id: 'contract-check' })
        }
      }

      // 3. Generar enlace de WhatsApp para solicitud de reseña
      let whatsappLink: string | null = null
      let reviewConfigError = ''
      try {
        // Verificar que el cliente tenga teléfono
        if (!booking.customer_phone) {
          reviewConfigError = 'El cliente no tiene número de teléfono registrado'
        } else {
          // Obtener configuración de la empresa para el review link
          const companyConfigResponse = await fetch('/api/company-config')
          let reviewLink = ''
          
          if (companyConfigResponse.ok) {
            const companyConfig = await companyConfigResponse.json()
            reviewLink = companyConfig.google_review_link || ''
          }

          console.log('🔍 Configuración reseñas:', { 
            hasReviewLink: !!reviewLink, 
            hasPhone: !!booking.customer_phone,
            reviewLink: reviewLink || 'NO CONFIGURADO'
          })

          // SIEMPRE generar el enlace de WhatsApp si hay teléfono
          // Si no hay reviewLink, usar un mensaje genérico de agradecimiento
          if (!reviewLink) {
            // Mensaje genérico de agradecimiento (sin enlace de reseñas)
            const customerName = booking.customer_name || 'Cliente'
            const thankYouMessage = `¡Hola ${customerName}! 👋\n\nGracias por confiar en nosotros para tu alquiler. Esperamos que hayas disfrutado de la experiencia.\n\n¡Hasta pronto! 🙏`
            const cleanPhone = booking.customer_phone.replace(/[\s\-\(\)]/g, '')
            whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(thankYouMessage)}`
            reviewConfigError = 'Enviando mensaje de agradecimiento (no hay enlace de reseñas configurado)'
          } else {
            // Usar la función completa con el enlace de reseñas
            whatsappLink = generateWhatsAppReviewLink({
              customerName: booking.customer_name || 'Cliente',
              customerPhone: booking.customer_phone,
              customerCountry: booking.customer_country,
              reviewLink: reviewLink
            })
          }
          console.log('✅ Enlace de WhatsApp generado:', whatsappLink)
        }
      } catch (error: any) {
        console.error('⚠️ Error generando enlace de WhatsApp:', error)
        reviewConfigError = error.message || 'Error desconocido'
      }

      // 4. Mostrar pantalla de éxito con opciones de comunicación
      setCompletedData({
        contractId,
        whatsappLink,
        reviewConfigError
      })
      setShowSuccess(true)
      toast.success('✅ Reserva completada. Email de reseña enviado automáticamente.')

      // NO llamar a onSuccess aquí - solo cuando el usuario cierre el diálogo
    } catch (error: any) {
      console.error('❌ Error CRÍTICO al completar reserva:', error)
      
      // Mostrar error detallado
      const errorMessage = error?.message || error?.toString() || 'Error desconocido al completar la reserva'
      toast.error('❌ Error crítico: ' + errorMessage, { duration: 8000 })
      
      // Si es un error de red
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('⚠️ Error de conexión. Verifica tu conexión a internet.', { duration: 8000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Solo llamar a onSuccess cuando cerramos DESPUÉS de mostrar la pantalla de éxito
    if (showSuccess) {
      onSuccess()
    }
    
    setShowSuccess(false)
    onOpenChange(false)
    
    // Si hay contrato y callback de firma, mostrar opciones de firma
    if (completedData.contractId && onShowSignatureChoice && showSuccess) {
      setTimeout(() => {
        onShowSignatureChoice(completedData.contractId!)
      }, 300)
    }
  }

  const handleWhatsAppClick = () => {
    if (completedData.whatsappLink) {
      console.log('📱 Intentando abrir WhatsApp:', completedData.whatsappLink)
      
      try {
        // Método 1: window.open (más confiable en navegadores modernos)
        const newWindow = window.open(completedData.whatsappLink, '_blank', 'noopener,noreferrer')
        
        if (newWindow) {
          toast.success('✅ WhatsApp abierto. Presiona enviar cuando estés listo.')
        } else {
          // Si window.open fue bloqueado, intentar método alternativo
          console.log('⚠️ window.open bloqueado, intentando método alternativo')
          
          // Método 2: Crear enlace temporal (fallback)
          const link = document.createElement('a')
          link.href = completedData.whatsappLink
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          toast.info('💡 Si WhatsApp no se abrió, copia el enlace con el botón de abajo.')
        }
      } catch (error) {
        console.error('❌ Error al abrir WhatsApp:', error)
        toast.error('⚠️ No se pudo abrir WhatsApp. Usa el botón de copiar enlace.')
      }
    } else {
      console.error('❌ No hay enlace de WhatsApp disponible')
      toast.error('⚠️ No hay enlace de WhatsApp disponible')
    }
  }

  const handleCopyLink = async () => {
    if (completedData.whatsappLink) {
      try {
        await navigator.clipboard.writeText(completedData.whatsappLink)
        toast.success('Enlace copiado. Pégalo en tu navegador para abrir WhatsApp.')
      } catch (error) {
        // Fallback: mostrar el enlace
        toast.info('Enlace: ' + completedData.whatsappLink, { duration: 10000 })
      }
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!showSuccess ? (
          // Vista de confirmación inicial
          <>
            <DialogHeader>
              <DialogTitle>Completar Reserva</DialogTitle>
              <DialogDescription>
                Marca la reserva como completada. La factura/ticket se generará al devolver el vehículo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información de la reserva */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{booking?.customer_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">€{booking?.total_price?.toString() || '0.00'}</span>
                </div>
              </div>

              {/* Información importante */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  ⚠️ <strong>Importante:</strong> Al completar la reserva se marca como finalizada.
                  La factura/ticket se generará cuando se devuelva el vehículo y se haga la inspección de devolución.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  console.log('🖱️ Click en botón Completar Reserva detectado')
                  handleComplete()
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completando...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Completar Reserva
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          // Vista de éxito con opciones de comunicación
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <DialogTitle>¡Reserva Completada!</DialogTitle>
              </div>
              <DialogDescription>
                Solicita una reseña al cliente - Mayor visibilidad y más reservas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Información sobre canales de comunicación */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    ✅ Email enviado automáticamente
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {booking.customer_email 
                      ? 'El cliente recibirá la solicitud de reseña por email'
                      : 'El cliente no tiene email registrado'}
                  </p>
                </div>
              </div>

              {/* Botón de WhatsApp */}
              {completedData.whatsappLink ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">
                        Enviar por WhatsApp (recomendado)
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        WhatsApp tiene mayor tasa de respuesta que el email
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleWhatsAppClick}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Abrir WhatsApp con mensaje listo
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>

                  <Button 
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace (si WhatsApp no se abre)
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    El mensaje ya está escrito en el idioma del cliente. Solo tienes que presionar "Enviar" en WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        ⚠️ No se pudo generar el enlace de WhatsApp
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {completedData.reviewConfigError || 'Error desconocido'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cerrar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Warning de devolución de depósito */}
    <DepositReturnWarning
      open={showDepositWarning}
      onClose={() => setShowDepositWarning(false)}
      onProceedAnyway={async () => {
        setShowDepositWarning(false)
        await proceedWithCompletion()
      }}
      missingItems={depositWarningData}
    />
    </>
  )
}
