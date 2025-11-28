import { requireAuth } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, CheckCircle, Wrench, XCircle, Calendar, TrendingUp, Users, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { ItemStatus, BookingStatus, InvoiceStatus } from '@prisma/client';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireAuth();
  const tenant = await getTenantFromHeaders();
  
  if (!tenant) {
    return <div>Tenant no encontrado</div>;
  }
  
  const tenantId = tenant.id;

  // Obtener estadísticas de items
  const [totalItems, availableItems, rentedItems, maintenanceItems, unavailableItems] =
    await Promise.all([
      prisma.item.count({
        where: { tenantId },
      }),
      prisma.item.count({
        where: { tenantId, status: ItemStatus.AVAILABLE },
      }),
      prisma.item.count({
        where: { tenantId, status: ItemStatus.RENTED },
      }),
      prisma.item.count({
        where: { tenantId, status: ItemStatus.MAINTENANCE },
      }),
      prisma.item.count({
        where: { tenantId, status: ItemStatus.UNAVAILABLE },
      }),
    ]);

  // Obtener estadísticas de reservas
  const [totalBookings, pendingBookings, confirmedBookings, inProgressBookings, completedBookings] =
    await Promise.all([
      prisma.booking.count({
        where: { tenantId },
      }),
      prisma.booking.count({
        where: { tenantId, status: BookingStatus.PENDING },
      }),
      prisma.booking.count({
        where: { tenantId, status: BookingStatus.CONFIRMED },
      }),
      prisma.booking.count({
        where: { tenantId, status: BookingStatus.IN_PROGRESS },
      }),
      prisma.booking.count({
        where: { tenantId, status: BookingStatus.COMPLETED },
      }),
    ]);

  // Obtener estadísticas de facturas
  const allInvoices = await prisma.invoice.findMany({
    where: { tenantId },
    select: {
      amount: true,
      status: true,
    },
  });

  const totalInvoices = allInvoices.length;
  const paidInvoices = allInvoices.filter((i) => i.status === InvoiceStatus.PAID).length;
  const pendingInvoices = allInvoices.filter((i) => i.status === InvoiceStatus.PENDING).length;

  const totalRevenue = allInvoices
    .filter((i) => i.status === InvoiceStatus.PAID)
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingRevenue = allInvoices
    .filter((i) => i.status === InvoiceStatus.PENDING)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalAmount = allInvoices.reduce((sum, i) => sum + i.amount, 0);

  // Obtener estadísticas de clientes
  const totalCustomers = await prisma.customer.count({
    where: { tenantId },
  });

  // Obtener próximas reservas (próximos 7 días)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      tenantId,
      startDate: {
        gte: today,
        lte: nextWeek,
      },
      status: {
        notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
      },
    },
    include: {
      Item: {
        select: {
          name: true,
          photos: true,
        },
      },
      Customer: {
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
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Obtener últimas facturas generadas
  const recentInvoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: {
      Booking: {
        include: {
          Customer: {
            select: {
              name: true,
            },
          },
          Item: {
            select: {
              name: true,
            },
          },
        },
      },
    },
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
      title: 'Ingresos Totales',
      value: `€${totalAmount.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isRevenue: true,
      subtitle: `${totalInvoices} facturas`,
    },
    {
      title: 'Ingresos Pagados',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isRevenue: true,
      subtitle: `${paidInvoices} facturas`,
    },
    {
      title: 'Ingresos Pendientes',
      value: `€${pendingRevenue.toFixed(2)}`,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      isRevenue: true,
      subtitle: `${pendingInvoices} facturas`,
    },
    {
      title: 'Total Clientes',
      value: totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isRevenue: false,
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
          <h2 className="text-xl font-semibold mb-4">Finanzas y Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.subtitle}
                      </p>
                    )}
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
                          {booking.Item.photos && booking.Item.photos.length > 0 ? (
                            <img
                              src={booking.Item.photos[0]}
                              alt={booking.Item.name}
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
                            {booking.Item.name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {booking.Customer.name}
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

        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Últimas Facturas Generadas</CardTitle>
              <Link href="/invoices">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        invoice.status === InvoiceStatus.PAID
                          ? 'bg-green-50'
                          : invoice.status === InvoiceStatus.PENDING
                          ? 'bg-yellow-50'
                          : 'bg-gray-50'
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          invoice.status === InvoiceStatus.PAID
                            ? 'text-green-600'
                            : invoice.status === InvoiceStatus.PENDING
                            ? 'text-yellow-600'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {invoice.Booking.Customer.name} - {invoice.Booking.Item.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        €{invoice.amount.toFixed(2)}
                      </p>
                      <div className="mt-1">
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Gestiona tu inventario de items
              </p>
              <div className="flex gap-2">
                <Link href="/items">
                  <Button variant="outline" size="sm">Ver Items</Button>
                </Link>
                <Link href="/items/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reservas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Crea y gestiona reservas
              </p>
              <div className="flex gap-2">
                <Link href="/bookings">
                  <Button variant="outline" size="sm">Ver Reservas</Button>
                </Link>
                <Link href="/bookings/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Gestiona tu base de clientes
              </p>
              <div className="flex gap-2">
                <Link href="/customers">
                  <Button variant="outline" size="sm">Ver Clientes</Button>
                </Link>
                <Link href="/customers/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Gestiona tus facturas
              </p>
              <div className="flex gap-2">
                <Link href="/invoices">
                  <Button variant="outline" size="sm">Ver Facturas</Button>
                </Link>
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
