'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface VehicleFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  defaultValues?: {
    licensePlate?: string;
    model?: string;
    year?: number;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
  };
}

export function VehicleFields({ register, errors, defaultValues }: VehicleFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-sm font-semibold text-blue-900">Vehicle Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* License Plate */}
        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
            License Plate <span className="text-red-500">*</span>
          </label>
          <input
            id="licensePlate"
            type="text"
            {...register('attributes.licensePlate', {
              required: 'License plate is required for vehicles',
            })}
            defaultValue={defaultValues?.licensePlate}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="ABC-1234"
          />
          {errors?.attributes?.licensePlate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.attributes.licensePlate.message as string}
            </p>
          )}
        </div>

        {/* Model */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            Model
          </label>
          <input
            id="model"
            type="text"
            {...register('attributes.model')}
            defaultValue={defaultValues?.model}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Honda PCX 125"
          />
        </div>

        {/* Year */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            id="year"
            type="number"
            {...register('attributes.year', {
              valueAsNumber: true,
              min: { value: 1900, message: 'Invalid year' },
              max: { value: new Date().getFullYear() + 1, message: 'Invalid year' },
            })}
            defaultValue={defaultValues?.year}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="2023"
          />
          {errors?.attributes?.year && (
            <p className="mt-1 text-sm text-red-600">
              {errors.attributes.year.message as string}
            </p>
          )}
        </div>

        {/* Mileage */}
        <div>
          <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
            Mileage (km)
          </label>
          <input
            id="mileage"
            type="number"
            {...register('attributes.mileage', {
              valueAsNumber: true,
              min: { value: 0, message: 'Mileage cannot be negative' },
            })}
            defaultValue={defaultValues?.mileage}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="5000"
          />
          {errors?.attributes?.mileage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.attributes.mileage.message as string}
            </p>
          )}
        </div>

        {/* Fuel Type */}
        <div>
          <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700">
            Fuel Type
          </label>
          <select
            id="fuelType"
            {...register('attributes.fuelType')}
            defaultValue={defaultValues?.fuelType || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select fuel type</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label htmlFor="transmission" className="block text-sm font-medium text-gray-700">
            Transmission
          </label>
          <select
            id="transmission"
            {...register('attributes.transmission')}
            defaultValue={defaultValues?.transmission || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </div>
      </div>
    </div>
  );
}
