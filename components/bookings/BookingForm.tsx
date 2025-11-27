'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const bookingSchema = z.object({
  itemId: z.string().min(1, 'Item es requerido'),
  customerId: z.string().min(1, 'Cliente es requerido'),
  startDate: z.string().min(1, 'Fecha de inicio es requerida'),
  endDate: z.string().min(1, 'Fecha de fin es requerida'),
  totalPrice: z.number().min(0, 'Precio debe ser mayor a 0'),
  deposit: z.number().min(0, 'Depósito debe ser mayor o igual a 0'),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

type Item = {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  status: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
};

export default function BookingForm() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [calculatedDays, setCalculatedDays] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      deposit: 0,
      totalPrice: 0,
    },
  });

  const itemId = watch('itemId');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const totalPrice = watch('totalPrice');

  // Fetch items and customers
  useEffect(() => {
    fetchItems();
    fetchCustomers();
  }, []);

  // Calculate days and price when dates change
  useEffect(() => {
    if (startDate && endDate && selectedItem) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start < end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setCalculatedDays(days);
        
        const price = days * selectedItem.basePrice;
        setValue('totalPrice', price);
        setValue('deposit', price * 0.2); // 20% deposit
      }
    }
  }, [startDate, endDate, selectedItem, setValue]);

  // Check availability when dates and item change
  useEffect(() => {
    if (itemId && startDate && endDate) {
      checkAvailability();
    }
  }, [itemId, startDate, endDate]);

  // Update selected item when itemId changes
  useEffect(() => {
    if (itemId) {
      const item = items.find((i) => i.id === itemId);
      setSelectedItem(item || null);
    }
  }, [itemId, items]);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items?status=AVAILABLE');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const checkAvailability = async () => {
    setAvailability({ checking: true, available: null, message: 'Verificando disponibilidad...' });

    try {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
      });

      const data = await response.json();
      setAvailability({
        checking: false,
        available: data.available,
        message: data.message,
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({
        checking: false,
        available: null,
        message: 'Error al verificar disponibilidad',
      });
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (availability.available === false) {
      alert('El item no está disponible en las fechas seleccionadas');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        }),
      });

      if (response.ok) {
        const booking = await response.json();
        router.push(`/bookings/${booking.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold">Nueva Reserva</h2>

        {/* Item Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item a Reservar *
          </label>
          <select
            {...register('itemId')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.type} - €{item.basePrice}/día
              </option>
            ))}
          </select>
          {errors.itemId && (
            <p className="text-red-500 text-sm mt-1">{errors.itemId.message}</p>
          )}
        </div>

        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            {...register('customerId')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar cliente...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.email}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            ¿No encuentras el cliente?{' '}
            <a href="/customers/new" className="text-blue-600 hover:underline">
              Crear nuevo cliente
            </a>
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="datetime-local"
              {...register('startDate')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin *
            </label>
            <input
              type="datetime-local"
              {...register('endDate')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Availability Check */}
        {availability.message && (
          <div
            className={`p-4 rounded-md ${
              availability.available === true
                ? 'bg-green-50 text-green-800 border border-green-200'
                : availability.available === false
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {availability.message}
          </div>
        )}

        {/* Price Calculation */}
        {calculatedDays > 0 && selectedItem && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Cálculo de Precio</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Precio por día:</span>
                <span>€{selectedItem.basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Número de días:</span>
                <span>{calculatedDays}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total calculado:</span>
                <span>€{(calculatedDays * selectedItem.basePrice).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Total (€) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('totalPrice', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.totalPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.totalPrice.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depósito (€)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('deposit', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.deposit && (
              <p className="text-red-500 text-sm mt-1">{errors.deposit.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Sugerencia: 20% del total = €{(totalPrice * 0.2).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notas adicionales sobre la reserva..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || availability.available === false}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Reserva'}
          </button>
        </div>
      </div>
    </form>
  );
}
