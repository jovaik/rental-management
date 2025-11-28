
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Upload, 
  Save, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText,
  Palette,
  X,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NavigationButtons } from '@/components/ui/navigation-buttons'
import { toast } from 'react-hot-toast'

interface CompanyConfig {
  id: number
  company_name: string
  company_nif: string
  company_address: string
  company_city: string
  company_phone: string
  company_email: string
  company_website?: string | null
  logo_url?: string | null
  pwa_icon_url?: string | null
  favicon_url?: string | null
  primary_color: string
  secondary_color: string
  factura_prefix: string
  ticket_prefix: string
  factura_series: string
  iva_rate: number
  bank_name?: string | null
  bank_iban?: string | null
  bank_swift?: string | null
  invoice_footer_text?: string | null
  terms_and_conditions?: string | null
  google_review_link?: string | null
  
  // SMTP Configuration
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_secure?: boolean | null
  smtp_user?: string | null
  smtp_password?: string | null
  smtp_from_name?: string | null
  smtp_from_email?: string | null
  
  // WhatsApp Business API Configuration
  whatsapp_business_phone?: string | null
  whatsapp_api_key?: string | null
  whatsapp_api_url?: string | null
}

export default function CompanySettingsPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [config, setConfig] = useState<CompanyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadConfig()
    }
  }, [status, router])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/company-config')
      if (!response.ok) throw new Error('Error al cargar configuración')
      const data = await response.json()
      setConfig(data)
      
      // Obtener URL firmada del logo si existe
      if (data.logo_url) {
        const logoResponse = await fetch('/api/company-config/logo')
        if (logoResponse.ok) {
          const logoData = await logoResponse.json()
          setLogoPreview(logoData.logo_url)
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/company-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!response.ok) throw new Error('Error al guardar')

      const updated = await response.json()
      setConfig(updated)
      toast.success('Configuración guardada correctamente')
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.')
      return
    }

    setUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/company-config/upload-logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Error al subir logo')

      const data = await response.json()
      setConfig(data.config)
      
      // Obtener URL firmada del logo recién subido
      const logoResponse = await fetch('/api/company-config/logo')
      if (logoResponse.ok) {
        const logoData = await logoResponse.json()
        setLogoPreview(logoData.logo_url)
      }
      
      toast.success('Logo subido correctamente')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    setUploadingLogo(true)
    try {
      const response = await fetch('/api/company-config/upload-logo', {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar logo')

      const data = await response.json()
      setConfig(data.config)
      setLogoPreview(null)
      toast.success('Logo eliminado correctamente')
    } catch (error) {
      console.error('Error removing logo:', error)
      toast.error('Error al eliminar el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Empresa</h1>
          <p className="text-gray-500 mt-1">
            Personaliza los datos de tu empresa que aparecerán en facturas y documentos
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Logo de la Empresa
          </CardTitle>
          <CardDescription>
            Sube el logo que aparecerá en todas las facturas y documentos (PNG, JPG, GIF, WEBP - máx 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {logoPreview ? (
              <div className="relative group">
                <img
                  src={logoPreview}
                  alt="Logo empresa"
                  className="w-48 h-auto max-h-32 object-contain border-2 border-gray-200 rounded-lg p-2"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploadingLogo}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                Sin logo
              </div>
            )}

            <div>
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              <Button
                onClick={() => document.getElementById('logo-upload')?.click()}
                variant="outline"
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Formatos: PNG, JPG, GIF, WEBP<br />
                Tamaño máximo: 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Nombre de la Empresa *</Label>
              <Input
                id="company_name"
                value={config.company_name}
                onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                placeholder="Ej: Alquilo Scooter"
              />
            </div>
            <div>
              <Label htmlFor="company_nif">NIF/CIF *</Label>
              <Input
                id="company_nif"
                value={config.company_nif}
                onChange={(e) => setConfig({ ...config, company_nif: e.target.value })}
                placeholder="Ej: B12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="company_email"
                type="email"
                value={config.company_email}
                onChange={(e) => setConfig({ ...config, company_email: e.target.value })}
                placeholder="info@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="company_phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono *
              </Label>
              <Input
                id="company_phone"
                value={config.company_phone}
                onChange={(e) => setConfig({ ...config, company_phone: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company_address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección *
            </Label>
            <Input
              id="company_address"
              value={config.company_address}
              onChange={(e) => setConfig({ ...config, company_address: e.target.value })}
              placeholder="Calle Ejemplo 123"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_city">Ciudad y Código Postal *</Label>
              <Input
                id="company_city"
                value={config.company_city}
                onChange={(e) => setConfig({ ...config, company_city: e.target.value })}
                placeholder="Málaga, 29001"
              />
            </div>
            <div>
              <Label htmlFor="company_website">Sitio Web (opcional)</Label>
              <Input
                id="company_website"
                value={config.company_website || ''}
                onChange={(e) => setConfig({ ...config, company_website: e.target.value })}
                placeholder="https://www.empresa.com"
              />
            </div>
          </div>

          {/* Configuración SMTP para envío de emails */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-base font-medium mb-1">Configuración de Email (SMTP)</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Necesario para envío automático de emails (contratos, reseñas, etc.)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">Servidor SMTP *</Label>
                    <Input
                      id="smtp_host"
                      value={(config as any).smtp_host || ''}
                      onChange={(e) => setConfig({ ...config, smtp_host: e.target.value } as any)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">Puerto SMTP</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={(config as any).smtp_port || 587}
                      onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 } as any)}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_user">Usuario SMTP *</Label>
                    <Input
                      id="smtp_user"
                      value={(config as any).smtp_user || ''}
                      onChange={(e) => setConfig({ ...config, smtp_user: e.target.value } as any)}
                      placeholder="tu-email@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_password">Contraseña SMTP *</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={(config as any).smtp_password || ''}
                      onChange={(e) => setConfig({ ...config, smtp_password: e.target.value } as any)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_from_name">Nombre del remitente</Label>
                    <Input
                      id="smtp_from_name"
                      value={(config as any).smtp_from_name || ''}
                      onChange={(e) => setConfig({ ...config, smtp_from_name: e.target.value } as any)}
                      placeholder={config.company_name}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_from_email">Email del remitente</Label>
                    <Input
                      id="smtp_from_email"
                      value={(config as any).smtp_from_email || ''}
                      onChange={(e) => setConfig({ ...config, smtp_from_email: e.target.value } as any)}
                      placeholder={config.company_email}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración WhatsApp Business API */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium mb-1">WhatsApp Business API (opcional)</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Canal principal para envío de solicitudes de reseñas automáticas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp_business_phone">Número de WhatsApp Business</Label>
                    <Input
                      id="whatsapp_business_phone"
                      value={(config as any).whatsapp_business_phone || ''}
                      onChange={(e) => setConfig({ ...config, whatsapp_business_phone: e.target.value } as any)}
                      placeholder="+34600123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp_api_key">API Key de WhatsApp</Label>
                    <Input
                      id="whatsapp_api_key"
                      type="password"
                      value={(config as any).whatsapp_api_key || ''}
                      onChange={(e) => setConfig({ ...config, whatsapp_api_key: e.target.value } as any)}
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="whatsapp_api_url">URL del API de WhatsApp</Label>
                    <Input
                      id="whatsapp_api_url"
                      value={(config as any).whatsapp_api_url || ''}
                      onChange={(e) => setConfig({ ...config, whatsapp_api_url: e.target.value } as any)}
                      placeholder="https://api.whatsapp.com/send"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Google Reviews */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </div>
              <div className="flex-1">
                <Label htmlFor="google_review_link" className="text-base font-medium">
                  Enlace de Reseñas (Opinas.es/Google) *
                </Label>
                <p className="text-sm text-gray-500 mt-1 mb-3">
                  Se enviará automáticamente por WhatsApp/Email cuando un cliente complete su reserva.
                  Filtra reseñas negativas antes de dirigir a Google Reviews.
                </p>
                <Input
                  id="google_review_link"
                  value={config.google_review_link || ''}
                  onChange={(e) => setConfig({ ...config, google_review_link: e.target.value })}
                  placeholder="https://opinas.es/alquiloscootermarbel"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Ejemplo:</strong> https://opinas.es/alquiloscootermarbel (filtra antes de Google)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Configuración de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="factura_prefix">Prefijo Facturas</Label>
              <Input
                id="factura_prefix"
                value={config.factura_prefix}
                onChange={(e) => setConfig({ ...config, factura_prefix: e.target.value })}
                placeholder="FACT"
              />
              <p className="text-xs text-gray-500 mt-1">Ej: FACT-2025-0001</p>
            </div>
            <div>
              <Label htmlFor="ticket_prefix">Prefijo Tickets</Label>
              <Input
                id="ticket_prefix"
                value={config.ticket_prefix}
                onChange={(e) => setConfig({ ...config, ticket_prefix: e.target.value })}
                placeholder="TICK"
              />
              <p className="text-xs text-gray-500 mt-1">Ej: TICK-2025-0001</p>
            </div>
            <div>
              <Label htmlFor="factura_series">Serie Actual</Label>
              <Input
                id="factura_series"
                value={config.factura_series}
                onChange={(e) => setConfig({ ...config, factura_series: e.target.value })}
                placeholder="2025"
              />
              <p className="text-xs text-gray-500 mt-1">Año de la serie</p>
            </div>
          </div>

          <div>
            <Label htmlFor="iva_rate">Tipo de IVA (%)</Label>
            <Input
              id="iva_rate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={config.iva_rate}
              onChange={(e) => setConfig({ ...config, iva_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor decimal: 0.21 = 21%, 0.10 = 10%, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Información Bancaria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Información Bancaria (opcional)
          </CardTitle>
          <CardDescription>
            Aparecerá en las facturas para transferencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bank_name">Nombre del Banco</Label>
            <Input
              id="bank_name"
              value={config.bank_name || ''}
              onChange={(e) => setConfig({ ...config, bank_name: e.target.value })}
              placeholder="Ej: Banco Santander"
            />
          </div>
          <div>
            <Label htmlFor="bank_iban">IBAN</Label>
            <Input
              id="bank_iban"
              value={config.bank_iban || ''}
              onChange={(e) => setConfig({ ...config, bank_iban: e.target.value })}
              placeholder="ES00 0000 0000 0000 0000 0000"
            />
          </div>
          <div>
            <Label htmlFor="bank_swift">SWIFT/BIC</Label>
            <Input
              id="bank_swift"
              value={config.bank_swift || ''}
              onChange={(e) => setConfig({ ...config, bank_swift: e.target.value })}
              placeholder="BSCHESMMXXX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personalización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Colores del Branding
          </CardTitle>
          <CardDescription>
            Personaliza los colores que aparecerán en tus documentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_color">Color Principal</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary_color">Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={config.secondary_color}
                  onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  placeholder="#1e40af"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Textos Personalizables */}
      <Card>
        <CardHeader>
          <CardTitle>Textos de Facturas</CardTitle>
          <CardDescription>
            Personaliza los textos que aparecen en el pie de tus facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invoice_footer_text">Texto del Pie de Factura</Label>
            <Textarea
              id="invoice_footer_text"
              value={config.invoice_footer_text || ''}
              onChange={(e) => setConfig({ ...config, invoice_footer_text: e.target.value })}
              placeholder="Gracias por confiar en nosotros..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="terms_and_conditions">Términos y Condiciones (opcional)</Label>
            <Textarea
              id="terms_and_conditions"
              value={config.terms_and_conditions || ''}
              onChange={(e) => setConfig({ ...config, terms_and_conditions: e.target.value })}
              placeholder="Condiciones generales de alquiler..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar flotante */}
      <div className="sticky bottom-4 flex justify-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Guardar Todos los Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
