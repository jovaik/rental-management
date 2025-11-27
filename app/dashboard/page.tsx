import { requireAuth } from '@/lib/auth';
import { getTenantFromHeaders } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, CheckCircle, Wrench, XCircle } from 'lucide-react';
import Link from 'next/link';
import { ItemStatus } from '@prisma/client';

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

  // Obtener últimos items añadidos
  const recentItems = await prisma.item.findMany({
    where: { tenantId: tenantId! },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const stats = [
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat) => {
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Sistema multi-tenant funcionando correctamente. Los datos están
                  aislados por tenant.
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
