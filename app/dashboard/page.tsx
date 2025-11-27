import { requireAuth } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, CheckCircle, Wrench, XCircle, Calendar, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { ItemStatus, BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireAuth();
  const tenantId = await getTenantFromHeaders();

  // Obtener estadísticas de items
  const [totalItems, availableItems, rentedItems, maintenanceItems, unavailableItems] =
    await Promise.all([
      prisma.item.count({
        where: { tenantId: tenantId! },
      }),
      prisma.item.count({
        where: { tenantId: tenantId!, status: ItemStatus.AVAILABLE },
      }),
      prisma.item.count({
        where: { tenantId: tenantId!, status: ItemStatus.RENTED },
      }),
      prisma.item.count({
        where: { tenantId: tenantId!, status: ItemStatus.MAINTENANCE },
      }),
      prisma.item.count({
        where: { tenantId: tenantId!, status: ItemStatus.UNAVAILABLE },
      }),
    ]);

  // Obtener estadísticas de reservas
  const [totalBookings, pendingBookings, confirmedBookings, inProgressBookings, completedBookings] =
    await Promise.all([
      prisma.booking.count({
        where: { tenantId: tenantId! },
      }),
      prisma.booking.count({
        where: { tenantId: tenantId!, status: BookingStatus.PENDING },
      }),
      prisma.booking.count({
        where: { tenantId: tenantId!, status: BookingStatus.CONFIRMED },
      }),
      prisma.booking.count({
        where: { tenantId: tenantId!, status: BookingStatus.IN_PROGRESS },
      }),
      prisma.booking.count({
        where: { tenantId: tenantId!, status: BookingStatus.COMPLETED },
      }),
    ]);

  // Calcular ingresos totales y pendientes
  const allBookings = await prisma.booking.findMany({
    where: { tenantId: tenantId! },
    select: {
      totalPrice: true,
      status: true,
    },
  });

  const totalRevenue = allBookings
    .filter((b) => b.status === BookingStatus.COMPLETED)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingRevenue = allBookings
    .filter((b) => [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(b.status))
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Obtener próximas reservas (próximos 7 días)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      tenantId: tenantId!,
      startDate: {
        gte: today,
        lte: nextWeek,
      },
      status: {
        notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
      },
    },
    include: {
      item: {
        select: {
          name: true,
          photos: true,
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: 5,
  });

  // Obtener últimos items añadidos
  const recentItems = await prisma.item.findMany({
    where: { tenantId: tenantId! },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const itemStats = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Disponibles',
      value: availableItems,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Alquilados',
      value: rentedItems,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Mantenimiento',
      value: maintenanceItems,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'No Disponibles',
      value: unavailableItems,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const bookingStats = [
    {
      title: 'Total Reservas',
      value: totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pendientes',
      value: pendingBookings,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Confirmadas',
      value: confirmedBookings,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'En Progreso',
      value: inProgressBookings,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completadas',
      value: completedBookings,
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  const revenueStats = [
    {
      title: 'Ingresos Completados',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isRevenue: true,
    },
    {
      title: 'Ingresos Pendientes',
      value: `€${pendingRevenue.toFixed(2)}`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isRevenue: true,
    },
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {session.user.name || session.user.email}
            </p>
          </div>
          <Link href="/items/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Añadir Item
            </Button>
          </Link>
        </div>

        {/* Items Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {itemStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Bookings Stats Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Reservas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {bookingStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Ingresos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {revenueStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Próximas Reservas (7 días)</CardTitle>
              <Link href="/bookings">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const formatDate = (date: Date) => {
                    return new Date(date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  };
                  
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {booking.item.photos && booking.item.photos.length > 0 ? (
                            <img
                              src={booking.item.photos[0]}
                              alt={booking.item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Calendar className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/bookings/${booking.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {booking.item.name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {booking.customer.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.startDate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          €{booking.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Gestiona tu inventario de items de forma eficiente
              </p>
              <div className="flex gap-2">
                <Link href="/items">
                  <Button variant="outline">Ver Items</Button>
                </Link>
                <Link href="/items/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Item
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Reservas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Crea y gestiona reservas de tus items
              </p>
              <div className="flex gap-2">
                <Link href="/bookings">
                  <Button variant="outline">Ver Reservas</Button>
                </Link>
                <Link href="/bookings/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Reserva
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Rol:</span>{' '}
                  <strong>{session.user.role}</strong>
                </div>
                <div>
                  <span className="text-gray-600">Tenant ID:</span>{' '}
                  <strong className="font-mono text-xs">
                    {session.user.tenant_id}
                  </strong>
                </div>
              </div>
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  Sistema multi-tenant funcionando correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Últimos Items Añadidos</CardTitle>
              <Link href="/items">
                <Button variant="outline" size="sm">
                  Ver Todos
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {item.photos && item.photos.length > 0 ? (
                          <img
                            src={item.photos[0]}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/items/${item.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          €{item.basePrice.toFixed(2)}/día
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === ItemStatus.AVAILABLE
                            ? 'bg-green-100 text-green-800'
                            : item.status === ItemStatus.RENTED
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === ItemStatus.MAINTENANCE
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
