'use client';

import { useState } from 'react';

type AvailabilityCheckerProps = {
  itemId: string;
  excludeBookingId?: string;
};

export default function AvailabilityChecker({
  itemId,
  excludeBookingId,
}: AvailabilityCheckerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    available: boolean | null;
    message: string;
    conflicts?: any[];
  }>({ available: null, message: '' });

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      setResult({
        available: null,
        message: 'Por favor selecciona ambas fechas',
      });
      return;
    }

    setChecking(true);

    try {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          excludeBookingId,
        }),
      });

      const data = await response.json();
      setResult({
        available: data.available,
        message: data.message,
        conflicts: data.conflicts,
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      setResult({
        available: null,
        message: 'Error al verificar disponibilidad',
      });
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Verificar Disponibilidad</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Inicio
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Fin
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={checkAvailability}
        disabled={checking || !startDate || !endDate}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {checking ? 'Verificando...' : 'Verificar Disponibilidad'}
      </button>

      {result.message && (
        <div
          className={`p-4 rounded-md ${
            result.available === true
              ? 'bg-green-50 text-green-800 border border-green-200'
              : result.available === false
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <p className="font-semibold">{result.message}</p>

          {result.conflicts && result.conflicts.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Reservas en conflicto:</p>
              <ul className="space-y-1 text-sm">
                {result.conflicts.map((conflict: any) => (
                  <li key={conflict.id}>
                    {formatDate(conflict.startDate)} - {formatDate(conflict.endDate)} (Cliente: {conflict.customer.name})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
