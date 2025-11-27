'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Item, ItemType, ItemStatus } from '@prisma/client';
import { Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ItemListProps {
  items: Item[];
}

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RENTED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  UNAVAILABLE: 'bg-gray-100 text-gray-800',
};

const typeLabels = {
  VEHICLE: 'Vehicle',
  PROPERTY: 'Property',
  BOAT: 'Boat',
  EXPERIENCE: 'Experience',
  EQUIPMENT: 'Equipment',
};

export function ItemList({ items }: ItemListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete item');
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No items found</p>
        <p className="text-gray-400 text-sm mt-2">Create your first item to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 relative rounded overflow-hidden bg-gray-100">
                      {item.photos && item.photos.length > 0 ? (
                        <Image
                          src={item.photos[0]}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.type === ItemType.VEHICLE && item.attributes && (item.attributes as any).licensePlate && (
                        <div className="text-sm text-gray-500">
                          {(item.attributes as any).licensePlate}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {typeLabels[item.type]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    €{item.basePrice.toFixed(2)}/day
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/items/${item.id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/items/${item.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deletingId === item.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
