
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-center text-2xl">
            Acceso No Autorizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
          {session?.user?.role && (
            <p className="text-center text-sm text-gray-500">
              Tu rol actual es: <strong>{session.user.role}</strong>
            </p>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button 
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Ir al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
