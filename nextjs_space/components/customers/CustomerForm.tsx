'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Save, X } from 'lucide-react';
import Link from 'next/link';

const customerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  documentType: z.enum(['DNI', 'NIE', 'PASSPORT', 'DRIVING_LICENSE'], {
    required_error: 'Tipo de documento es requerido',
  }),
  documentNumber: z.string().min(1, 'Número de documento es requerido'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  customerId?: string;
}

export function CustomerForm({ initialData, customerId }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!customerId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const url = isEditing
        ? `/api/customers/${customerId}`
        : '/api/customers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          isEditing
            ? 'Cliente actualizado correctamente'
            : 'Cliente creado correctamente'
        );
        router.push('/customers');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al guardar el cliente');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Error al guardar el cliente');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Información Personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Pérez"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="juan@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+34 600 000 000"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Documento de Identidad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo de Documento *
            </label>
            <select
              {...register('documentType')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="DNI">DNI</option>
              <option value="NIE">NIE</option>
              <option value="PASSPORT">Pasaporte</option>
              <option value="DRIVING_LICENSE">Licencia de Conducir</option>
            </select>
            {errors.documentType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.documentType.message}
              </p>
            )}
          </div>

          {/* Document Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Número de Documento *
            </label>
            <input
              type="text"
              {...register('documentNumber')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12345678A"
            />
            {errors.documentNumber && (
              <p className="text-red-500 text-sm mt-1">
                {errors.documentNumber.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Información Adicional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Calle Principal, 123"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input
              type="text"
              {...register('city')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Madrid"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-1">País</label>
            <input
              type="text"
              {...register('country')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="España"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales sobre el cliente..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
        >
          <X className="w-4 h-4" />
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting
            ? 'Guardando...'
            : isEditing
            ? 'Actualizar'
            : 'Crear Cliente'}
        </button>
      </div>
    </form>
  );
}
