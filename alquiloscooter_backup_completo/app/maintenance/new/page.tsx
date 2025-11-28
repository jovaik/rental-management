
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MaintenanceForm } from '@/components/maintenance/maintenance-form';

interface Vehicle {
  id: number;
  registration_number?: string;
  make?: string;
  model?: string;
}

interface Technician {
  id: number;
  firstname?: string;
  lastname?: string;
}

export default function NewMaintenancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, usersResponse] = await Promise.all([
          fetch('/api/vehicles?limit=100'),
          fetch('/api/users?role=technician')
        ]);

        if (vehiclesResponse?.ok) {
          const vehiclesData = await vehiclesResponse.json();
          setVehicles(vehiclesData?.vehicles || []);
        }

        if (usersResponse?.ok) {
          const usersData = await usersResponse.json();
          setTechnicians(usersData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response?.ok) {
        router.push('/maintenance');
        router.refresh();
      } else {
        throw new Error('Error creating maintenance record');
      }
    } catch (error) {
      console.error('Error creating maintenance:', error);
      alert('Error al crear el registro de mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Mantenimiento</h1>
        <p className="text-gray-600">
          Programa un nuevo servicio de mantenimiento para un vehículo
        </p>
      </div>

      <MaintenanceForm
        vehicles={vehicles}
        technicians={technicians}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}
