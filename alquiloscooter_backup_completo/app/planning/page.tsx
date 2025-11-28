
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Car, Plus, Calendar, RefreshCw, Edit, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RoleGuard } from '@/components/auth/role-guard';
import { NewReservationDialog } from '@/components/planning/new-reservation-dialog';
import { EditReservationDialog } from '@/components/planning/edit-reservation-dialog';
import { ChangeVehicleDialog } from '@/components/planning/change-vehicle-dialog';
import { ManageBookingFinancialsDialog } from '@/components/planning/manage-booking-financials-dialog';
import { PendingRequestsPanel } from '@/components/planning/pending-requests-panel';
import { getVehicleVisualNumber } from '@/lib/vehicle-display';

interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  status: 'T' | 'F'; // 'T' = Active, 'F' = Inactive
  group: string;
  currentBooking?: any;
  activeMaintenance?: any;
}

interface Reservation {
  id: number;
  booking_number?: string;
  customer_id: number | null;
  car_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_date: string;
  return_date: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  total_price: number;
  pickup_condition_notes?: string;
  car?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
  vehicles?: Array<{
    id: number;
    car_id: number;
    vehicle_price: number;
    car?: {
      id: number;
      registration_number: string;
      make: string;
      model: string;
    };
  }>;
  drivers?: Array<{
    id: number;
    full_name: string;
    dni_nie: string;
    driver_license: string;
    license_expiry?: string;
    phone?: string;
    email?: string;
  }>;
}

export default function PlanningPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'operador']}>
      <PlanningPageContent />
    </RoleGuard>
  );
}

function PlanningPageContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedCell, setSelectedCell] = useState<{vehicleId: string, date: Date} | null>(null);
  const [draggedReservation, setDraggedReservation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewReservationDialog, setShowNewReservationDialog] = useState(false);
  const [preselectedVehicleId, setPreselectedVehicleId] = useState<string | undefined>();
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();
  const [showEditReservationDialog, setShowEditReservationDialog] = useState(false);
  const [showChangeVehicleDialog, setShowChangeVehicleDialog] = useState(false);
  const [showManageFinancialsDialog, setShowManageFinancialsDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Load data from APIs
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range (2 weeks from current view)
      const weekDates = generateWeekDates(currentDate);
      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];

      console.log('🔍 Planning: Cargando datos...');
      console.log('📅 Rango de fechas:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      // Load vehicles and bookings in parallel
      const [vehiclesResponse, bookingsResponse] = await Promise.all([
        fetch('/api/vehicles'),
        fetch(`/api/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      ]);

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        console.log('🚗 Vehículos recibidos:', vehiclesData.length);
        console.log('📋 Primeros 3 vehículos:', vehiclesData.slice(0, 3).map((v: any) => ({
          id: v.id,
          id_type: typeof v.id,
          registration: v.registration_number,
          status: v.status
        })));
        
        // CORRECCIÓN: Convertir IDs a string para que coincidan con las reservas
        const activeVehicles = vehiclesData
          .filter((v: any) => v.status === 'T')
          .map((v: any) => ({
            ...v,
            id: v.id.toString() // Convertir ID a string
          }));
        console.log('✅ Vehículos activos:', activeVehicles.length);
        setVehicles(activeVehicles);
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        console.log('📖 Reservas recibidas:', bookingsData.length);
        console.log('📋 Todas las reservas:', bookingsData.map((b: any) => ({
          id: b.id,
          car_id: b.car_id,
          car_id_type: typeof b.car_id,
          customer: b.customer_name,
          pickup: b.pickup_date,
          return: b.return_date,
          status: b.status
        })));
        // CRÍTICO: Filtrar igual que Dashboard - Solo excluir 'cancelled', mostrar REQUEST
        const filteredBookings = bookingsData.filter((b: any) => 
          b.status !== 'cancelled'
        );
        console.log('✅ Reservas después de filtrar:', filteredBookings.length);
        setReservations(filteredBookings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Generate dates for current week
  const generateWeekDates = (startDate: Date) => {
    const dates = [];
    const start = new Date(startDate);
    
    // CRÍTICO: Igualar con Dashboard - 21 días (7 pasados + hoy + 13 futuros)
    // Esto asegura que AMBOS Gantt muestren EXACTAMENTE las mismas reservas
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
    const found = reservations.find(reservation => {
      // Verificar si este vehículo está en la reserva (soporte para múltiples vehículos)
      let carIdMatch = false;
      
      // Opción 1: Verificar car_id directo (legacy o vehículo principal)
      if (reservation.car_id && reservation.car_id.toString() === vehicleId) {
        carIdMatch = true;
      }
      
      // Opción 2: Verificar en el array de vehicles (sistema multivehículo)
      if (!carIdMatch && reservation.vehicles && Array.isArray(reservation.vehicles)) {
        carIdMatch = reservation.vehicles.some((v: any) => v.car_id?.toString() === vehicleId);
      }
      
      // Opción 3: Verificar en car.id del objeto car anidado
      if (!carIdMatch && reservation.car && reservation.car.id) {
        carIdMatch = reservation.car.id.toString() === vehicleId;
      }
      
      if (!carIdMatch) {
        return false;
      }
      
      const startDate = new Date(reservation.pickup_date);
      const endDate = new Date(reservation.return_date);
      const checkDate = new Date(date);
      
      // Normalize dates to compare only date part
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      const dateMatch = checkDate >= startDate && checkDate <= endDate;
      
      return dateMatch;
    });
    
    return found;
  };

  // Check if reservation starts on this date
  const isReservationStart = (reservation: Reservation, date: Date) => {
    const startDate = new Date(reservation.pickup_date);
    const checkDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return startDate.getTime() === checkDate.getTime();
  };

  // Calculate how many days the reservation spans from this date
  const getReservationSpan = (reservation: Reservation, date: Date) => {
    if (!isReservationStart(reservation, date)) return 0;
    
    const startDate = new Date(reservation.pickup_date);
    const endDate = new Date(reservation.return_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Handle cell click for new reservation
  const handleCellClick = (vehicleId: string, date: Date, event?: React.MouseEvent) => {
    const existingReservation = getReservationForCell(vehicleId, date);
    if (existingReservation) {
      // Si es click derecho, mostrar opciones de cambio de vehículo
      if (event?.button === 2) {
        event.preventDefault();
        setSelectedReservation(existingReservation);
        setShowChangeVehicleDialog(true);
        return;
      }
      
      // Click izquierdo: mostrar detalles
      toast.success(
        `Reserva existente:\n${existingReservation.customer_name}\nTeléfono: ${existingReservation.customer_phone || 'Sin teléfono'}`,
        { duration: 3000 }
      );
      return;
    }
    
    // Open dialog with preselected vehicle and date
    setPreselectedVehicleId(vehicleId);
    setPreselectedDate(date);
    setShowNewReservationDialog(true);
  };

  // Handle opening new reservation dialog
  const handleNewReservation = () => {
    setPreselectedVehicleId(undefined);
    setPreselectedDate(undefined);
    setShowNewReservationDialog(true);
  };

  // Handle drag start
  const handleDragStart = (reservationId: string) => {
    setDraggedReservation(reservationId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, vehicleId: string, date: Date) => {
    e.preventDefault();
  };

  // Handle drop - Update reservation via API
  const handleDrop = async (e: React.DragEvent, vehicleId: string, date: Date) => {
    e.preventDefault();
    if (!draggedReservation) return;
    
    try {
      const reservation = reservations.find(r => r.id.toString() === draggedReservation);
      if (!reservation) return;

      const startDate = new Date(reservation.pickup_date);
      const endDate = new Date(reservation.return_date);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const newStartDate = new Date(date);
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + duration - 1);
      
      const response = await fetch(`/api/bookings/${draggedReservation}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: parseInt(vehicleId),
          pickup_date: newStartDate.toISOString(),
          return_date: newEndDate.toISOString()
        })
      });

      if (response.ok) {
        toast.success('Reserva actualizada exitosamente');
        loadData(); // Reload data
      } else {
        toast.error('Error actualizando reserva');
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('Error actualizando reserva');
    }
    
    setDraggedReservation(null);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'T': return 'text-green-600 bg-green-50'; // Active
      case 'F': return 'text-red-600 bg-red-50'; // Inactive
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getReservationColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500 hover:bg-green-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      case 'completed': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planificación de Vehículos</h1>
          <p className="text-gray-600">Vista Gantt para gestión de reservas y disponibilidad</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigateWeek('prev')} variant="outline" size="sm" disabled={loading}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button onClick={() => navigateWeek('next')} variant="outline" size="sm" disabled={loading}>
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            onClick={handleNewReservation} 
            className="bg-green-600 hover:bg-green-700" 
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Pending Requests Panel */}
      <PendingRequestsPanel />

      {/* Gantt Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Calendario de Vehículos</span>
            <Badge variant="secondary">21 días (7 pasados + Hoy + 13 futuros)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando datos...</span>
            </div>
          )}
          {!loading && (
          <div className="flex overflow-x-auto">
            {/* Vehicle List */}
            <div className="w-80 border-r bg-gray-50 flex-shrink-0">
              <div className="h-16 p-3 border-b bg-gray-100 font-semibold text-sm flex items-center">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span>Vehículos ({vehicles.length})</span>
                </div>
              </div>
              {vehicles.map((vehicle) => (
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
              <div className="flex bg-gray-100 border-b h-16">
                {weekDates.map((date) => (
                  <div key={date.toISOString()} className="w-24 flex-shrink-0 p-2 border-r text-center flex flex-col justify-center">
                    <div className="text-xs font-medium text-gray-600">
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-semibold ${
                      date.getTime() === today.getTime() ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('es-ES', { month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid */}
              {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex h-16 border-b relative">
                      {weekDates.map((date) => {
                        const reservation = getReservationForCell(vehicle.id, date);
                        const isStart = reservation && isReservationStart(reservation, date);
                        const span = reservation ? getReservationSpan(reservation, date) : 0;
                        
                        return (
                          <div
                            key={date.toISOString()}
                            className="w-24 border-r hover:bg-gray-50 cursor-pointer relative flex items-center justify-center"
                            onClick={() => handleCellClick(vehicle.id, date)}
                            onDragOver={(e) => handleDragOver(e, vehicle.id, date)}
                            onDrop={(e) => handleDrop(e, vehicle.id, date)}
                          >
                            {/* Reservation Block */}
                            {isStart && reservation && (
                              <div
                                className={`absolute left-0 top-1 bottom-1 rounded text-white text-xs p-1 cursor-move flex items-center justify-between font-medium shadow-sm group ${getReservationColor(reservation.status)}`}
                                style={{
                                  width: `${span * 96 - 4}px`, // 96px = w-24, minus padding
                                  zIndex: 10
                                }}
                                draggable
                                onDragStart={() => handleDragStart(reservation.id.toString())}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setSelectedReservation(reservation);
                                  setShowChangeVehicleDialog(true);
                                }}
                                title={`${reservation.customer_name}\n${reservation.customer_phone || 'Sin teléfono'}\n${new Date(reservation.pickup_date).toLocaleDateString('es-ES')} - ${new Date(reservation.return_date).toLocaleDateString('es-ES')}\nClick derecho para cambiar vehículo`}
                              >
                                <span className="truncate flex-1">
                                  {(() => {
                                    // CRÍTICO: Mostrar matrícula completa primero (vital para identificación)
                                    const vehicleForReservation = vehicles.find(v => v.id === reservation.car_id.toString());
                                    const fullPlate = vehicleForReservation?.registration_number || '';
                                    const firstName = reservation.customer_name.split(' ')[0] || '';
                                    // Formato: "N 56 6933NGT - Juan"
                                    return fullPlate ? `${fullPlate} - ${firstName}` : `${firstName}`;
                                  })()}
                                </span>
                                <div className="flex gap-1 ml-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReservation(reservation);
                                      setShowEditReservationDialog(true);
                                    }}
                                    className="p-0.5 hover:bg-white/30 rounded transition-colors"
                                    title="Editar reserva completa (conductores, documentos, etc.)"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-white drop-shadow-md" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReservation(reservation);
                                      setShowManageFinancialsDialog(true);
                                    }}
                                    className="p-0.5 hover:bg-white/30 rounded transition-colors"
                                    title="Gestionar pagos y completar"
                                  >
                                    <DollarSign className="h-3.5 w-3.5 text-white drop-shadow-md" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

              {/* Today vertical line - continuous marker */}
              {weekDates.findIndex(d => d.getTime() === today.getTime()) !== -1 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30 pointer-events-none"
                  style={{
                    left: `${weekDates.findIndex(d => d.getTime() === today.getTime()) * 96}px`
                  }}
                >
                  <div className="absolute -top-1 -left-2 w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
                </div>
              )}
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Confirmada</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Pendiente</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Cancelada</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Completada</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-4 bg-blue-500 rounded"></div>
          <span>Hoy</span>
        </div>
      </div>

      {/* New Reservation Dialog */}
      <NewReservationDialog
        open={showNewReservationDialog}
        onOpenChange={setShowNewReservationDialog}
        onReservationCreated={loadData}
        preselectedVehicleId={preselectedVehicleId}
        preselectedDate={preselectedDate}
      />

      {/* Edit Reservation Dialog (Complete Edit) */}
      <EditReservationDialog
        open={showEditReservationDialog}
        onOpenChange={setShowEditReservationDialog}
        reservation={selectedReservation}
        onReservationUpdated={loadData}
      />

      {/* Change Vehicle Dialog */}
      <ChangeVehicleDialog
        open={showChangeVehicleDialog}
        onOpenChange={setShowChangeVehicleDialog}
        reservation={selectedReservation}
        onVehicleChanged={loadData}
      />

      {/* Manage Financials Dialog */}
      <ManageBookingFinancialsDialog
        open={showManageFinancialsDialog}
        onOpenChange={setShowManageFinancialsDialog}
        booking={selectedReservation}
        onSuccess={loadData}
      />
    </div>
  );
}
