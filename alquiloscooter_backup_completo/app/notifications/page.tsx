
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Car, Wrench, Calendar, X, ArrowLeft } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface Notification {
  id: number;
  type: 'warning' | 'info' | 'success' | 'urgent';
  title: string;
  message: string;
  category: string;
  created_at: Date;
  is_read: boolean;
  action_required: boolean;
  vehicle?: {
    registration_number: string;
    make: string;
    model: string;
  };
}

export default function NotificationsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadNotifications();
    }
  }, [mounted]);

  const handleFilterChange = (newFilter: 'all' | 'unread' | 'urgent') => {
    setFilter(newFilter);
  };

  const handleMarkAsReadClick = (notificationId: number) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsReadClick = () => {
    markAllAsRead();
  };

  const handleDismissClick = (notificationId: number) => {
    dismissNotification(notificationId);
  };

  const loadNotifications = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Simular delay de API para testing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Cargar notificaciones del localStorage si existen
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        const withDates = parsed.map((n: any) => ({
          ...n,
          created_at: new Date(n.created_at)
        }));
        setNotifications(withDates);
      } else {
        // No hay notificaciones, inicializar vacío
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: number) => {
    const updatedNotifications = notifications.map(notif => 
      notif.id === id ? { ...notif, is_read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Disparar evento para actualizar el contador en el header
    window.dispatchEvent(new Event('notificationsUpdated'));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, is_read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Disparar evento para actualizar el contador en el header
    window.dispatchEvent(new Event('notificationsUpdated'));
  };

  const dismissNotification = (id: number) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Disparar evento para actualizar el contador en el header
    window.dispatchEvent(new Event('notificationsUpdated'));
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread': return !notif.is_read;
      case 'urgent': return notif.type === 'urgent' || notif.action_required;
      default: return true;
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'warning': return Clock;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'mantenimiento': return Wrench;
      case 'reservas': return Calendar;
      default: return Car;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => n.type === 'urgent' || n.action_required).length;

  // No renderizar hasta que esté montado para evitar errores de hidración
  if (!mounted || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <Bell className="h-7 w-7 text-blue-600" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Mantente al día con alertas y actualizaciones importantes
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Leer</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('all')}
        >
          Todas ({notifications.length})
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('unread')}
        >
          Sin leer ({unreadCount})
        </Button>
        <Button 
          variant={filter === 'urgent' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('urgent')}
        >
          Urgentes ({urgentCount})
        </Button>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No tienes notificaciones en este momento'
                  : `No hay notificaciones ${filter === 'unread' ? 'sin leer' : 'urgentes'}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type);
            const CategoryIcon = getCategoryIcon(notification.category);
            
            return (
              <Card 
                key={notification.id} 
                className={`border-l-4 transition-all hover:shadow-md ${getTypeColor(notification.type)} ${
                  !notification.is_read ? 'ring-1 ring-blue-100' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className={`p-2 rounded-full ${notification.type === 'urgent' ? 'bg-red-100' : 
                        notification.type === 'warning' ? 'bg-orange-100' :
                        notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <TypeIcon className={`h-5 w-5 ${
                          notification.type === 'urgent' ? 'text-red-600' :
                          notification.type === 'warning' ? 'text-orange-600' :
                          notification.type === 'success' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CategoryIcon className="h-3 w-3" />
                            {notification.category}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {notification.message}
                        </p>
                        
                        {notification.vehicle && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Car className="h-4 w-4" />
                            <span>
                              {notification.vehicle?.registration_number || 'N/A'} - {notification.vehicle?.make || ''} {notification.vehicle?.model || ''}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatRelativeTime(notification.created_at)}</span>
                            {notification.action_required && (
                              <Badge variant="destructive" className="text-xs">
                                Acción requerida
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Marcar como leída
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => dismissNotification(notification.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
