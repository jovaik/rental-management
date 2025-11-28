
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Edit, Trash2, Eye, Car, UserPlus, Users, FileText, Camera, GitCompare, Calculator, DollarSign, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { ContractSignature } from '@/components/contracts/contract-signature';
import { VehicleInspection } from '@/components/inspections/vehicle-inspection';
import InspectionComparison from '@/components/inspections/inspection-comparison';
import { NewReservationDialog } from '@/components/planning/new-reservation-dialog';
import { ManageBookingFinancialsDialog } from '@/components/planning/manage-booking-financials-dialog';
import { CompleteReservationDialog } from '@/components/planning/complete-reservation-dialog';
import { ChangeVehicleDialog } from '@/components/planning/change-vehicle-dialog';
import { AddVehicleDialog } from '@/components/planning/add-vehicle-dialog';
import { AddDriverDialog } from '@/components/planning/add-driver-dialog';
import { EditReservationDialog } from '@/components/planning/edit-reservation-dialog';
import { ContractSignatureChoiceDialog } from '@/components/contracts/contract-signature-choice-dialog';
import { RemoteSignatureDialog } from '@/components/contracts/remote-signature-dialog';
import { SendRemoteSignatureDialog } from '@/components/contracts/send-remote-signature-dialog';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dni_nie: string;
  street_address: string;
  city: string;
  country: string;
}

interface Booking {
  id: number;
  car_id: number;
  customer_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  return_date: string;
  total_price: number;
  status: string;
  car?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
  customer?: Customer | null;
  vehicles?: Array<{
    id: number;
    car_id: number;
    vehicle_price: number;
    car: {
      id: number;
      registration_number: string;
      make: string;
      model: string;
      status: string;
    };
  }>;
}

interface PricingGroup {
  id: number;
  name: string;
  price_1_3_days: number;
  price_4_7_days: number;
  price_8_plus_days: number;
}

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  status: string;
  pricing_group_id?: number;
  pricingGroup?: PricingGroup;
}

