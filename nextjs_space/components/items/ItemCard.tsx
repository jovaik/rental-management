'use client';

import { Item, ItemType, ItemStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Edit, ArrowLeft } from 'lucide-react';

interface ItemCardProps {
  item: Item;
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

export function ItemCard({ item }: ItemCardProps) {
  const attributes = item.attributes as any;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/items"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{typeLabels[item.type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[item.status]}`}
          >
            {item.status}
          </span>
          <Link
            href={`/items/${item.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Photos */}
      {item.photos && item.photos.length > 0 && (
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {item.photos.map((photo, index) => (
              <div
                key={photo}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={photo}
                  alt={`${item.name} - Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="px-6 py-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Base Price</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              €{item.basePrice.toFixed(2)}<span className="text-sm font-normal text-gray-500">/day</span>
            </dd>
          </div>
          {item.description && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Vehicle-specific attributes */}
      {item.type === ItemType.VEHICLE && attributes && (
        <div className="px-6 py-6 bg-blue-50 border-t border-blue-100">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Vehicle Information</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {attributes.licensePlate && (
              <div>
                <dt className="text-sm font-medium text-blue-700">License Plate</dt>
                <dd className="mt-1 text-sm text-gray-900">{attributes.licensePlate}</dd>
              </div>
            )}
            {attributes.model && (
              <div>
                <dt className="text-sm font-medium text-blue-700">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{attributes.model}</dd>
              </div>
            )}
            {attributes.year && (
              <div>
                <dt className="text-sm font-medium text-blue-700">Year</dt>
                <dd className="mt-1 text-sm text-gray-900">{attributes.year}</dd>
              </div>
            )}
            {attributes.mileage && (
              <div>
                <dt className="text-sm font-medium text-blue-700">Mileage</dt>
                <dd className="mt-1 text-sm text-gray-900">{attributes.mileage.toLocaleString()} km</dd>
              </div>
            )}
            {attributes.fuelType && (
              <div>
                <dt className="text-sm font-medium text-blue-700">Fuel Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{attributes.fuelType}</dd>
              </div>
            )}
            {attributes.transmission && (
              <div>
                <dt className="text-sm font-medium text-blue-700">Transmission</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{attributes.transmission}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Metadata */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
          <span>Last updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
