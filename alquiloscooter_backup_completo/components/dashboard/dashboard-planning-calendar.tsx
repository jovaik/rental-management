
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Car, Calendar, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { getVehicleVisualNumber } from '@/lib/vehicle-display';

interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  status: 'T' | 'F';
  group: string;
}

interface Reservation {
  id: number;
  car_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_date: string;
  return_date: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'request';
  total_price: number;
}

export function DashboardPlanningCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');

  // Load data from APIs
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range (7 days from current view)
      const weekDates = generateWeekDates(currentDate);
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];

      // Load vehicles and bookings in parallel
      const [vehiclesResponse, bookingsResponse] = await Promise.all([
        fetch('/api/vehicles'),
        fetch(`/api/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      ]);

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        const activeVehicles = vehiclesData
          .filter((v: any) => v.status === 'T')
          .map((v: any) => ({
            ...v,
            id: v.id.toString()
          }));
        setVehicles(activeVehicles);
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        // CRÍTICO: Solo excluir 'cancelled' - mostrar REQUEST para que usuario decida
        const filteredBookings = bookingsData.filter((b: any) => 
          b.status !== 'cancelled'
        );
        setReservations(filteredBookings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos del calendario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Generate dates for current week
  const generateWeekDates = (startDate: Date) => {
    const dates = [];
    const start = new Date(startDate);
    
    // Start from 7 days ago to have past context
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 21; i++) { // Show 21 days (7 past + today + 13 future)
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = generateWeekDates(currentDate);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'T': return 'text-green-600 bg-green-50'; // Active
      case 'F': return 'text-red-600 bg-red-50'; // Inactive
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // Get reservations for a specific vehicle and date
  const getReservationForCell = (vehicleId: string, date: Date) => {
    return reservations.find(reservation => {
      try {
        // Verificar si el vehículo está en la reserva (car_id legacy o vehicles array)
        const isInLegacyCar = reservation?.car_id && reservation.car_id.toString() === vehicleId;
        const vehicles = (reservation as any)?.vehicles;
        const isInVehicles = Array.isArray(vehicles) && vehicles.length > 0 
          ? vehicles.some((v: any) => v?.car_id?.toString() === vehicleId)
          : false;
        
        if (!isInLegacyCar && !isInVehicles) return false;
        
        if (!reservation?.pickup_date || !reservation?.return_date) return false;
        
        const startDate = new Date(reservation.pickup_date);
        const endDate = new Date(reservation.return_date);
        const checkDate = new Date(date);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate >= startDate && checkDate <= endDate;
      } catch (error) {
        console.error('Error en getReservationForCell:', error, reservation);
        return false;
      }
    });
  };

  // Check if reservation starts on this date
  const isReservationStart = (reservation: Reservation | undefined, date: Date) => {
    try {
      if (!reservation?.pickup_date) return false;
      const startDate = new Date(reservation.pickup_date);
      const checkDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      return startDate.getTime() === checkDate.getTime();
    } catch (error) {
      console.error('Error en isReservationStart:', error);
      return false;
    }
  };

  // Calculate how many days the reservation spans from this date
  const getReservationSpan = (reservation: Reservation | undefined, date: Date) => {
    try {
      if (!reservation || !isReservationStart(reservation, date)) return 0;
      if (!reservation.pickup_date || !reservation.return_date) return 0;
      
      const startDate = new Date(reservation.pickup_date);
      const endDate = new Date(reservation.return_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate visible days in the current week view
      const lastDateInView = weekDates[weekDates.length - 1];
      if (!lastDateInView) return totalDays;
      
      lastDateInView.setHours(0, 0, 0, 0);
      
      if (endDate <= lastDateInView) {
        return totalDays;
      } else {
        const daysInView = Math.ceil((lastDateInView.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return daysInView;
      }
    } catch (error) {
      console.error('Error en getReservationSpan:', error);
      return 0;
    }
  };

  // Handle cell click
  const handleCellClick = (vehicleId: string, date: Date) => {
    try {
      const existingReservation = getReservationForCell(vehicleId, date);
      if (existingReservation && existingReservation.customer_name) {
        toast.success(
          `Reserva: ${existingReservation.customer_name}\nTeléfono: ${existingReservation.customer_phone || 'Sin teléfono'}`,
          { duration: 3000 }
        );
      }
    } catch (error) {
      console.error('Error en handleCellClick:', error);
    }
  };

  const getReservationColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'request': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter vehicles
  const filteredVehicles = selectedVehicleFilter === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.id === selectedVehicleFilter);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Vista Rápida de Planificación</span>
            <Badge variant="secondary">21 días (7 pasados + 14 futuros)</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigateWeek('prev')} variant="outline" size="sm" disabled={loading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigateWeek('next')} variant="outline" size="sm" disabled={loading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Select value={selectedVehicleFilter} onValueChange={setSelectedVehicleFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los vehículos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los vehículos</SelectItem>
                {vehicles
                  .filter((vehicle) => vehicle.id && String(vehicle.id).trim() !== '')
                  .map((vehicle) => (
                    <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                      {getVehicleVisualNumber(vehicle.registration_number)} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Link href="/planning">
              <Button variant="outline" size="sm">
                Ver Planificación Completa
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando calendario...</span>
          </div>
        ) : (
          <div className="relative max-h-[340px] overflow-hidden">
            <div className="overflow-auto max-h-[340px]">
              <div className="flex relative">
                {/* Vehicle List */}
                <div className="w-64 border-r bg-gray-50 flex-shrink-0">
                  <div className="h-16 p-3 border-b bg-gray-100 font-semibold text-sm flex items-center sticky top-0 z-20">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4" />
                      <span>Vehículos ({filteredVehicles.length})</span>
                    </div>
                  </div>
                  {filteredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-3 border-b hover:bg-gray-100 h-16 flex items-center">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{vehicle.registration_number}</div>
                        <div className="text-xs text-gray-600">{vehicle.make} {vehicle.model}</div>
                        <Badge className={`text-xs ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status === 'T' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="flex-1 relative">
                  {/* Date Headers */}
                  <div className="flex bg-gray-100 border-b h-16 sticky top-0 z-10">
                    {weekDates.map((date) => (
                      <div key={date.toISOString()} className="w-28 p-2 border-r text-center flex flex-col justify-center flex-shrink-0">
                        <div className="text-xs font-medium text-gray-600">
                          {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-semibold ${
                          date.getTime() === today.getTime() ? 'text-blue-600 font-bold' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {date.toLocaleDateString('es-ES', { month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Today vertical line - NUEVA IMPLEMENTACIÓN */}
                  {weekDates.findIndex(d => d.getTime() === today.getTime()) !== -1 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30 pointer-events-none"
                      style={{
                        left: `${weekDates.findIndex(d => d.getTime() === today.getTime()) * 112}px`
                      }}
                    >
                      <div className="absolute -top-1 -left-2 w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
                    </div>
                  )}

                  {/* Grid */}
                  {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex h-14 border-b relative">
                  {weekDates.map((date) => {
                    const reservation = getReservationForCell(vehicle.id, date);
                    const isStart = reservation && isReservationStart(reservation, date);
                    const span = reservation ? getReservationSpan(reservation, date) : 0;
                    const isTodayColumn = date.getTime() === today.getTime();
                      
                      return (
                        <div
                          key={date.toISOString()}
                          className={`w-28 border-r hover:bg-gray-50 cursor-pointer relative flex items-center justify-center flex-shrink-0 ${
                            isTodayColumn ? 'bg-blue-50/30' : ''
                          }`}
                          onClick={() => handleCellClick(vehicle.id, date)}
                        >
                          {/* Reservation Block */}
                          {isStart && reservation && reservation.customer_name && (
                            <div
                              className={`absolute left-0 top-1 bottom-1 rounded text-white text-xs p-1 flex items-center font-medium shadow-sm ${getReservationColor(reservation.status || 'pending')}`}
                              style={{
                                width: `${span * 112 - 4}px`, // 112px = w-28, minus padding
                                zIndex: 10
                              }}
                              title={`${reservation.customer_name || 'Sin nombre'}\n${reservation.customer_phone || 'Sin teléfono'}\n${reservation.pickup_date ? new Date(reservation.pickup_date).toLocaleDateString('es-ES') : ''} - ${reservation.return_date ? new Date(reservation.return_date).toLocaleDateString('es-ES') : ''}`}
                            >
                              <span className="truncate flex-1 px-1">
                                {(() => {
                                  // CRÍTICO: Mostrar matrícula completa primero (vital para identificación)
                                  const vehicleForReservation = vehicles.find(v => v.id === reservation.car_id.toString());
                                  const fullPlate = vehicleForReservation?.registration_number || '';
                                  const firstName = reservation.customer_name.split(' ')[0] || '';
                                  // Formato: "N 56 6933NGT - Juan"
                                  return fullPlate ? `${fullPlate} - ${firstName}` : `${firstName}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                    );
                  })}
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
