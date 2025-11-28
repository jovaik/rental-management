
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut, Home, ShieldCheck, Shield, ArrowLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLE_PERMISSIONS, UserRole } from '@/lib/types';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === '/dashboard';
  const [unreadCount, setUnreadCount] = useState(0);
  const [companyLogo] = useState<string>('/alquiloscooter-logo.png');
  const [companyName, setCompanyName] = useState<string>('Alquiloscooter');

  // Páginas que necesitan botón de "volver atrás"
  const pagesWithBackButton = ['/planning', '/pricing', '/customers', '/settings', '/users', '/comisiones', '/afiliados/registro', '/referrals', '/afiliados', '/rentabilidad', '/business-config', '/gscontrol-integration'];
  const showBackButton = pagesWithBackButton.includes(pathname);

  // Cargar configuración de la empresa
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const configResponse = await fetch('/api/company-config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          setCompanyName(config.company_name || 'Alquiloscooter');
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };

    loadCompanyInfo();
  }, []);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    const loadUnreadCount = () => {
      const notifications = localStorage.getItem('notifications');
      if (notifications) {
        const parsed = JSON.parse(notifications);
        const unread = parsed.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    };

    loadUnreadCount();

    // Actualizar cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);

    // Escuchar eventos de actualización de notificaciones
    window.addEventListener('notificationsUpdated', loadUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', loadUnreadCount);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'operator':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'technician':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleName = (role: string) => {
    return ROLE_PERMISSIONS[role as UserRole]?.name || role;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-2">
          {/* Botón de menú para móvil */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo de la empresa */}
          <div className="relative h-16 w-auto flex items-center">
            <Image
              src={companyLogo}
              alt={companyName}
              height={64}
              width={320}
              className="object-contain h-16 w-auto"
              priority
              style={{ maxWidth: '320px', height: '64px' }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isDashboard && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          )}
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                </>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <Badge 
                    className={`${getRoleBadgeColor(session?.user?.role || 'user')} text-xs px-1.5 py-0`} 
                    variant="secondary"
                  >
                    {getRoleName(session?.user?.role || 'user')}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || session?.user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="cursor-default">
                <Shield className="mr-2 h-4 w-4" />
                <span className="mr-2">Rol:</span>
                <Badge className={getRoleBadgeColor(session?.user?.role || 'user')} variant="secondary">
                  {getRoleName(session?.user?.role || 'user')}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
