import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ItemList } from '@/components/items/ItemList';
import { ItemType, ItemStatus } from '@prisma/client';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

interface PageProps {
  searchParams: {
    type?: string;
    status?: string;
    search?: string;
  };
}

export default async function ItemsPage({ searchParams }: PageProps) {
  const session = await requireAuth();
  const tenantId = session.user.tenant_id;

  // Build where clause
  const where: any = { tenantId };

  if (searchParams.type && Object.values(ItemType).includes(searchParams.type as ItemType)) {
    where.type = searchParams.type;
  }

  if (searchParams.status && Object.values(ItemStatus).includes(searchParams.status as ItemStatus)) {
    where.status = searchParams.status;
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  // Fetch items
  const items = await prisma.item.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Items</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your rental inventory
              </p>
            </div>
            <Link
              href="/items/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  defaultValue={searchParams.search}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name or description..."
                />
              </div>
            </div>

            {/* Type filter */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                id="type"
                defaultValue={searchParams.type || ''}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value={ItemType.VEHICLE}>Vehicle</option>
                <option value={ItemType.PROPERTY}>Property</option>
                <option value={ItemType.BOAT}>Boat</option>
                <option value={ItemType.EXPERIENCE}>Experience</option>
                <option value={ItemType.EQUIPMENT}>Equipment</option>
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                id="status"
                defaultValue={searchParams.status || ''}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value={ItemStatus.AVAILABLE}>Available</option>
                <option value={ItemStatus.RENTED}>Rented</option>
                <option value={ItemStatus.MAINTENANCE}>Maintenance</option>
                <option value={ItemStatus.UNAVAILABLE}>Unavailable</option>
              </select>
            </div>

            {/* Submit button */}
            <div className="md:col-span-4 flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <Link
                href="/items"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear
              </Link>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {items.filter((i) => i.status === ItemStatus.AVAILABLE).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Rented</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {items.filter((i) => i.status === ItemStatus.RENTED).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Maintenance</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {items.filter((i) => i.status === ItemStatus.MAINTENANCE).length}
            </p>
          </div>
        </div>

        {/* Items list */}
        <div className="bg-white rounded-lg shadow">
          <ItemList items={items} />
        </div>
      </div>
    </div>
  );
}
