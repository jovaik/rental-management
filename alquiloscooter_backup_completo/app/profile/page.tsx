
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { data: session, update } = useSession() || {};
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }

      await update({ ...session, user: { ...session?.user, name } });
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos de contraseña son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cambiar contraseña');
      }

      toast.success('Contraseña cambiada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'operator':
        return 'bg-green-100 text-green-800';
      case 'technician':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      super_admin: 'Super Administrador',
      admin: 'Administrador',
      operator: 'Operador',
      technician: 'Técnico',
    };
    return roleNames[role] || role;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          Administra tu información personal y contraseña
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu nombre y visualiza tu información de cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El correo electrónico no se puede cambiar
              </p>
            </div>

            <div>
              <Label>Rol del Sistema</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Shield className="w-4 h-4 text-gray-400" />
                <Badge className={getRoleBadgeColor(session?.user?.role || 'user')}>
                  {getRoleName(session?.user?.role || 'user')}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Tu contraseña actual"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu nueva contraseña"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={loading}
              className="w-full"
              variant="secondary"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
