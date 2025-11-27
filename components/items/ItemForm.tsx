'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ItemType, ItemStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { PhotoUpload } from './PhotoUpload';
import { VehicleFields } from './VehicleFields';
import { Loader2 } from 'lucide-react';

// Form validation schema
const itemFormSchema = z.object({
  type: z.nativeEnum(ItemType),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  basePrice: z.number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  status: z.nativeEnum(ItemStatus),
  attributes: z.any().optional(),
  photos: z.array(z.string()).default([]),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  initialData?: Partial<ItemFormData & { id: string }>;
  mode: 'create' | 'edit';
}

export function ItemForm({ initialData, mode }: ItemFormProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      type: initialData?.type || ItemType.VEHICLE,
      name: initialData?.name || '',
      description: initialData?.description || '',
      basePrice: initialData?.basePrice || 0,
      status: initialData?.status || ItemStatus.AVAILABLE,
      attributes: initialData?.attributes || {},
      photos: initialData?.photos || [],
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: ItemFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Add photos to data
      const payload = {
        ...data,
        photos,
      };

      const url = mode === 'create' 
        ? '/api/items' 
        : `/api/items/${initialData?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save item');
      }

      // Redirect to items list
      router.push('/items');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Type selector */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          {...register('type')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value={ItemType.VEHICLE}>Vehicle</option>
          <option value={ItemType.PROPERTY}>Property</option>
          <option value={ItemType.BOAT}>Boat</option>
          <option value={ItemType.EXPERIENCE}>Experience</option>
          <option value={ItemType.EQUIPMENT}>Equipment</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="e.g., Honda PCX 125"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Describe your item..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Base Price */}
      <div>
        <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
          Base Price (€/day) <span className="text-red-500">*</span>
        </label>
        <input
          id="basePrice"
          type="number"
          step="0.01"
          {...register('basePrice', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="0.00"
        />
        {errors.basePrice && (
          <p className="mt-1 text-sm text-red-600">{errors.basePrice.message}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          {...register('status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value={ItemStatus.AVAILABLE}>Available</option>
          <option value={ItemStatus.RENTED}>Rented</option>
          <option value={ItemStatus.MAINTENANCE}>Maintenance</option>
          <option value={ItemStatus.UNAVAILABLE}>Unavailable</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      {/* Vehicle-specific fields */}
      {selectedType === ItemType.VEHICLE && (
        <VehicleFields
          register={register}
          errors={errors}
          defaultValues={initialData?.attributes}
        />
      )}

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos
        </label>
        <PhotoUpload photos={photos} onChange={setPhotos} />
      </div>

      {/* Submit buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>{mode === 'create' ? 'Create Item' : 'Update Item'}</>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
