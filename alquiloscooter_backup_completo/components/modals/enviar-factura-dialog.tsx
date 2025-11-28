'use client'

import React, { useState } from 'react'
import { Mail, MessageCircle, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface EnviarFacturaDialogProps {
  facturaId: string
  facturaNumero: string
  clienteNombre: string
  clienteEmail?: string
  clienteTelefono?: string
  tipo: 'TICKET' | 'FACTURA'
}

export function EnviarFacturaDialog({
  facturaId,
  facturaNumero,
  clienteNombre,
  clienteEmail,
  clienteTelefono,
  tipo
}: EnviarFacturaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(clienteEmail || '')
  const [telefono, setTelefono] = useState(clienteTelefono || '')
  const [mensaje, setMensaje] = useState(
    `Hola ${clienteNombre}, te enviamos tu ${tipo.toLowerCase()} #${facturaNumero}. Gracias por tu confianza.`
  )

  const enviarPorEmail = async () => {
    if (!email) {
      toast.error('Por favor ingresa un email válido')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/car-rental-billing/facturas/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId,
          email,
          mensaje,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.demo) {
          toast.info(`📧 Modo Demo: El email se enviaría a ${email}. Para envío real, configura un servicio de email (SendGrid, Amazon SES, etc.)`)
        } else {
          toast.success(`✅ ${tipo} enviado por email correctamente a ${email}`)
        }
        setOpen(false)
      } else {
        toast.error(data.error || 'Error al enviar el email')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar el email')
    } finally {
      setLoading(false)
    }
  }

  const enviarPorWhatsApp = async () => {
    if (!telefono) {
      toast.error('Por favor ingresa un número de teléfono válido')
      return
    }

    try {
      setLoading(true)
      
      toast.info('Preparando documento...')
      
      // Descargar el documento
      const response = await fetch(`/api/car-rental-billing/facturas/${facturaId}/pdf`)
      if (response.ok) {
        const htmlContent = await response.text()
        
        // Crear un Blob con el contenido HTML
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        
        // Descargar el archivo
        const a = document.createElement('a')
        a.href = url
        a.download = `${facturaNumero}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('✅ Documento descargado. Abriendo WhatsApp...')
        
        // Esperar un momento antes de abrir WhatsApp
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Limpiar y formatear número de teléfono
        const numeroLimpio = telefono.replace(/\D/g, '')
        const numeroCompleto = numeroLimpio.startsWith('34') ? numeroLimpio : `34${numeroLimpio}`
        
        // Crear mensaje para WhatsApp
        const mensajeWhatsApp = encodeURIComponent(
          `${mensaje}\n\n📎 El documento *${facturaNumero}.html* se ha descargado en tu dispositivo.\n\nPor favor, adjúntalo en este chat para completar el envío.`
        )
        
        // Abrir WhatsApp
        const whatsappUrl = `https://wa.me/${numeroCompleto}?text=${mensajeWhatsApp}`
        const whatsappWindow = window.open(whatsappUrl, '_blank')
        
        if (!whatsappWindow) {
          toast.error('No se pudo abrir WhatsApp. Por favor verifica el bloqueador de ventanas emergentes.')
        } else {
          toast.success('✅ WhatsApp abierto. Adjunta el archivo descargado en el chat.')
        }
        
        setOpen(false)
      } else {
        throw new Error('Error al generar el documento')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al preparar el documento. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 rounded-sm w-full">
          <Send className="mr-2 h-4 w-4" />
          Enviar Documento
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar {tipo}</DialogTitle>
          <DialogDescription>
            Envía el {tipo.toLowerCase()} #{facturaNumero} al cliente por Email o WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              placeholder="Escribe un mensaje para el cliente..."
            />
          </div>

          {/* Enviar por Email */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Enviar por Email</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email del cliente</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </div>
            <Button
              onClick={enviarPorEmail}
              disabled={loading || !email}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar por Email'}
            </Button>
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-700">
                ℹ️ <strong>Modo demostración:</strong> El envío de email actualmente está en modo demo. Para envío real, configura un servicio de email como SendGrid o Amazon SES.
              </p>
            </div>
          </div>

          {/* Enviar por WhatsApp */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Enviar por WhatsApp</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono del cliente</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>
            <Button
              onClick={enviarPorWhatsApp}
              disabled={!telefono || loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {loading ? 'Preparando...' : 'Descargar y Abrir WhatsApp'}
            </Button>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-xs text-green-800 leading-relaxed">
                <strong>📋 Instrucciones:</strong><br/>
                1️⃣ El documento se descargará automáticamente en formato HTML<br/>
                2️⃣ WhatsApp se abrirá con el mensaje preparado<br/>
                3️⃣ Solo tienes que adjuntar el archivo descargado en el chat<br/>
                <br/>
                💡 <em>El documento HTML puede abrirse en cualquier navegador y se puede imprimir desde ahí.</em>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
