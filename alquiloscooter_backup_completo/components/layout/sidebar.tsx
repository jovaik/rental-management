
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Car, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings, 
  FileText, 
  Bell,
  BarChart3,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  UserCheck,
  BarChart2,
  Tag,
  Shield,
  CalendarCheck,
  Package,
  ChevronDown,
  Receipt,
  X,
  TrendingUp,
  Share2,
  Menu,
  Navigation,
  Building2,
  RefreshCw
} from 'lucide-react';

import { UserRole } from '@/lib/types';

interface SubMenuItem {
  title: string;
  href: string;
  icon: any;
  roles: UserRole[];
}

interface MenuItem {
  title: string;
  href?: string;
  icon: any;
  roles: UserRole[];
  submenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'admin', 'propietario', 'colaborador', 'operador', 'taller']
  },
  {
    title: 'Planificación',
    href: '/planning',
    icon: BarChart2,
    roles: ['super_admin', 'admin', 'operador']
  },
  {
    title: 'Calendario',
    href: '/calendar',
    icon: Calendar,
    roles: ['super_admin', 'admin', 'operador']
  },
  {
    title: 'Reservas',
    icon: CalendarCheck,
    roles: ['super_admin', 'admin', 'operador'],
    submenu: [
      {
        title: 'Gestionar Reservas',
        href: '/bookings',
        icon: CalendarCheck,
        roles: ['super_admin', 'admin', 'operador']
      },
      {
        title: 'Motor Público',
        href: '/booking-widget',
        icon: Share2,
        roles: ['super_admin', 'admin']
      }
    ]
  },
  {
    title: 'Vehículos',
    icon: Car,
    roles: ['super_admin', 'admin', 'propietario', 'colaborador', 'operador', 'taller'],
    submenu: [
      {
        title: 'Ver vehículos',
        href: '/vehicles',
        icon: Car,
        roles: ['super_admin', 'admin', 'propietario', 'colaborador', 'operador', 'taller']
      },
      {
        title: 'Tracking GPS',
        href: '/gps',
        icon: Navigation,
        roles: ['super_admin', 'admin', 'propietario', 'colaborador', 'operador']
      },
      {
        title: 'Mantenimiento',
        href: '/maintenance',
        icon: Wrench,
        roles: ['super_admin', 'admin', 'propietario', 'colaborador', 'taller']
      },
      {
        title: 'Catálogo Repuestos',
        href: '/spare-parts',
        icon: Package,
        roles: ['super_admin', 'admin', 'taller']
      },
      {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Building2,
        roles: ['super_admin', 'admin', 'taller']
      },
      {
        title: 'Manual Operativo',
        href: '/manuales/MANUAL_ROL_TALLER_simple.pdf',
        icon: FileText,
        roles: ['taller']
      },
      {
        title: 'Tarifas',
        href: '/pricing',
        icon: Tag,
        roles: ['super_admin', 'admin']
      },
      {
        title: 'Ubicaciones',
        href: '/locations',
        icon: MapPin,
        roles: ['super_admin', 'admin']
      }
    ]
  },
  {
    title: 'Clientes',
    href: '/customers',
    icon: Users,
    roles: ['super_admin', 'admin', 'operador']
  },
  {
    title: 'Gastos',
    href: '/gastos',
    icon: DollarSign,
    roles: ['super_admin', 'admin', 'propietario', 'colaborador']
  },
  {
    title: 'Presupuestos',
    href: '/financiero/presupuestos',
    icon: TrendingUp,
    roles: ['super_admin', 'admin']
  },
  {
    title: 'Facturación',
    href: '/facturacion',
    icon: Receipt,
    roles: ['super_admin', 'admin']
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'propietario', 'colaborador']
  },
  {
    title: 'Documentos',
    href: '/documents',
    icon: FileText,
    roles: ['super_admin', 'admin', 'propietario', 'colaborador']
  },
  {
    title: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    roles: ['super_admin', 'admin', 'operador']
  },
  {
    title: 'Configuración',
    icon: Settings,
    roles: ['super_admin', 'admin'],
    submenu: [
      {
        title: 'Empresa',
        href: '/settings/company',
        icon: Building2,
        roles: ['super_admin', 'admin']
      },
      {
        title: 'Sincronización GSControl',
        href: '/settings/gscontrol',
        icon: RefreshCw,
        roles: ['super_admin']
      }
    ]
  }
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  const userRole = session?.user?.role as UserRole;

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar menú SOLO en móvil al navegar
  useEffect(() => {
    // Solo cerrar si estamos en móvil Y el menú está abierto Y tenemos la función de cierre
    if (isMobile && mobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [pathname]); // Eliminar isMobile, mobileOpen, onMobileClose de las dependencias para evitar loops

  // Función para verificar si un item tiene al menos un subitem visible
  const hasVisibleSubmenu = (item: MenuItem) => {
    if (!item.submenu) return false;
    return item.submenu.some(subitem => userRole && subitem.roles.includes(userRole));
  };

  // Verificar si alguna ruta del submenú está activa
  const isSubmenuActive = (item: MenuItem) => {
    if (!item.submenu) return false;
    return item.submenu.some(subitem => pathname === subitem.href);
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobile 
            ? mobileOpen 
              ? 'translate-x-0 w-64' 
              : '-translate-x-full w-64'
            : collapsed 
              ? 'w-16' 
              : 'w-64'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-bold text-lg text-gray-900">Rental</h1>
                <p className="text-xs text-gray-500">Management</p>
              </div>
            </div>
          )}
          
          {/* Botón cerrar en móvil / colapsar en desktop */}
          {isMobile ? (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors hidden lg:block"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto mt-6 px-3">
        <div className="space-y-1 pb-6">
          {menuItems
            .filter((item) => {
              // Filtrar menús según el rol del usuario
              return userRole && item.roles.includes(userRole);
            })
            .map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && hasVisibleSubmenu(item);
              const isActive = item.href ? pathname === item.href : isSubmenuActive(item);
              
              // Si tiene submenú
              if (hasSubmenu) {
                return (
                  <div
                    key={item.title}
                    className="relative"
                    onMouseEnter={() => !collapsed && setOpenSubmenu(item.title)}
                    onMouseLeave={() => setOpenSubmenu(null)}
                  >
                    <div
                      className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer group ${
                        isActive 
                          ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                          : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} ${collapsed ? '' : 'mr-3'}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSubmenu === item.title ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    
                    {/* Submenú */}
                    {!collapsed && openSubmenu === item.title && item.submenu && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                        {item.submenu
                          .filter(subitem => userRole && subitem.roles.includes(userRole))
                          .map((subitem) => {
                            const SubIcon = subitem.icon;
                            const isSubActive = pathname === subitem.href;
                            const isPdf = subitem.href.endsWith('.pdf');
                            
                            if (isPdf) {
                              return (
                                <a
                                  key={subitem.href}
                                  href={subitem.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center px-3 py-2 text-sm rounded-lg transition-colors group text-gray-600 hover:text-primary hover:bg-primary/5"
                                >
                                  <SubIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary" />
                                  <span className="text-xs">{subitem.title}</span>
                                </a>
                              );
                            }
                            
                            return (
                              <Link
                                key={subitem.href}
                                href={subitem.href}
                                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                                  isSubActive 
                                    ? 'bg-primary/15 text-primary font-medium' 
                                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                                }`}
                              >
                                <SubIcon className={`h-4 w-4 mr-2 ${isSubActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                                <span className="text-xs">{subitem.title}</span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Si NO tiene submenú (item normal)
              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                    isActive 
                      ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          
          {/* Users Management - Solo para Super Admin */}
          {session?.user?.role === "super_admin" && (
            <>
              <div className="my-2 border-t border-gray-200"></div>
              <Link
                href="/users"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                  pathname === '/users'
                    ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <Shield className={`h-5 w-5 ${pathname === '/users' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && <span>Usuarios</span>}
              </Link>
            </>
          )}
          
          {/* Comisiones - Para Super Admin, Propietarios y Colaboradores */}
          {session?.user?.role && ["super_admin", "admin", "propietario", "colaborador"].includes(session.user.role) && (
            <>
              {session?.user?.role !== "super_admin" && <div className="my-2 border-t border-gray-200"></div>}
              
              {/* Menú Comisiones con submenús */}
              <div
                className="relative"
                onMouseEnter={() => !collapsed && setOpenSubmenu('Comisiones')}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <div
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer group ${
                    pathname === '/comisiones' || pathname === '/mis-vehiculos' || pathname.startsWith('/mis-vehiculos/') || pathname === '/admin/assign-vehicles'
                      ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center">
                    <DollarSign className={`h-5 w-5 ${pathname === '/comisiones' || pathname === '/mis-vehiculos' || pathname.startsWith('/mis-vehiculos/') || pathname === '/admin/assign-vehicles' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && <span>Comisiones</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSubmenu === 'Comisiones' ? 'rotate-180' : ''}`} />
                  )}
                </div>
                
                {/* Submenú de Comisiones */}
                {!collapsed && openSubmenu === 'Comisiones' && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                    {/* Resumen de Comisiones - Para todos */}
                    <Link
                      href="/comisiones"
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                        pathname === '/comisiones'
                          ? 'bg-primary/15 text-primary font-medium' 
                          : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <DollarSign className={`h-4 w-4 mr-2 ${pathname === '/comisiones' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                      <span className="text-xs">Resumen</span>
                    </Link>
                    
                    {/* Mis Vehículos - Solo para propietarios */}
                    {session?.user?.role === 'propietario' && (
                      <Link
                        href="/mis-vehiculos"
                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                          pathname === '/mis-vehiculos' || pathname.startsWith('/mis-vehiculos/')
                            ? 'bg-primary/15 text-primary font-medium' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <Car className={`h-4 w-4 mr-2 ${pathname === '/mis-vehiculos' || pathname.startsWith('/mis-vehiculos/') ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                        <span className="text-xs">Mis Vehículos</span>
                      </Link>
                    )}
                    
                    {/* Asignar Vehículos - Solo para super_admin/admin */}
                    {(session?.user?.role === 'super_admin' || session?.user?.role === 'admin') && (
                      <Link
                        href="/admin/assign-vehicles"
                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                          pathname === '/admin/assign-vehicles'
                            ? 'bg-primary/15 text-primary font-medium' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <UserCheck className={`h-4 w-4 mr-2 ${pathname === '/admin/assign-vehicles' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                        <span className="text-xs">Asignar Vehículos</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sistema de Afiliados - Menú con submenús */}
              <div
                className="relative"
                onMouseEnter={() => !collapsed && setOpenSubmenu('Afiliados')}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <div
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer group ${
                    pathname === '/referrals' || pathname === '/admin/affiliates'
                      ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center">
                    <Share2 className={`h-5 w-5 ${pathname === '/referrals' || pathname === '/admin/affiliates' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && <span>Afiliados</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSubmenu === 'Afiliados' ? 'rotate-180' : ''}`} />
                  )}
                </div>
                
                {/* Submenú de Afiliados */}
                {!collapsed && openSubmenu === 'Afiliados' && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                    <Link
                      href="/referrals"
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                        pathname === '/referrals'
                          ? 'bg-primary/15 text-primary font-medium' 
                          : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <Share2 className={`h-4 w-4 mr-2 ${pathname === '/referrals' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                      <span className="text-xs">Afiliados</span>
                    </Link>
                    
                    {session?.user?.role === 'super_admin' && (
                      <Link
                        href="/admin/affiliates"
                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors group ${
                          pathname === '/admin/affiliates'
                            ? 'bg-primary/15 text-primary font-medium' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <Users className={`h-4 w-4 mr-2 ${pathname === '/admin/affiliates' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                        <span className="text-xs">Gestión Afiliados</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>
      </aside>
    </>
  );
}