export default function BookingsPage() {
  const { data: session } = useSession() || {};
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, thisMonth, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showNewReservationDialog, setShowNewReservationDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [selectedBookingForContract, setSelectedBookingForContract] = useState<number | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [inspectionType, setInspectionType] = useState<'delivery' | 'return'>('delivery');
  const [selectedBookingForInspection, setSelectedBookingForInspection] = useState<number | null>(null);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [selectedBookingForComparison, setSelectedBookingForComparison] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [showManageFinancialsDialog, setShowManageFinancialsDialog] = useState(false);
  const [selectedBookingForFinancials, setSelectedBookingForFinancials] = useState<Booking | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedBookingForComplete, setSelectedBookingForComplete] = useState<Booking | null>(null);
  const [showChangeVehicleDialog, setShowChangeVehicleDialog] = useState(false);
  const [selectedBookingForChangeVehicle, setSelectedBookingForChangeVehicle] = useState<Booking | null>(null);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [selectedBookingForAddVehicle, setSelectedBookingForAddVehicle] = useState<Booking | null>(null);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [selectedBookingForAddDriver, setSelectedBookingForAddDriver] = useState<Booking | null>(null);
  const [showEditReservationDialog, setShowEditReservationDialog] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [showSignatureChoiceDialog, setShowSignatureChoiceDialog] = useState(false);
  const [showRemoteSignatureDialog, setShowRemoteSignatureDialog] = useState(false);
  const [showSendRemoteSignatureDialog, setShowSendRemoteSignatureDialog] = useState(false);
  const [showResendSignatureDialog, setShowResendSignatureDialog] = useState(false);
  const [newlyCreatedBooking, setNewlyCreatedBooking] = useState<any>(null);
  const [newlyCreatedContractId, setNewlyCreatedContractId] = useState<number | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [selectedBookingForSignature, setSelectedBookingForSignature] = useState<Booking | null>(null);
  const [selectedBookingForResend, setSelectedBookingForResend] = useState<Booking | null>(null);
  const [resendContractId, setResendContractId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    car_id: '',
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_date: '',
    return_date: '',
    total_price: '',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (customerSearchTerm) {
      fetchCustomers(customerSearchTerm);
    }
  }, [customerSearchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Error al cargar reservas');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (!response.ok) throw new Error('Error al cargar vehículos');
      const data = await response.json();
      // Mostrar solo vehículos activos (status 'T' = True/Active)
      // Excluir vehículos vendidos o dados de baja permanente
      const activeVehicles = data.filter((v: Vehicle) => 
        v.status === 'T' && 
        v.registration_number && // Debe tener matrícula
        v.pricing_group_id // Debe tener grupo tarifario asignado
      );
      console.log('✅ Vehículos disponibles para reservas:', activeVehicles.length);
      setVehicles(activeVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Error al cargar la lista de vehículos');
    }
  };

  const fetchCustomers = async (search?: string) => {
    try {
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : '/api/customers';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar clientes');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone?.includes(searchTerm) ||
        booking.car?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        // Reservas en marcha: pickup_date <= hoy <= return_date y status = confirmed
        const now = new Date();
        filtered = filtered.filter(booking => {
          const pickupDate = new Date(booking.pickup_date);
          const returnDate = new Date(booking.return_date);
          return booking.status === 'confirmed' && pickupDate <= now && returnDate >= now;
        });
      } else {
        filtered = filtered.filter(booking => booking.status === statusFilter);
      }
    }

    // Filtro de fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(booking => {
        const pickupDate = new Date(booking.pickup_date);
        const bookingDate = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());

        if (dateFilter === 'today') {
          return bookingDate.getTime() === today.getTime();
        } else if (dateFilter === 'thisMonth') {
          return pickupDate.getMonth() === now.getMonth() && pickupDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Incluir todo el día final
          return pickupDate >= startDate && pickupDate <= endDate;
        }
        return true;
      });
    }

    setFilteredBookings(filtered);
  };

  // Función para calcular precio automáticamente
  const calculatePrice = (vehicleId: string, pickupDate: string, returnDate: string) => {
    if (!vehicleId || !pickupDate || !returnDate) {
      return null;
    }

    const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
    if (!vehicle?.pricingGroup) {
      console.warn('⚠️ Vehículo sin grupo tarifario asignado');
      return null;
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const diffMs = returnD.getTime() - pickup.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const days = Math.ceil(diffHours / 24); // Redondear hacia arriba

    if (days <= 0) {
      console.warn('⚠️ Duración de alquiler inválida');
      return null;
    }

    const pricing = vehicle.pricingGroup;
    let dailyRate = 0;

    // Determinar tarifa según duración
    if (days >= 1 && days <= 3) {
      dailyRate = Number(pricing.price_1_3_days);
    } else if (days >= 4 && days <= 7) {
      dailyRate = Number(pricing.price_4_7_days);
    } else if (days >= 8) {
      dailyRate = Number(pricing.price_8_plus_days);
    }

    const totalPrice = dailyRate * days;
    
    console.log('💰 Cálculo de precio:', {
      vehicleId,
      pricingGroup: pricing.name,
      days,
      dailyRate,
      totalPrice
    });

    return totalPrice;
  };

  // Efecto para calcular precio automáticamente cuando cambian vehículo o fechas
  // Solo se ejecuta al crear una nueva reserva, no al editar
  useEffect(() => {
    // Si estamos editando una reserva, no recalcular automáticamente
    if (editingBooking) {
      return;
    }

    if (formData.car_id && formData.pickup_date && formData.return_date) {
      const calculatedPrice = calculatePrice(
        formData.car_id,
        formData.pickup_date,
        formData.return_date
      );

      if (calculatedPrice !== null && calculatedPrice !== parseFloat(formData.total_price)) {
        setFormData(prev => ({
          ...prev,
          total_price: calculatedPrice.toFixed(2)
        }));
        toast.success(`Precio calculado: €${calculatedPrice.toFixed(2)}`);
      }
    }
  }, [formData.car_id, formData.pickup_date, formData.return_date, editingBooking]);

  const openCreateDialog = () => {
    setEditingBooking(null);
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setFormData({
      car_id: '',
      customer_id: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      pickup_date: '',
      return_date: '',
      total_price: '',
      status: 'confirmed'
    });
    // Abrir el nuevo diálogo de reserva con pasos
    setShowNewReservationDialog(true);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
    setSelectedVehicle(vehicle || null);
    setFormData(prev => ({ ...prev, car_id: vehicleId }));
  };

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    
    // Si el booking tiene un customer_id pero no tiene el objeto customer completo,
    // buscarlo en la lista de customers
    let customerToSet = booking.customer || null;
    if (!customerToSet && booking.customer_id) {
      customerToSet = customers.find(c => c.id === booking.customer_id) || null;
    }
    
    // Si tenemos un customer (ya sea del booking o encontrado en la lista),
    // asegurarnos de que esté en la lista de customers para que el Select lo muestre
    if (customerToSet) {
      const customerExists = customers.some(c => c.id === customerToSet!.id);
      if (!customerExists) {
        // Agregar el customer a la lista temporal
        setCustomers(prev => [...prev, customerToSet!]);
      }
    }
    
    setSelectedCustomer(customerToSet);
    
    // Buscar el vehículo en la lista de vehículos disponibles
    const vehicle = vehicles.find(v => v.id === booking.car_id);
    setSelectedVehicle(vehicle || null);
    
    // Asegurar que el precio se muestre correctamente, incluyendo 0
    const priceValue = booking.total_price !== null && booking.total_price !== undefined 
      ? booking.total_price.toString() 
      : '0';
    
    // Usar los datos del objeto customer si están disponibles, sino usar los campos legacy
    const customerName = customerToSet 
      ? `${customerToSet.first_name} ${customerToSet.last_name}`.trim()
      : booking.customer_name;
    
    setFormData({
      car_id: booking.car_id.toString(),
      customer_id: booking.customer_id ? booking.customer_id.toString() : '',
      customer_name: customerName,
      customer_email: customerToSet?.email || booking.customer_email,
      customer_phone: customerToSet?.phone || booking.customer_phone,
      pickup_date: format(new Date(booking.pickup_date), "yyyy-MM-dd'T'HH:mm"),
      return_date: format(new Date(booking.return_date), "yyyy-MM-dd'T'HH:mm"),
      total_price: priceValue,
      status: booking.status
    });
    setShowDialog(true);
  };

  const openDetailsDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const handleResendSignature = async (booking: Booking) => {
    try {
      // Buscar el contrato asociado a esta reserva
      const response = await fetch(`/api/contracts?bookingId=${booking.id}`);
      
      if (!response.ok) {
        toast.error('No se pudo encontrar el contrato para esta reserva');
        return;
      }

      const contractData = await response.json();
      
      if (!contractData || !contractData.id) {
        toast.error('No existe un contrato para esta reserva');
        return;
      }

      // Configurar los datos y abrir el diálogo
      setSelectedBookingForResend(booking);
      setResendContractId(contractData.id);
      setShowResendSignatureDialog(true);
    } catch (error) {
      console.error('Error al obtener contrato:', error);
      toast.error('Error al buscar el contrato');
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id.toString() === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_email: customer.email || '',
        customer_phone: customer.phone || ''
      });
    }
  };

  const handleNewCustomer = () => {
    setShowCustomerDialog(true);
  };

  const handleCustomerCreated = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer_id: customer.id.toString(),
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_email: customer.email || '',
      customer_phone: customer.phone || ''
    });
    fetchCustomers();
    toast.success('Cliente creado exitosamente');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.car_id || !formData.pickup_date || !formData.return_date) {
      toast.error('Por favor seleccione vehículo, fecha de recogida y devolución');
      return;
    }

    if (!formData.customer_id) {
      toast.error('Por favor seleccione un cliente o cree uno nuevo');
      return;
    }

    try {
      const url = editingBooking ? `/api/bookings/${editingBooking.id}` : '/api/bookings';
      const method = editingBooking ? 'PUT' : 'POST';

      // Manejar el precio correctamente, incluyendo el caso de 0
      const totalPrice = formData.total_price === '' || formData.total_price === null || formData.total_price === undefined 
        ? 0 
        : parseFloat(formData.total_price);
      
      const payload: any = {
        car_id: parseInt(formData.car_id),
        customer_id: parseInt(formData.customer_id),
        pickup_date: formData.pickup_date,
        return_date: formData.return_date,
        total_price: totalPrice,
        status: formData.status
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la reserva');
      }

      toast.success(editingBooking ? 'Reserva actualizada' : 'Reserva creada exitosamente');
      setShowDialog(false);
      fetchBookings();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      toast.error(error.message || 'Error al guardar la reserva');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta reserva?')) return;

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar la reserva');

      toast.success('Reserva eliminada exitosamente');
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Error al eliminar la reserva');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completada', className: 'bg-blue-100 text-blue-800' }
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const calculateDuration = (pickup: string, returnDate: string) => {
    const start = new Date(pickup);
    const end = new Date(returnDate);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(diffHours / 24);
    const hours = Math.floor(diffHours % 24);
    
    if (days === 0) {
      return `${hours}h`;
    } else if (hours === 0) {
      return `${days}d`;
    } else {
      return `${days}d ${hours}h`;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Reservas</h1>
        <p className="text-gray-600">Administra todas las reservas del sistema</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, email, teléfono o matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">En Marcha</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="thisMonth">Este Mes</SelectItem>
                <SelectItem value="custom">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range (shown when dateFilter is 'custom') */}
          {dateFilter === 'custom' && (
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-4 pt-4 border-t border-gray-200">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                  Desde
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 max-w-xs">
                <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                  Hasta
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              {customStartDate && customEndDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setDateFilter('all');
                  }}
                  className="mt-6"
                >
                  Limpiar
                </Button>
              )}
            </div>
          )}

          {/* Create Button */}
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>

        {/* Stats - Calculados sobre reservas filtradas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Total Reservas</p>
            <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Confirmadas</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredBookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ingresos Totales</p>
            <p className="text-2xl font-bold text-blue-600">
              €{filteredBookings.reduce((sum, b) => sum + Number(b.total_price), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Precio Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No se encontraron reservas
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">#{booking.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-gray-500">{booking.customer_email}</p>
                      {booking.customer_phone && (
                        <p className="text-sm text-gray-500">{booking.customer_phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.vehicles && booking.vehicles.length > 0 ? (
                      <div className="space-y-1">
                        {booking.vehicles.map((vehicle, idx) => (
                          <div key={vehicle.id} className="flex items-center">
                            <Car className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <p className="font-medium">
                                {booking.vehicles!.length > 1 && `${idx + 1}. `}
                                {vehicle.car.registration_number}
                              </p>
                              <p className="text-sm text-gray-500">
                                {vehicle.car.make} {vehicle.car.model}
                              </p>
                            </div>
                          </div>
                        ))}
                        {booking.vehicles.length > 1 && (
                          <span className="text-xs text-blue-600 font-medium">
                            {booking.vehicles.length} vehículos
                          </span>
                        )}
                      </div>
                    ) : booking.car ? (
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <p className="font-medium">{booking.car.registration_number}</p>
                          <p className="text-sm text-gray-500">
                            {booking.car.make} {booking.car.model}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin vehículo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">
                        {format(new Date(booking.pickup_date), 'dd MMM yyyy HH:mm', { locale: es })}
                      </p>
                      <p className="text-gray-500">
                        {format(new Date(booking.return_date), 'dd MMM yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {calculateDuration(booking.pickup_date, booking.return_date)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    €{Number(booking.total_price).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForContract(booking.id);
                          setShowContractDialog(true);
                        }}
                        title="Ver/Firmar Contrato"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendSignature(booking)}
                        title="Reenviar Enlace de Firma"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForInspection(booking.id);
                          setInspectionType('delivery');
                          setShowInspectionDialog(true);
                        }}
                        title="Inspección de Entrega"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForInspection(booking.id);
                          setInspectionType('return');
                          setShowInspectionDialog(true);
                        }}
                        title="Inspección de Devolución"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForComparison(booking.id);
                          setShowComparisonDialog(true);
                        }}
                        title="Comparar Inspecciones"
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <GitCompare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForFinancials(booking);
                          setShowManageFinancialsDialog(true);
                        }}
                        title="Gestión Financiera"
                        className="text-green-600 hover:text-green-700"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForChangeVehicle(booking);
                          setShowChangeVehicleDialog(true);
                        }}
                        title="Cambiar Vehículo"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Car className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForAddVehicle(booking);
                          setShowAddVehicleDialog(true);
                        }}
                        title="Añadir Vehículos"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Plus className="h-3.5 w-3.5 mr-0.5" />
                        <Car className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForEdit(booking);
                          setShowEditReservationDialog(true);
                        }}
                        title="Editar Reserva Completa (Conductores, Documentos, etc.)"
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForAddDriver(booking);
                          setShowAddDriverDialog(true);
                        }}
                        title="Añadir Conductores"
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsDialog(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(booking)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBooking ? 'Editar Reserva' : 'Nueva Reserva'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cliente
                </h3>
                <Button
                  type="button"
                  onClick={handleNewCustomer}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customer_id">Seleccionar Cliente Existente *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.first_name} {customer.last_name} - {customer.dni_nie} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <div className="bg-white border border-blue-200 rounded p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-gray-600">Nombre:</span>
                        <p className="text-gray-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">DNI/NIE:</span>
                        <p className="text-gray-900">{selectedCustomer.dni_nie}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Teléfono:</span>
                        <p className="text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900">{selectedCustomer.email || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600">Dirección:</span>
                        <p className="text-gray-900">
                          {selectedCustomer.street_address}, {selectedCustomer.city}, {selectedCustomer.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mostrar información de vehículos múltiples si aplica */}
            {editingBooking?.vehicles && editingBooking.vehicles.length > 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="bg-amber-100 rounded-full p-1">
                    <Car className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">
                      Reserva Multi-Vehículo ({editingBooking.vehicles.length} vehículos)
                    </h3>
                    <div className="space-y-2 mb-3">
                      {editingBooking.vehicles.map((vehicle, idx) => (
                        <div key={vehicle.id} className="bg-white border border-amber-200 rounded p-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-700">{idx + 1}.</span>
                              <div>
                                <p className="font-semibold">{vehicle.car.registration_number}</p>
                                <p className="text-gray-600 text-xs">
                                  {vehicle.car.make} {vehicle.car.model}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Precio</p>
                              <p className="font-semibold text-amber-700">
                                €{Number(vehicle.vehicle_price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700">
                      ℹ️ Esta reserva tiene múltiples vehículos asignados. Las fechas, estado y precio total 
                      se aplicarán a todos los vehículos. Para cambiar los vehículos de esta reserva, 
                      utilice la vista de Planificación.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Vehicle */}
              <div className="col-span-2">
                <Label htmlFor="car_id">
                  Vehículo *
                  {editingBooking?.vehicles && editingBooking.vehicles.length > 1 && (
                    <span className="text-xs text-amber-600 ml-2 font-normal">
                      (Solo para referencia - ver listado arriba)
                    </span>
                  )}
                </Label>
                <Select
                  value={formData.car_id}
                  onValueChange={handleVehicleSelect}
                  disabled={editingBooking?.vehicles && editingBooking.vehicles.length > 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        No hay vehículos disponibles con grupo tarifario asignado
                      </div>
                    ) : (
                      vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                          {vehicle.pricingGroup && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Grupo: {vehicle.pricingGroup.name})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedVehicle?.pricingGroup && !(editingBooking?.vehicles && editingBooking.vehicles.length > 1) && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="font-semibold text-blue-900">Tarifas de {selectedVehicle.pricingGroup.name}:</p>
                    <div className="grid grid-cols-3 gap-2 mt-1 text-gray-700">
                      <div>
                        <span className="font-medium">1-3 días:</span> €{Number(selectedVehicle.pricingGroup.price_1_3_days).toFixed(2)}/día
                      </div>
                      <div>
                        <span className="font-medium">4-7 días:</span> €{Number(selectedVehicle.pricingGroup.price_4_7_days).toFixed(2)}/día
                      </div>
                      <div>
                        <span className="font-medium">8+ días:</span> €{Number(selectedVehicle.pricingGroup.price_8_plus_days).toFixed(2)}/día
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Date */}
              <div>
                <Label htmlFor="pickup_date">Fecha y Hora de Recogida *</Label>
                <Input
                  id="pickup_date"
                  type="datetime-local"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  required
                />
              </div>

              {/* Return Date */}
              <div>
                <Label htmlFor="return_date">Fecha y Hora de Devolución *</Label>
                <Input
                  id="return_date"
                  type="datetime-local"
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  required
                />
              </div>

              {/* Total Price */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="total_price">
                    Precio Total (€)
                    {!editingBooking && formData.total_price && (
                      <span className="text-xs text-green-600 ml-2">✓ Calculado automáticamente</span>
                    )}
                  </Label>
                  {editingBooking && formData.car_id && formData.pickup_date && formData.return_date && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const calculatedPrice = calculatePrice(
                          formData.car_id,
                          formData.pickup_date,
                          formData.return_date
                        );
                        if (calculatedPrice !== null) {
                          setFormData(prev => ({
                            ...prev,
                            total_price: calculatedPrice.toFixed(2)
                          }));
                          toast.success(`Precio recalculado: €${calculatedPrice.toFixed(2)}`);
                        } else {
                          toast.error('No se pudo calcular el precio');
                        }
                      }}
                      className="text-xs"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Recalcular
                    </Button>
                  )}
                </div>
                <Input
                  id="total_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                  placeholder="Seleccione vehículo y fechas"
                  className={formData.total_price ? 'bg-green-50 border-green-300' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {!editingBooking 
                    ? 'El precio se calcula automáticamente. Puede ajustarlo manualmente si es necesario.'
                    : 'Puede modificar el precio manualmente (incluyendo 0 para devoluciones sin cargo). Use el botón Recalcular si necesita calcular el precio automático.'}
                </p>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    // Si está intentando completar la reserva, usar el diálogo especial
                    if (value === 'completed' && editingBooking && editingBooking.status !== 'completed') {
                      setShowDialog(false);
                      setSelectedBookingForComplete(editingBooking);
                      setShowCompleteDialog(true);
                    } else {
                      setFormData({ ...formData, status: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">
                      {editingBooking?.status === 'completed' ? 'Completada' : 'Completada (genera factura)'}
                    </SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                {formData.status !== 'completed' && editingBooking && (
                  <p className="text-xs text-gray-500 mt-1">
                    Para completar la reserva y generar factura, seleccione "Completada"
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingBooking ? 'Actualizar' : 'Crear'} Reserva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Reserva</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">ID de Reserva</Label>
                  <p className="font-semibold">#{selectedBooking.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Información del Cliente</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-600">Nombre</Label>
                    <p className="font-medium">
                      {selectedBooking.customer 
                        ? `${selectedBooking.customer.first_name} ${selectedBooking.customer.last_name || ''}`.trim()
                        : selectedBooking.customer_name || 'No proporcionado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p>
                      {selectedBooking.customer?.email || selectedBooking.customer_email || 'No proporcionado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Teléfono</Label>
                    <p>
                      {selectedBooking.customer?.phone || selectedBooking.customer_phone || 'No proporcionado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">
                  Información del Vehículo
                  {selectedBooking.vehicles && selectedBooking.vehicles.length > 1 && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      ({selectedBooking.vehicles.length} vehículos)
                    </span>
                  )}
                </h3>
                {selectedBooking.vehicles && selectedBooking.vehicles.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBooking.vehicles.map((vehicle, idx) => (
                      <div key={vehicle.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1">
                            <Car className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-lg">
                                {selectedBooking.vehicles && selectedBooking.vehicles.length > 1 && `${idx + 1}. `}
                                {vehicle.car.registration_number}
                              </p>
                              <p className="text-gray-600">
                                {vehicle.car.make} {vehicle.car.model}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-gray-600">Precio del vehículo</p>
                            <p className="font-semibold text-lg text-blue-600">
                              €{Number(vehicle.vehicle_price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedBooking.car ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Car className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="font-semibold text-lg">{selectedBooking.car.registration_number}</p>
                        <p className="text-gray-600">
                          {selectedBooking.car.make} {selectedBooking.car.model}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Sin vehículo asignado</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Detalles de la Reserva</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Fecha y Hora de Recogida</Label>
                    <p className="font-medium">
                      {format(new Date(selectedBooking.pickup_date), 'dd MMMM yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Fecha y Hora de Devolución</Label>
                    <p className="font-medium">
                      {format(new Date(selectedBooking.return_date), 'dd MMMM yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Duración</Label>
                    <p className="font-medium">
                      {calculateDuration(selectedBooking.pickup_date, selectedBooking.return_date)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Precio Total</Label>
                    <p className="font-semibold text-lg text-blue-600">
                      €{Number(selectedBooking.total_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSuccess={handleCustomerCreated}
      />

      {/* Contract Signature Dialog */}
      {selectedBookingForContract && (
        <ContractSignature
          bookingId={selectedBookingForContract}
          open={showContractDialog}
          onOpenChange={setShowContractDialog}
          onSigned={() => {
            toast.success('Contrato firmado exitosamente');
            fetchBookings();
          }}
        />
      )}

      {/* Vehicle Inspection Dialog */}
      {selectedBookingForInspection && (
        <VehicleInspection
          bookingId={selectedBookingForInspection}
          inspectionType={inspectionType}
          open={showInspectionDialog}
          onOpenChange={setShowInspectionDialog}
          onCompleted={() => {
            toast.success('Inspección guardada exitosamente');
            fetchBookings();
          }}
        />
      )}

      {/* Inspection Comparison Dialog */}
      {selectedBookingForComparison && (
        <InspectionComparison
          bookingId={selectedBookingForComparison}
          open={showComparisonDialog}
          onOpenChange={setShowComparisonDialog}
        />
      )}

      {/* New Reservation Dialog with Steps */}
      <NewReservationDialog
        open={showNewReservationDialog}
        onOpenChange={setShowNewReservationDialog}
        onReservationCreated={(booking, contractId) => {
          fetchBookings();
          setShowNewReservationDialog(false);
          
          // Si se generó el contrato, mostrar diálogo para enviar firma remota
          if (booking && contractId) {
            setNewlyCreatedBooking(booking);
            setNewlyCreatedContractId(contractId);
            
            // Esperar un momento para que se cierre el diálogo de nueva reserva
            setTimeout(() => {
              setShowSendRemoteSignatureDialog(true);
            }, 300);
          }
        }}
      />

      {/* Manage Booking Financials Dialog */}
      {selectedBookingForFinancials && (
        <ManageBookingFinancialsDialog
          open={showManageFinancialsDialog}
          onOpenChange={setShowManageFinancialsDialog}
          booking={selectedBookingForFinancials}
          onSuccess={() => {
            toast.success('Reserva actualizada exitosamente');
            fetchBookings();
            setShowManageFinancialsDialog(false);
            setSelectedBookingForFinancials(null);
          }}
        />
      )}

      {/* Complete Reservation Dialog */}
      {selectedBookingForComplete && (
        <CompleteReservationDialog
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          booking={selectedBookingForComplete}
          onSuccess={() => {
            toast.success('Reserva completada y factura generada exitosamente');
            fetchBookings();
            setShowCompleteDialog(false);
          }}
          onShowSignatureChoice={(contractId) => {
            setSelectedContractId(contractId);
            setSelectedBookingForSignature(selectedBookingForComplete);
            setShowSignatureChoiceDialog(true);
            setSelectedBookingForComplete(null);
          }}
        />
      )}

      {/* Signature Choice Dialog */}
      {selectedBookingForSignature && selectedContractId && (
        <ContractSignatureChoiceDialog
          open={showSignatureChoiceDialog}
          onOpenChange={setShowSignatureChoiceDialog}
          booking={selectedBookingForSignature}
          onPresencialChoice={() => {
            setShowContractDialog(true);
            setSelectedBookingForContract(selectedBookingForSignature.id);
            setShowSignatureChoiceDialog(false);
          }}
          onRemoteChoice={() => {
            setShowRemoteSignatureDialog(true);
            setShowSignatureChoiceDialog(false);
          }}
        />
      )}

      {/* Remote Signature Dialog */}
      {selectedBookingForSignature && selectedContractId && (
        <RemoteSignatureDialog
          open={showRemoteSignatureDialog}
          onOpenChange={setShowRemoteSignatureDialog}
          booking={selectedBookingForSignature}
          contractId={selectedContractId}
          onSuccess={() => {
            toast.success('Enlace de firma enviado correctamente');
            setShowRemoteSignatureDialog(false);
            setSelectedBookingForSignature(null);
            setSelectedContractId(null);
          }}
        />
      )}

      {/* Change Vehicle Dialog */}
      {selectedBookingForChangeVehicle && (
        <ChangeVehicleDialog
          open={showChangeVehicleDialog}
          onOpenChange={setShowChangeVehicleDialog}
          reservation={selectedBookingForChangeVehicle as any}
          onVehicleChanged={() => {
            toast.success('Vehículo cambiado exitosamente');
            fetchBookings();
            setShowChangeVehicleDialog(false);
            setSelectedBookingForChangeVehicle(null);
          }}
        />
      )}

      {/* Add Vehicle Dialog */}
      {selectedBookingForAddVehicle && (
        <AddVehicleDialog
          open={showAddVehicleDialog}
          onOpenChange={setShowAddVehicleDialog}
          reservation={selectedBookingForAddVehicle as any}
          onVehicleAdded={() => {
            toast.success('Vehículo(s) añadido(s) exitosamente');
            fetchBookings();
            setShowAddVehicleDialog(false);
            setSelectedBookingForAddVehicle(null);
          }}
        />
      )}

      {/* Add Driver Dialog */}
      {selectedBookingForAddDriver && (
        <AddDriverDialog
          open={showAddDriverDialog}
          onOpenChange={setShowAddDriverDialog}
          reservation={selectedBookingForAddDriver as any}
          onDriverAdded={() => {
            toast.success('Conductor(es) añadido(s) exitosamente');
            fetchBookings();
            setShowAddDriverDialog(false);
            setSelectedBookingForAddDriver(null);
          }}
        />
      )}

      {/* Edit Reservation Dialog */}
      {selectedBookingForEdit && (
        <EditReservationDialog
          open={showEditReservationDialog}
          onOpenChange={setShowEditReservationDialog}
          reservation={selectedBookingForEdit as any}
          onReservationUpdated={() => {
            toast.success('Reserva actualizada exitosamente');
            fetchBookings();
            setShowEditReservationDialog(false);
            setSelectedBookingForEdit(null);
          }}
        />
      )}

      {/* Send Remote Signature Dialog - After creating new reservation */}
      {newlyCreatedBooking && newlyCreatedContractId && (
        <SendRemoteSignatureDialog
          open={showSendRemoteSignatureDialog}
          onOpenChange={setShowSendRemoteSignatureDialog}
          booking={newlyCreatedBooking}
          contractId={newlyCreatedContractId}
          onSent={() => {
            toast.success('Enlace de firma enviado correctamente');
            fetchBookings();
          }}
        />
      )}

      {/* Resend Signature Dialog - For existing reservations */}
      {selectedBookingForResend && resendContractId && (
        <SendRemoteSignatureDialog
          open={showResendSignatureDialog}
          onOpenChange={setShowResendSignatureDialog}
          booking={selectedBookingForResend}
          contractId={resendContractId}
          onSent={() => {
            toast.success('Enlace de firma reenviado correctamente');
            fetchBookings();
            setShowResendSignatureDialog(false);
            setSelectedBookingForResend(null);
            setResendContractId(null);
          }}
        />
      )}
    </div>
  );
}
