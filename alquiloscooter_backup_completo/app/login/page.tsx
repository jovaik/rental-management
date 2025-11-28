
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Lock, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas. Por favor, intenta de nuevo.');
        return;
      }

      // Wait for session to be established
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
        router.refresh();
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/alquiloscooter-logo.png" 
              alt="Alquiloscooter" 
              className="h-32 w-auto object-contain"
            />
          </div>
          <p className="text-lg font-medium" style={{ color: '#FF5555' }}>
            Alquiler de motos y scooters en corta y larga temporada
          </p>
        </div>

        <Card className="shadow-lg border-2 border-orange-500">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('email', {
                      required: 'El email es obligatorio',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors?.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                    type="password"
                    placeholder="Tu contraseña"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors?.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <p>Acceso para personal autorizado únicamente</p>
                <p className="mt-2">
                  Sistema de gestión profesional de vehículos de alquiler
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Alquiloscooter. Todos los derechos reservados.</p>
          <p className="mt-2">
            <span className="font-medium">Powered by </span>
            <a 
              href="https://d-d4u.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-orange-600 hover:underline"
            >
              D&D4U
            </a>
            <span className="text-xs block sm:inline sm:ml-1">
              (Development and designed for you)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
