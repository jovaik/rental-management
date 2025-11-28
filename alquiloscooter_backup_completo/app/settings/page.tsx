
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RoleGuard } from '@/components/auth/role-guard';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Smartphone,
  Save,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Building2,
  ArrowRight
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <SettingsPageContent />
    </RoleGuard>
  );
}

function SettingsPageContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Estados para configuración
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    role: session?.user?.role || 'user',
    phone: '',
    company: '',
    bio: ''
  });

  const [notifications, setNotifications] = useState({
    email_maintenance: true,
    email_bookings: true,
    email_reports: false,
    sms_urgent: true,
    sms_reminders: false,
    push_all: true
  });

  const [systemSettings, setSystemSettings] = useState({
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    dateFormat: 'DD/MM/YYYY',
    language: 'es',
    maintenance_reminder_days: 7,
    booking_confirmation_auto: true,
    backup_frequency: 'daily'
  });

  const [security, setSecurity] = useState({
    two_factor_enabled: false,
    session_timeout: 60,
    password_expiry: 90,
    failed_login_attempts: 5
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemUpdate = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-7 w-7 text-blue-600" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-1">
            Personaliza tu experiencia y configura las preferencias del sistema
          </p>
        </div>
        {saved && (
          <Badge className="bg-green-100 text-green-800">
            <Save className="mr-1 h-3 w-3" />
            Configuración guardada
          </Badge>
        )}
      </div>

      {/* Acceso rápido a configuración de empresa */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Configuración de Empresa
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Personaliza el logo, datos fiscales, información bancaria y colores de branding
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Logo de la empresa en facturas y documentos</li>
                  <li>• Datos fiscales (NIF, dirección, contacto)</li>
                  <li>• Configuración de prefijos de facturas y tickets</li>
                  <li>• Información bancaria para transferencias</li>
                  <li>• Personalización de colores del branding</li>
                </ul>
              </div>
            </div>
            <Button
              onClick={() => router.push('/settings/company')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Configurar Empresa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil de Usuario */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil de Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+34 600 123 456"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleProfileUpdate} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Configuración de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferencias de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notificaciones por Email
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_maintenance">Mantenimientos</Label>
                      <p className="text-sm text-gray-500">Alertas de mantenimiento vencido o próximo</p>
                    </div>
                    <Switch
                      id="email_maintenance"
                      checked={notifications.email_maintenance}
                      onCheckedChange={(checked) => setNotifications({...notifications, email_maintenance: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_bookings">Reservas</Label>
                      <p className="text-sm text-gray-500">Nuevas reservas y modificaciones</p>
                    </div>
                    <Switch
                      id="email_bookings"
                      checked={notifications.email_bookings}
                      onCheckedChange={(checked) => setNotifications({...notifications, email_bookings: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_reports">Reportes semanales</Label>
                      <p className="text-sm text-gray-500">Resumen semanal de actividad</p>
                    </div>
                    <Switch
                      id="email_reports"
                      checked={notifications.email_reports}
                      onCheckedChange={(checked) => setNotifications({...notifications, email_reports: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Notificaciones SMS
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_urgent">Solo urgentes</Label>
                      <p className="text-sm text-gray-500">Alertas críticas únicamente</p>
                    </div>
                    <Switch
                      id="sms_urgent"
                      checked={notifications.sms_urgent}
                      onCheckedChange={(checked) => setNotifications({...notifications, sms_urgent: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_reminders">Recordatorios</Label>
                      <p className="text-sm text-gray-500">Recordatorios de tareas pendientes</p>
                    </div>
                    <Switch
                      id="sms_reminders"
                      checked={notifications.sms_reminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, sms_reminders: checked})}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleNotificationUpdate} 
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Notificaciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Información del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Versión</Label>
                <p className="text-sm text-gray-600">v1.0.0 (Fase 1)</p>
              </div>
              <div>
                <Label>Último backup</Label>
                <p className="text-sm text-gray-600">Hace 2 horas</p>
              </div>
              <div>
                <Label>Usuarios activos</Label>
                <p className="text-sm text-gray-600">3 usuarios</p>
              </div>
              <div>
                <Label>Vehículos registrados</Label>
                <p className="text-sm text-gray-600">5 vehículos</p>
              </div>
            </CardContent>
          </Card>

          {/* Configuración del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select value={systemSettings.currency} onValueChange={(value) => setSystemSettings({...systemSettings, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                    <SelectItem value="GBP">Libra (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings({...systemSettings, language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reminder_days">Días de aviso mantenimiento</Label>
                <Input
                  id="reminder_days"
                  type="number"
                  value={systemSettings.maintenance_reminder_days}
                  onChange={(e) => setSystemSettings({...systemSettings, maintenance_reminder_days: parseInt(e.target.value)})}
                />
              </div>
              <Button 
                onClick={handleSystemUpdate} 
                disabled={loading}
                variant="outline" 
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autenticación 2FA</Label>
                  <p className="text-xs text-gray-500">Factor de autenticación adicional</p>
                </div>
                <Switch
                  checked={security.two_factor_enabled}
                  onCheckedChange={(checked) => setSecurity({...security, two_factor_enabled: checked})}
                />
              </div>
              <div>
                <Label htmlFor="session_timeout">Timeout de sesión (min)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={security.session_timeout}
                  onChange={(e) => setSecurity({...security, session_timeout: parseInt(e.target.value)})}
                />
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Cambio de contraseña</p>
                    <p>Se recomienda cambiar la contraseña cada 90 días</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSecurityUpdate} 
                disabled={loading}
                variant="outline" 
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Seguridad
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
