'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BusinessType, Tenant } from '@prisma/client';
import { useRouter } from 'next/navigation';

const settingsSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  businessTypes: z.array(z.nativeEnum(BusinessType)).min(1, 'Select at least one business type'),
  logo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  publishToMarbella4Rent: z.boolean().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface TenantSettingsFormProps {
  tenant: Tenant;
}

export default function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const colors = tenant.colors as { primary?: string; secondary?: string } | null;
  const config = tenant.config as { publishToMarbella4Rent?: boolean } | null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tenant.name,
      location: tenant.location || '',
      businessTypes: tenant.businessTypes,
      logo: tenant.logo || '',
      primaryColor: colors?.primary || '#3b82f6',
      secondaryColor: colors?.secondary || '#8b5cf6',
      publishToMarbella4Rent: config?.publishToMarbella4Rent || false,
    },
  });

  const location = watch('location');

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/tenants/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      router.refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessTypeOptions = [
    { value: BusinessType.VEHICLE_RENTAL, label: 'Vehicle Rental', icon: '🚗' },
    { value: BusinessType.SCOOTER_RENTAL, label: 'Scooter Rental', icon: '🛵' },
    { value: BusinessType.PROPERTY_RENTAL, label: 'Property Rental', icon: '🏠' },
    { value: BusinessType.BOAT_RENTAL, label: 'Boat Rental', icon: '⛵' },
    { value: BusinessType.EXPERIENCE_RENTAL, label: 'Experience Rental', icon: '🎭' },
    { value: BusinessType.EQUIPMENT_RENTAL, label: 'Equipment Rental', icon: '🛠️' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow">
      {/* Subdomain Info (Read-only) */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Company Information
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Subdomain</p>
              <p className="text-lg font-mono font-semibold text-gray-900">
                {tenant.subdomain}.rental.com
              </p>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Cannot be changed
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Madrid, Barcelona, Marbella"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Business Types */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Business Types
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {businessTypeOptions.map((option) => (
            <label
              key={option.value}
              className="relative flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
            >
              <input
                {...register('businessTypes')}
                type="checkbox"
                value={option.value}
                className="mr-3"
              />
              <span className="text-xl mr-2">{option.icon}</span>
              <span className="text-sm font-medium text-gray-700">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        {errors.businessTypes && (
          <p className="mt-2 text-sm text-red-600">{errors.businessTypes.message}</p>
        )}
      </div>

      {/* Branding */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Branding</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              {...register('logo')}
              type="url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://i.pinimg.com/736x/19/63/c8/1963c80b8983da5f3be640ca7473b098.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL to your logo image (AWS S3 integration coming soon)
            </p>
            {errors.logo && (
              <p className="mt-1 text-sm text-red-600">{errors.logo.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  {...register('primaryColor')}
                  type="color"
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  {...register('primaryColor')}
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  {...register('secondaryColor')}
                  type="color"
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  {...register('secondaryColor')}
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Integration */}
      {location && location.toLowerCase().includes('marbella') && (
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Marketplace Integration
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                {...register('publishToMarbella4Rent')}
                type="checkbox"
                className="mt-1 mr-3"
              />
              <div>
                <span className="block font-medium text-gray-800">
                  Publish to Marbella4Rent
                </span>
                <span className="text-sm text-gray-600">
                  Make your rentals visible on the Marbella4Rent marketplace to reach more customers
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mx-6 mt-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 flex justify-end space-x-3">
        <a
          href="/dashboard"
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
