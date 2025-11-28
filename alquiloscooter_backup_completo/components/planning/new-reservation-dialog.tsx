
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Phone, Mail, Car, Clock, Calculator, Search, ChevronRight, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExtrasUpgradesSelector } from '@/components/modals/extras-upgrades-selector';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { QuickDocumentUpload } from './quick-document-upload';
import { getVehicleVisualNumber } from '@/lib/vehicle-display';

interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  status: string;
  type?: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
}

interface WorkingHours {
  day_of_week: number;
  is_working_day: boolean;
  opening_time: string;
  closing_time: string;
}

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReservationCreated: (booking?: any, contractId?: number | null) => void;
  preselectedVehicleId?: string;
  preselectedDate?: Date;
}

interface Driver {
  full_name: string;
  dni_nie?: string;
  driver_license?: string;
  license_expiry?: string;
  phone?: string;  // Opcional para conductores adicionales
  email?: string;
  date_of_birth?: string;
  assigned_vehicle_id: string;  // Obligatorio para asignación manual
  notes?: string;
}

export function NewReservationDialog({
  open,
  onOpenChange,
  onReservationCreated,
  preselectedVehicleId,
  preselectedDate
}: NewReservationDialogProps) {
  // Estados principales
  const [currentStep, setCurrentStep] = useState<'dates' | 'vehicle' | 'extras' | 'drivers' | 'customer' | 'confirm'>('dates');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Estados para búsqueda de cliente
  const [customerSearchMode, setCustomerSearchMode] = useState<'search' | 'new'>('search');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  
  // Vehículos seleccionados con sus precios individuales
  const [selectedVehicles, setSelectedVehicles] = useState<Array<{ id: string; price: number; registration_number?: string; make?: string; model?: string }>>([]);
  
  // Extras, Upgrades y Experiencias seleccionados
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id: number; name: string; quantity: number; unitPrice: number; totalPrice: number }>>([]);
  const [selectedUpgrades, setSelectedUpgrades] = useState<Array<{ id: number; name: string; days: number; unitPricePerDay: number; totalPrice: number }>>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<Array<{ id: number; name: string; quantity: number; unitPrice: number; totalPrice: number }>>([]);
  
  // Conductores (uno por cada vehículo)
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Documentos del cliente para subir durante la reserva rápida
  const [customerDocuments, setCustomerDocuments] = useState<{ [key: string]: File | null }>({
    id_front: null,
    id_back: null,
    license_front: null,
    license_back: null
  });

  // ✅ NUEVO: Manejar datos extraídos del OCR
  const handleExtractedDocumentData = (data: any) => {
    console.log('[FORMULARIO-RESERVAS] Recibiendo datos del OCR:', data);
    
    // Actualizar formData con los datos extraídos
    setFormData(prev => {
      const updated = { ...prev };
      
      // Nombre y apellido
      if (data.firstName) updated.customer_first_name = data.firstName;
      if (data.lastName) updated.customer_last_name = data.lastName;
      
      // Dirección y ciudad
      if (data.address) updated.customer_address = data.address;
      if (data.city) updated.customer_city = data.city;
      
      console.log('[FORMULARIO-RESERVAS] Formulario actualizado:', updated);
      return updated;
    });
    
    console.log('[FORMULARIO-RESERVAS] Datos aplicados correctamente');
  };
  
  const [formData, setFormData] = useState({
    // Paso 1: Fechas
    pickup_date: preselectedDate ? preselectedDate.toISOString().split('T')[0] : '',
    pickup_time: '09:00',
    return_date: '',
    return_time: '19:00',
    pickup_location_id: 'none', // ✅ Ubicación de recogida
    return_location_id: 'none', // ✅ Ubicación de devolución
    // Paso 2: Vehículo (legacy - ahora usamos selectedVehicles)
    car_id: preselectedVehicleId || '',
    // Paso 3: Cliente
    customer_id: '',
    customer_first_name: '',
    customer_last_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_city: '',
    // Paso 4: Confirmación
    total_price: '',
    status: 'confirmed',
    // Descuentos
    discount_type: 'amount' as 'amount' | 'percentage',
    discount_value: ''
  });

  // Helper: Obtener horario laboral para un día específico
  const getWorkingHoursForDay = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T12:00:00');
    const dayOfWeek = date.getDay();
    return workingHours.find(h => h.day_of_week === dayOfWeek);
  };

  // Helper: Generar opciones de horario (intervalos de 15 minutos)
  const generateTimeOptions = (dateString: string, isReturnTime: boolean = false) => {
    // Si no hay fecha, devolver horario por defecto con intervalos de 15 minutos
    if (!dateString) {
      return ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
              '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
              '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45',
              '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45',
              '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45',
              '19:00'];
    }
    
    const hours = getWorkingHoursForDay(dateString);
    const defaultOpenHour = 9;
    const defaultCloseHour = 19;
    
    // Determinar el rango de horas - SIEMPRE usar horario extendido hasta las 19:00
    let openHour = hours?.is_working_day 
      ? parseInt(hours.opening_time.split(':')[0]) 
      : defaultOpenHour;
    let closeHour = hours?.is_working_day 
      ? parseInt(hours.closing_time.split(':')[0]) 
      : defaultCloseHour;
    
    // Asegurar que el horario de cierre sea al menos las 19:00 para permitir reservas flexibles
    if (closeHour < 19) {
      closeHour = 19;
    }
    
    // Generar todas las opciones del día con intervalos de 15 minutos
    const options = [];
    for (let h = openHour; h <= closeHour; h++) {
      options.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < closeHour) {
        options.push(`${h.toString().padStart(2, '0')}:15`);
        options.push(`${h.toString().padStart(2, '0')}:30`);
        options.push(`${h.toString().padStart(2, '0')}:45`);
      }
    }

    // Si es hora de devolución y es el mismo día que la recogida, filtrar horas anteriores
    if (isReturnTime && formData.pickup_date && formData.return_date && 
        formData.pickup_date === formData.return_date && formData.pickup_time) {
      
      const [pickupHour, pickupMinute] = formData.pickup_time.split(':').map(Number);
      
      // Filtrar para mostrar SOLO horas posteriores a la de recogida
      const filteredOptions = options.filter(time => {
        const [h, m] = time.split(':').map(Number);
        // Aceptar si la hora es mayor, o si es la misma hora pero con minutos mayores
        return (h > pickupHour) || (h === pickupHour && m > pickupMinute);
      });
      
      return filteredOptions;
    }

    // Para días diferentes o para pickup, devolver todas las opciones
    return options;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar vehículos
        const vehiclesRes = await fetch('/api/vehicles');
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          setVehicles(vehiclesData);
        }

        // Cargar clientes desde el endpoint correcto
        const customersRes = await fetch('/api/customers');
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setAllCustomers(customersData.map((customer: any) => ({
            id: customer.id.toString(),
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.street_address || '',
            city: customer.city || ''
          })));
        }

        // Cargar horarios
        const hoursRes = await fetch('/api/working-hours');
        if (hoursRes.ok) {
          const hoursData = await hoursRes.json();
          setWorkingHours(hoursData);
          
          const today = new Date().getDay();
          const todayHours = hoursData.find((h: WorkingHours) => h.day_of_week === today);
          if (todayHours) {
            setFormData(prev => ({
              ...prev,
              pickup_time: todayHours.opening_time,
              return_time: todayHours.closing_time
            }));
          }
        }

        // ✅ Cargar SOLO ubicaciones públicas
        const locationsRes = await fetch('/api/business-locations');
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          // ✅ Filtrar solo ubicaciones públicas (is_public_pickup_point = true)
          const publicLocations = locationsData.filter((loc: any) => loc.is_public_pickup_point === true);
          setLocations(publicLocations.map((loc: any) => ({
            id: loc.id,
            name: loc.name
          })));
          
          // ✅ Precargar "Marbella" como ubicación por defecto si existe
          const marbellaLocation = publicLocations.find((loc: any) => 
            loc.name?.toLowerCase().includes('marbella')
          );
          if (marbellaLocation) {
            setFormData(prev => ({
              ...prev,
              pickup_location_id: marbellaLocation.id.toString(),
              return_location_id: marbellaLocation.id.toString()
            }));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    if (open) {
      loadData();
      // Resetear al abrir
      setCurrentStep('dates');
      setSelectedCustomer(null);
      setCustomerSearch('');
      setCustomerSearchMode('search');
      setSelectedExtras([]);
      setSelectedUpgrades([]);
      setSelectedExperiences([]);
    }
  }, [open]);

  // Actualizar días de upgrades cuando cambian las fechas
  useEffect(() => {
    if (selectedUpgrades.length > 0 && formData.pickup_date && formData.return_date) {
      const days = getRentalDays();
      const updatedUpgrades = selectedUpgrades.map(upgrade => ({
        ...upgrade,
        days,
        totalPrice: upgrade.unitPricePerDay * days
      }));
      setSelectedUpgrades(updatedUpgrades);
    }
  }, [formData.pickup_date, formData.return_date, formData.pickup_time, formData.return_time]);

  // Update form when preselected values change
  useEffect(() => {
    if (preselectedVehicleId) {
      setFormData(prev => ({ ...prev, car_id: preselectedVehicleId }));
      // Si hay vehículo preseleccionado, ir directamente al paso de fechas
      setCurrentStep('dates');
    }
    if (preselectedDate) {
      setFormData(prev => ({ 
        ...prev, 
        pickup_date: preselectedDate.toISOString().split('T')[0] 
      }));
    }
  }, [preselectedVehicleId, preselectedDate]);

  // Verificar disponibilidad de vehículos cuando cambien las fechas
  const checkVehicleAvailability = async () => {
    if (!formData.pickup_date || !formData.pickup_time || !formData.return_date || !formData.return_time) {
      toast.error('Por favor completa todas las fechas y horarios');
      return;
    }

    const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}:00`);
    const returnDateTime = new Date(`${formData.return_date}T${formData.return_time}:00`);

    if (returnDateTime <= pickupDateTime) {
      toast.error('La fecha de devolución debe ser posterior a la de recogida');
      return;
    }

    try {
      setCheckingAvailability(true);
      
      // Obtener todas las reservas en ese rango de fechas
      const bookingsRes = await fetch(
        `/api/bookings?start=${pickupDateTime.toISOString()}&end=${returnDateTime.toISOString()}`
      );
      
      if (!bookingsRes.ok) {
        const errorData = await bookingsRes.json();
        toast.error(`❌ Error verificando disponibilidad: ${errorData.message || 'Error del servidor'}`, {
          duration: 5000,
          style: { background: '#ef4444', color: 'white' }
        });
        return;
      }
      
      const bookings = await bookingsRes.json();
      
      // ✅ CORRECCIÓN CRÍTICA: Extraer IDs de vehículos de AMBAS fuentes
      const reservedCarIds = new Set<string>();
      
      bookings.forEach((b: any) => {
        // 1. Reservas legacy con car_id directo
        if (b.car_id) {
          reservedCarIds.add(b.car_id.toString());
        }
        
        // 2. Reservas nuevas con relación vehicles (tabla bookingVehicles)
        if (b.vehicles && Array.isArray(b.vehicles)) {
          b.vehicles.forEach((v: any) => {
            if (v.car_id) {
              reservedCarIds.add(v.car_id.toString());
            }
          });
        }
      });
      
      console.log(`🔍 [DISPONIBILIDAD] Vehículos reservados detectados:`, Array.from(reservedCarIds));
      console.log(`🔍 [DISPONIBILIDAD] Total vehículos en sistema:`, vehicles.length);
      
      // ✅ CRÍTICO: Convertir v.id a string para comparación con Set
      const available = vehicles.filter(v => !reservedCarIds.has(v.id.toString()) && v.status === 'T');
      
      console.log(`✅ [DISPONIBILIDAD] Vehículos disponibles: ${available.length}`, available.map(v => `${v.registration_number} (ID:${v.id})`));
      
      if (available.length === 0) {
        toast.error('❌ No hay vehículos disponibles para esas fechas', {
          duration: 5000,
          style: { background: '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold' }
        });
        setAvailableVehicles([]);
      } else {
        setAvailableVehicles(available);
        toast.success(`✅ ${available.length} vehículo(s) disponible(s)`, {
          style: { background: '#10b981', color: 'white', fontSize: '16px', fontWeight: 'bold' }
        });
        setCurrentStep('vehicle');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      toast.error(`❌ Error verificando disponibilidad: ${errorMsg}`, {
        duration: 6000,
        style: { background: '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold' }
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Calcular precio de un vehículo específico
  const calculateVehiclePrice = async (carId: string): Promise<number> => {
    try {
      const pickupDateTime = `${formData.pickup_date}T${formData.pickup_time}:00`;
      const returnDateTime = `${formData.return_date}T${formData.return_time}:00`;

      const response = await fetch('/api/pricing-groups/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: carId,
          pickup_datetime: pickupDateTime,
          return_datetime: returnDateTime,
          include_insurance: includeInsurance,
        }),
      });

      if (response.ok) {
        const priceData = await response.json();
        const price = Number(priceData.total);
        return isNaN(price) ? 0 : price;
      } else {
        const errorData = await response.json();
        console.error('Error response calculating price:', errorData);
        toast.error(`⚠️ Error calculando precio del vehículo: ${errorData.message || 'Error desconocido'}`, {
          duration: 5000,
          style: { background: '#f59e0b', color: 'white', fontSize: '14px' }
        });
        return 0;
      }
    } catch (error) {
      console.error('Error calculating price for vehicle:', carId, error);
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      toast.error(`⚠️ Error calculando precio: ${errorMsg}`, {
        duration: 5000,
        style: { background: '#f59e0b', color: 'white', fontSize: '14px' }
      });
      return 0;
    }
  };

  // Calcular precio total de todos los vehículos seleccionados
  const calculateTotalPrice = async () => {
    setCalculating(true);
    try {
      let total = 0;
      const updatedVehicles = [];
      
      for (const vehicle of selectedVehicles) {
        const price = await calculateVehiclePrice(vehicle.id);
        updatedVehicles.push({ ...vehicle, price });
        total += price;
      }
      
      setSelectedVehicles(updatedVehicles);
      const totalNumber = Number(total);
      setFormData(prev => ({ ...prev, total_price: isNaN(totalNumber) ? '0.00' : totalNumber.toFixed(2) }));
      
      return total;
    } catch (error) {
      console.error('Error calculating total price:', error);
      toast.error('Error calculando precio total');
      return 0;
    } finally {
      setCalculating(false);
    }
  };

  // Calcular días de alquiler
  const getRentalDays = (): number => {
    if (!formData.pickup_date || !formData.return_date) return 1;
    
    const pickup = new Date(`${formData.pickup_date}T${formData.pickup_time || '00:00'}`);
    const returnDate = new Date(`${formData.return_date}T${formData.return_time || '23:59'}`);
    
    const diffTime = Math.abs(returnDate.getTime() - pickup.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  };

  // Calcular precio final con descuento
  const calculateFinalPrice = (): number => {
    const basePrice = parseFloat(formData.total_price) || 0;
    
    // Calcular total de extras
    const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.totalPrice, 0);
    
    // Calcular total de upgrades
    const upgradesTotal = selectedUpgrades.reduce((sum, upgrade) => sum + upgrade.totalPrice, 0);
    
    // Calcular total de experiencias
    const experiencesTotal = selectedExperiences.reduce((sum, exp) => sum + exp.totalPrice, 0);
    
    // Total antes de descuento
    const subtotal = basePrice + extrasTotal + upgradesTotal + experiencesTotal;
    
    const discountValue = parseFloat(formData.discount_value) || 0;
    
    if (discountValue === 0) return subtotal;
    
    if (formData.discount_type === 'percentage') {
      // Descuento en porcentaje
      const discountAmount = (subtotal * discountValue) / 100;
      return Math.max(0, subtotal - discountAmount);
    } else {
      // Descuento en cantidad fija
      return Math.max(0, subtotal - discountValue);
    }
  };

  // Seleccionar/Deseleccionar vehículo (soporte múltiple)
  const handleVehicleToggle = async (vehicle: Vehicle) => {
    const isSelected = selectedVehicles.some(v => v.id === vehicle.id);
    
    if (isSelected) {
      // Deseleccionar
      const newSelection = selectedVehicles.filter(v => v.id !== vehicle.id);
      setSelectedVehicles(newSelection);
      
      // Recalcular precio total
      const total = newSelection.reduce((sum, v) => sum + (Number(v.price) || 0), 0);
      const totalNumber = Number(total);
      setFormData(prev => ({ ...prev, total_price: isNaN(totalNumber) ? '0.00' : totalNumber.toFixed(2) }));
    } else {
      // Seleccionar y calcular su precio
      try {
        setCalculating(true);
        const price = await calculateVehiclePrice(vehicle.id);
        const newVehicle = {
          id: vehicle.id,
          price,
          registration_number: vehicle.registration_number,
          make: vehicle.make,
          model: vehicle.model
        };
        
        const newSelection = [...selectedVehicles, newVehicle];
        setSelectedVehicles(newSelection);
        
        // Actualizar precio total
        const total = newSelection.reduce((sum, v) => sum + (Number(v.price) || 0), 0);
        const totalNumber = Number(total);
        setFormData(prev => ({ ...prev, total_price: isNaN(totalNumber) ? '0.00' : totalNumber.toFixed(2) }));
      } catch (error) {
        console.error('Error calculating vehicle price:', error);
        toast.error('Error calculando precio del vehículo');
      } finally {
        setCalculating(false);
      }
    }
  };

  // Continuar al siguiente paso desde selección de vehículos
  const handleContinueFromVehicles = () => {
    if (selectedVehicles.length === 0) {
      toast.error('Debes seleccionar al menos un vehículo');
      return;
    }
    setCurrentStep('extras');
  };

  // Buscar cliente - BÚSQUEDA INTELIGENTE
  useEffect(() => {
    if (customerSearch.trim()) {
      const searchTerm = customerSearch.toLowerCase();
      
      const filtered = allCustomers.filter(c => {
        const firstName = c.first_name.toLowerCase();
        const lastName = c.last_name.toLowerCase();
        const phone = c.phone;
        
        // ✅ Prioridad 1: Coincidencia al INICIO del nombre o primer apellido
        const startsWithFirstName = firstName.startsWith(searchTerm);
        const startsWithLastName = lastName.startsWith(searchTerm);
        
        // ✅ Prioridad 2: Coincidencia exacta en teléfono
        const phoneMatch = phone.includes(searchTerm);
        
        return startsWithFirstName || startsWithLastName || phoneMatch;
      });
      
      // Mostrar hasta 10 resultados
      setFilteredCustomers(filtered.slice(0, 10));
    } else {
      setFilteredCustomers([]);
    }
  }, [customerSearch, allCustomers]);

  // Seleccionar cliente existente
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email || '',
      customer_phone: customer.phone,
      customer_address: customer.address || '',
      customer_city: customer.city || '',
    }));
    setCustomerSearch('');
  };

  // Crear reserva
  const handleSubmit = async () => {
    console.log('🚀 [INICIO] handleSubmit ejecutado');
    console.log('📋 Estado actual:', {
      selectedVehicles,
      formData,
      customerSearchMode,
      selectedCustomer,
      selectedExtras,
      selectedUpgrades,
      drivers
    });

    // Validación final
    if (selectedVehicles.length === 0 || !formData.pickup_date || !formData.return_date) {
      console.error('❌ Validación fallida: faltan datos obligatorios');
      toast.error('Faltan datos obligatorios: debes seleccionar al menos un vehículo y las fechas');
      return;
    }

    if (customerSearchMode === 'new' && (!formData.customer_first_name || !formData.customer_last_name || !formData.customer_phone)) {
      console.error('❌ Validación fallida: datos de cliente incompletos');
      toast.error('Por favor completa los datos del cliente (nombre, apellidos, teléfono)');
      return;
    }

    if (customerSearchMode === 'search' && !selectedCustomer) {
      console.error('❌ Validación fallida: no hay cliente seleccionado');
      toast.error('Por favor selecciona un cliente o crea uno nuevo');
      return;
    }

    console.log('✅ Validaciones pasadas');

    const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}:00`);
    const returnDateTime = new Date(`${formData.return_date}T${formData.return_time}:00`);

    console.log('📅 Fechas procesadas:', {
      pickup: pickupDateTime.toISOString(),
      return: returnDateTime.toISOString()
    });

    try {
      console.log('⏳ [PASO 1] Activando loading...');
      setLoading(true);
      
      // Preparar datos del cliente
      const customerName = customerSearchMode === 'new'
        ? `${formData.customer_first_name} ${formData.customer_last_name}`
        : `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`;

      const customerEmail = customerSearchMode === 'new' 
        ? formData.customer_email 
        : selectedCustomer?.email || '';

      const customerPhone = customerSearchMode === 'new'
        ? formData.customer_phone
        : selectedCustomer?.phone || '';

      const customerId = customerSearchMode === 'search' && selectedCustomer?.id
        ? parseInt(selectedCustomer.id)
        : undefined;

      // Preparar array de vehículos con sus precios
      const vehicleIds = selectedVehicles.map(v => ({
        id: parseInt(v.id),
        price: v.price
      }));

      // Crear reserva con múltiples vehículos
      // Usar precio final con descuento aplicado
      console.log('💰 [PASO 2] Calculando precio final...');
      const finalPrice = calculateFinalPrice();
      console.log(`✅ Precio final calculado: ${finalPrice}€`);
      
      const payloadData = {
        vehicle_ids: vehicleIds,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        pickup_date: pickupDateTime.toISOString(),
        return_date: returnDateTime.toISOString(),
        pickup_location_id: (formData.pickup_location_id && formData.pickup_location_id !== 'none') ? parseInt(formData.pickup_location_id) : null, // ✅ Ubicación de recogida
        return_location_id: (formData.return_location_id && formData.return_location_id !== 'none') ? parseInt(formData.return_location_id) : null, // ✅ Ubicación de devolución
        total_price: finalPrice,
        status: formData.status,
        // Guardar información del descuento (opcional, para auditoría)
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        // Conductores (si hay múltiples vehículos)
        additional_drivers: selectedVehicles.length > 1 ? drivers : [],
        // Extras y Upgrades seleccionados
        extras: selectedExtras.map(e => ({
          extra_id: e.id,
          quantity: e.quantity,
          unit_price: e.unitPrice,
          total_price: e.totalPrice
        })),
        upgrades: selectedUpgrades.map(u => ({
          upgrade_id: u.id,
          days: u.days,
          unit_price_per_day: u.unitPricePerDay,
          total_price: u.totalPrice
        })),
        experiences: selectedExperiences.map(exp => ({
          experience_id: exp.id,
          quantity: exp.quantity,
          unit_price: exp.unitPrice,
          total_price: exp.totalPrice
        }))
      };

      console.log('📤 [PASO 3] Preparando petición a /api/bookings');
      console.log('📦 Payload:', JSON.stringify(payloadData, null, 2));
      
      console.log('🌐 [PASO 4] Enviando petición POST...');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });

      console.log(`📥 [PASO 5] Respuesta recibida - Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log('✅ [PASO 6] Respuesta OK - Procesando datos...');
        const bookingData = await response.json();
        console.log('📊 Datos de reserva recibidos:', bookingData);
        
        const msg = selectedVehicles.length === 1 
          ? '¡Reserva creada exitosamente!' 
          : `¡Reserva creada exitosamente con ${selectedVehicles.length} vehículos!`;
        toast.success(msg);
        console.log('🎉 Toast de éxito mostrado');
        
        // Subir documentos del cliente (si hay alguno y es cliente nuevo)
        if (customerSearchMode === 'new' && bookingData.customer_id) {
          const hasDocuments = Object.values(customerDocuments).some(doc => doc !== null);
          
          if (hasDocuments) {
            try {
              console.log('📄 [PASO 6.5] Subiendo documentos del cliente...');
              toast.loading('Subiendo documentos del cliente...', { id: 'upload-docs' });
              
              // Crear FormData para cada documento
              const uploadPromises = [];
              
              if (customerDocuments.id_front) {
                const formData = new FormData();
                formData.append('file', customerDocuments.id_front);
                formData.append('documentType', 'id_document_front');
                uploadPromises.push(
                  fetch(`/api/customers/${bookingData.customer_id}/upload-document`, {
                    method: 'POST',
                    body: formData
                  })
                );
              }
              
              if (customerDocuments.id_back) {
                const formData = new FormData();
                formData.append('file', customerDocuments.id_back);
                formData.append('documentType', 'id_document_back');
                uploadPromises.push(
                  fetch(`/api/customers/${bookingData.customer_id}/upload-document`, {
                    method: 'POST',
                    body: formData
                  })
                );
              }
              
              if (customerDocuments.license_front) {
                const formData = new FormData();
                formData.append('file', customerDocuments.license_front);
                formData.append('documentType', 'driver_license_front');
                uploadPromises.push(
                  fetch(`/api/customers/${bookingData.customer_id}/upload-document`, {
                    method: 'POST',
                    body: formData
                  })
                );
              }
              
              if (customerDocuments.license_back) {
                const formData = new FormData();
                formData.append('file', customerDocuments.license_back);
                formData.append('documentType', 'driver_license_back');
                uploadPromises.push(
                  fetch(`/api/customers/${bookingData.customer_id}/upload-document`, {
                    method: 'POST',
                    body: formData
                  })
                );
              }
              
              const results = await Promise.all(uploadPromises);
              const allSuccess = results.every(r => r.ok);
              
              if (allSuccess) {
                console.log('✅ Todos los documentos subidos correctamente');
                toast.success('✅ Documentos subidos correctamente', { id: 'upload-docs' });
              } else {
                console.warn('⚠️ Algunos documentos no se pudieron subir');
                toast.error('⚠️ Algunos documentos no se pudieron subir', { id: 'upload-docs' });
              }
              
              // Resetear documentos
              setCustomerDocuments({
                id_front: null,
                id_back: null,
                license_front: null,
                license_back: null
              });
            } catch (error) {
              console.error('❌ Error al subir documentos:', error);
              toast.error('⚠️ Error al subir documentos', { id: 'upload-docs' });
            }
          }
        }
        
        // Generar contrato automáticamente
        try {
          console.log('📄 [PASO 7] Generando contrato automático...');
          const contractResponse = await fetch('/api/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: bookingData.id })
          });

          if (contractResponse.ok) {
            const contractData = await contractResponse.json();
            console.log('✅ Contrato generado automáticamente:', contractData.id);
            
            // Pasar el booking y contractId al padre para mostrar diálogo de firma
            if (onReservationCreated) {
              console.log('📞 Llamando a onReservationCreated callback');
              onReservationCreated(bookingData, contractData.id || contractData.contract?.id);
            }
          } else {
            console.error('❌ Error generando contrato automáticamente');
            onReservationCreated(bookingData, null);
          }
        } catch (error) {
          console.error('❌ Error al generar contrato:', error);
          onReservationCreated(bookingData, null);
        }
        
        console.log('🔒 [PASO 8] Cerrando diálogo...');
        onOpenChange(false);
        
        // Reset form
        setFormData({
          pickup_date: '',
          pickup_time: '09:00',
          return_date: '',
          return_time: '19:00',
          pickup_location_id: 'none',
          return_location_id: 'none',
          car_id: '',
          customer_id: '',
          customer_first_name: '',
          customer_last_name: '',
          customer_email: '',
          customer_phone: '',
          customer_address: '',
          customer_city: '',
          total_price: '',
          status: 'confirmed',
          discount_type: 'amount',
          discount_value: ''
        });
        setSelectedVehicles([]);
        setSelectedExtras([]);
        setSelectedUpgrades([]);
        setSelectedExperiences([]);
        setDrivers([]);
        setSelectedCustomer(null);
        setCalculatedPrice(null);
        setCurrentStep('dates');
      } else {
        console.error(`❌ [PASO 6] Respuesta con error - Status: ${response.status}`);
        const error = await response.json();
        console.error('📋 Detalles del error:', error);
        
        let errorMessage = '';
        let errorIcon = '❌';
        
        if (response.status === 409) {
          console.error('⚠️ Conflicto 409: Vehículo(s) ya reservado(s)');
          errorIcon = '🚫';
          errorMessage = error.message || 'Uno o más vehículos ya están reservados en esas fechas';
        } else if (response.status === 400) {
          errorIcon = '⚠️';
          errorMessage = error.message || 'Datos de reserva inválidos';
        } else if (response.status === 401) {
          errorIcon = '🔒';
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
        } else if (response.status === 500) {
          errorIcon = '💥';
          errorMessage = `Error del servidor: ${error.message || 'Error interno'}`;
        } else {
          errorMessage = error.message || `Error ${response.status}: Error desconocido`;
        }
        
        console.error(`⚠️ Error ${response.status}: ${errorMessage}`);
        toast.error(`${errorIcon} ${errorMessage}`, {
          duration: 7000,
          style: {
            background: '#ef4444',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '16px'
          }
        });
      }
    } catch (error) {
      console.error('❌❌❌ [CATCH] Error capturado en try-catch:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      const errorName = error instanceof Error ? error.constructor.name : typeof error;
      const errorStack = error instanceof Error ? error.stack : 'No stack disponible';
      console.error('Tipo de error:', errorName);
      console.error('Mensaje:', errorMsg);
      console.error('Stack:', errorStack);
      toast.error(`💥 Error creando reserva: ${errorMsg}`, {
        duration: 7000,
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '16px'
        }
      });
    } finally {
      console.log('🔓 [FINALLY] Liberando botón (setLoading(false))');
      setLoading(false);
      console.log('✅ handleSubmit completado');
    }
  };

  // Componente de progreso de pasos
  const StepIndicator = () => {
    const baseSteps = [
      { key: 'dates', label: '1. Fechas', icon: Calendar },
      { key: 'vehicle', label: '2. Vehículo', icon: Car },
      { key: 'extras', label: '3. Extras', icon: Calculator }
    ];
    
    // Añadir paso de conductores solo si hay múltiples vehículos
    const steps = selectedVehicles.length > 1 
      ? [
          ...baseSteps,
          { key: 'customer', label: '4. Titular', icon: User },
          { key: 'drivers', label: '5. Conductores', icon: User },
          { key: 'confirm', label: '6. Confirmar', icon: CheckCircle2 }
        ]
      : [
          ...baseSteps,
          { key: 'customer', label: '4. Cliente', icon: User },
          { key: 'confirm', label: '5. Confirmar', icon: CheckCircle2 }
        ];
    
    const stepOrder = steps.map(s => s.key);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.key;
          const isCompleted = currentIndex > index;
          
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className={`flex items-center space-x-2 ${isActive ? 'text-orange-600 font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`rounded-full p-2 ${isActive ? 'bg-orange-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <StepIcon className="h-4 w-4" />
                </div>
                <span className="text-sm hidden md:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span>Nueva Reserva</span>
          </DialogTitle>
          <DialogDescription>
            Sigue los pasos para crear una nueva reserva
          </DialogDescription>
        </DialogHeader>

        <StepIndicator />

        <div className="space-y-6">
          {/* PASO 1: SELECCIÓN DE FECHAS */}
          {currentStep === 'dates' && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Paso 1: Selecciona las fechas de alquiler</h4>
                    <p className="text-sm text-orange-700">Después verás qué vehículos están disponibles</p>
                  </div>
                </div>
              </div>

              {/* ✅ Date Range Picker Visual */}
              <div className="space-y-2">
                <Label>Periodo de Alquiler *</Label>
                <DateRangePicker
                  value={
                    formData.pickup_date && formData.return_date
                      ? {
                          from: new Date(formData.pickup_date + 'T00:00:00'),
                          to: new Date(formData.return_date + 'T00:00:00'),
                        }
                      : undefined
                  }
                  onChange={(range) => {
                    if (range?.from) {
                      const pickupDate = format(range.from, 'yyyy-MM-dd');
                      const returnDate = range.to
                        ? format(range.to, 'yyyy-MM-dd')
                        : pickupDate;
                      
                      setFormData(prev => ({
                        ...prev,
                        pickup_date: pickupDate,
                        return_date: returnDate,
                      }));
                    }
                  }}
                />
              </div>

              {/* ✅ Ubicaciones de Recogida y Devolución */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Lugar de Recogida</Label>
                  <Select
                    value={formData.pickup_location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pickup_location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return_location">Lugar de Devolución</Label>
                  <Select
                    value={formData.return_location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, return_location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pickup_time">Hora Recogida *</Label>
                  <Select
                    value={formData.pickup_time}
                    onValueChange={(value) => {
                      setFormData(prev => {
                        // ✅ Sincronizar hora de devolución con hora de salida (misma hora por defecto)
                        return {
                          ...prev,
                          pickup_time: value,
                          return_time: value  // Misma hora por defecto
                        };
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions(formData.pickup_date).map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                
                <div className="space-y-2">
                  <Label htmlFor="return_time">Hora Devolución *</Label>
                  <Select
                    value={formData.return_time}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, return_time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions(formData.return_date, true).length === 0 ? (
                        <div className="px-2 py-3 text-sm text-red-600">
                          No hay horas disponibles. Por favor selecciona otro día.
                        </div>
                      ) : (
                        generateTimeOptions(formData.return_date, true).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.return_date === formData.pickup_date && generateTimeOptions(formData.return_date, true).length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ La hora de recogida es demasiado tarde. Por favor selecciona otro día de devolución.
                    </p>
                  )}
                </div>
              </div>

              <Button 
                onClick={checkVehicleAvailability} 
                className="w-full" 
                disabled={checkingAvailability}
              >
                {checkingAvailability ? 'Verificando...' : 'Buscar Vehículos Disponibles'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* PASO 2: SELECCIÓN DE VEHÍCULO(S) */}
          {currentStep === 'vehicle' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900">Paso 2: Selecciona vehículo(s)</h4>
                    <p className="text-sm text-green-700">
                      {availableVehicles.length} vehículo(s) disponible(s) del {new Date(formData.pickup_date).toLocaleDateString('es-ES')} al {new Date(formData.return_date).toLocaleDateString('es-ES')}
                    </p>
                    {selectedVehicles.length > 0 && (
                      <p className="text-sm font-medium text-green-800 mt-1">
                        ✓ {selectedVehicles.length} vehículo(s) seleccionado(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {availableVehicles.map((vehicle) => {
                  const isSelected = selectedVehicles.some(v => v.id === vehicle.id);
                  const selectedVehicle = selectedVehicles.find(v => v.id === vehicle.id);
                  
                  return (
                    <Card 
                      key={vehicle.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'border-orange-500 border-2 bg-orange-50' : ''}`}
                      onClick={() => handleVehicleToggle(vehicle)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-6 h-6">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <Car className="h-8 w-8 text-orange-600" />
                            <div>
                              <div className="font-semibold">{getVehicleVisualNumber(vehicle.registration_number)}</div>
                              <div className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</div>
                              {selectedVehicle && typeof selectedVehicle.price === 'number' && selectedVehicle.price > 0 && (
                                <div className="text-sm font-medium text-orange-600 mt-1">
                                  {selectedVehicle.price.toFixed(2)} €
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-6 w-6 text-orange-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Resumen de precios */}
              {selectedVehicles.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
                  {/* Precio base */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900">Subtotal ({selectedVehicles.length} vehículo{selectedVehicles.length > 1 ? 's' : ''}):</span>
                    <span className="text-lg font-semibold text-blue-900">
                      {calculating ? 'Calculando...' : `${formData.total_price || '0'} €`}
                    </span>
                  </div>

                  {/* Campos de descuento */}
                  <div className="border-t border-blue-200 pt-3 space-y-3">
                    <label className="text-sm font-medium text-blue-900">Aplicar descuento (opcional)</label>
                    <div className="flex gap-2">
                      {/* Selector de tipo de descuento */}
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          discount_type: e.target.value as 'amount' | 'percentage' 
                        }))}
                        className="w-24 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="amount">€</option>
                        <option value="percentage">%</option>
                      </select>

                      {/* Input de valor del descuento */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          discount_value: e.target.value 
                        }))}
                        placeholder="0"
                        className="flex-1 rounded-md border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Mostrar descuento aplicado si existe */}
                    {parseFloat(formData.discount_value) > 0 && (
                      <div className="text-sm text-blue-700">
                        Descuento: -{formData.discount_type === 'percentage' 
                          ? `${formData.discount_value}% (${((parseFloat(formData.total_price) || 0) * (parseFloat(formData.discount_value) || 0) / 100).toFixed(2)} €)`
                          : `${formData.discount_value} €`}
                      </div>
                    )}
                  </div>

                  {/* Total final */}
                  <div className="border-t border-blue-300 pt-3 flex justify-between items-center">
                    <span className="font-bold text-blue-900 text-lg">Total Final:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {calculating ? 'Calculando...' : `${calculateFinalPrice().toFixed(2)} €`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('dates')}
                  className="flex-1"
                >
                  Volver a Fechas
                </Button>
                <Button 
                  onClick={handleContinueFromVehicles}
                  disabled={selectedVehicles.length === 0 || calculating}
                  className="flex-1"
                >
                  Continuar con Extras
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3: EXTRAS Y UPGRADES */}
          {currentStep === 'extras' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-2">
                  <Calculator className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900">Paso 3: Extras y Upgrades (Opcional)</h4>
                    <p className="text-sm text-purple-700">Añade extras o mejora tu experiencia de alquiler</p>
                  </div>
                </div>
              </div>

              {/* Selector de Extras y Upgrades */}
              <Card>
                <CardContent className="p-4">
                  {selectedVehicles.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium">
                        ℹ️ Los extras y upgrades se aplicarán a cada vehículo. Las experiencias son por reserva.
                      </p>
                    </div>
                  )}
                  <ExtrasUpgradesSelector
                    rentalDays={getRentalDays()}
                    vehicleCount={selectedVehicles.length || 1}
                    selectedExtras={selectedExtras}
                    selectedUpgrades={selectedUpgrades}
                    selectedExperiences={selectedExperiences}
                    onExtrasChange={setSelectedExtras}
                    onUpgradesChange={setSelectedUpgrades}
                    onExperiencesChange={setSelectedExperiences}
                  />
                </CardContent>
              </Card>

              {/* Resumen de precios actualizado */}
              {(selectedExtras.length > 0 || selectedUpgrades.length > 0 || selectedExperiences.length > 0) && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between font-medium text-blue-900">
                      <span>Subtotal vehículos:</span>
                      <span>{formData.total_price || '0'} €</span>
                    </div>
                    
                    {selectedExtras.length > 0 && (
                      <div className="flex justify-between text-blue-800">
                        <span>Extras ({selectedExtras.length}):</span>
                        <span>{selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0).toFixed(2)} €</span>
                      </div>
                    )}
                    
                    {selectedUpgrades.length > 0 && (
                      <div className="flex justify-between text-blue-800">
                        <span>Upgrades ({selectedUpgrades.length}):</span>
                        <span>{selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0).toFixed(2)} €</span>
                      </div>
                    )}
                    
                    {selectedExperiences.length > 0 && (
                      <div className="flex justify-between text-blue-800">
                        <span>Experiencias ({selectedExperiences.length}):</span>
                        <span>{selectedExperiences.reduce((sum, exp) => sum + exp.totalPrice, 0).toFixed(2)} €</span>
                      </div>
                    )}
                    
                    <Separator className="bg-blue-300" />
                    
                    <div className="flex justify-between font-bold text-lg text-blue-900">
                      <span>Total:</span>
                      <span>{(
                        (parseFloat(formData.total_price) || 0) +
                        selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0) +
                        selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0) +
                        selectedExperiences.reduce((sum, exp) => sum + exp.totalPrice, 0)
                      ).toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('vehicle')}
                  className="flex-1"
                >
                  Volver a Vehículos
                </Button>
                <Button 
                  onClick={() => {
                    // SIEMPRE ir primero al cliente
                    setCurrentStep('customer');
                  }}
                  className="flex-1"
                >
                  Continuar con Cliente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 4: DATOS DEL TITULAR DEL CONTRATO */}
          {currentStep === 'customer' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-2">
                  <User className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900">
                      Paso 4: Titular del Contrato
                    </h4>
                    <p className="text-sm text-purple-700">
                      Busca un cliente existente o crea uno nuevo
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs: Buscar o Nuevo */}
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={customerSearchMode === 'search' ? 'default' : 'outline'}
                  onClick={() => setCustomerSearchMode('search')}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Cliente
                </Button>
                <Button
                  variant={customerSearchMode === 'new' ? 'default' : 'outline'}
                  onClick={() => setCustomerSearchMode('new')}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>

              {customerSearchMode === 'search' ? (
                <div className="space-y-3">
                  {/* Buscador */}
                  <div className="space-y-2">
                    <Label>Buscar por nombre, email o teléfono</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Escribe para buscar..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Cliente seleccionado */}
                  {selectedCustomer && (
                    <Card className="border-green-500 border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{selectedCustomer.first_name} {selectedCustomer.last_name}</div>
                            <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                            {selectedCustomer.email && <div className="text-sm text-gray-600">{selectedCustomer.email}</div>}
                          </div>
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lista de resultados */}
                  {!selectedCustomer && customerSearch && filteredCustomers.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <Card 
                          key={customer.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                                <div className="text-xs text-gray-600">{customer.phone}</div>
                                {customer.email && <div className="text-xs text-gray-600">{customer.email}</div>}
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {!selectedCustomer && customerSearch && filteredCustomers.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No se encontraron clientes</p>
                      <Button 
                        variant="link" 
                        onClick={() => setCustomerSearchMode('new')}
                        className="mt-2"
                      >
                        Crear nuevo cliente
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={formData.customer_first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_first_name: e.target.value }))}
                        placeholder="Juan"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellidos *</Label>
                      <Input
                        id="last_name"
                        value={formData.customer_last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_last_name: e.target.value }))}
                        placeholder="Pérez García"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="+34 600 000 000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="cliente@email.com"
                      />
                    </div>
                  </div>
                  
                  {/* Sección de documentos - solo para nuevos clientes */}
                  <Separator className="my-4" />
                  <QuickDocumentUpload 
                    onDocumentsChange={setCustomerDocuments} 
                    onExtractedDataChange={handleExtractedDocumentData}
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('extras')}
                  className="flex-1"
                >
                  Volver a Extras
                </Button>
                <Button 
                  onClick={() => {
                    // Si hay múltiples vehículos, inicializar conductores e ir a ese paso
                    if (selectedVehicles.length > 1) {
                      // Inicializar array de conductores si está vacío
                      if (drivers.length === 0) {
                        setDrivers(selectedVehicles.map((v, idx) => ({
                          full_name: '',
                          phone: '',
                          dni_nie: '',
                          driver_license: '',
                          assigned_vehicle_id: v.id
                        })));
                      }
                      setCurrentStep('drivers');
                    } else {
                      // Si es un solo vehículo, ir directamente a confirmar
                      setCurrentStep('confirm');
                    }
                  }}
                  className="flex-1"
                  disabled={customerSearchMode === 'search' ? !selectedCustomer : !formData.customer_first_name || !formData.customer_last_name || !formData.customer_phone}
                >
                  {selectedVehicles.length > 1 ? 'Continuar con Conductores' : 'Continuar a Confirmar'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 5: CONDUCTORES (solo para múltiples vehículos) */}
          {currentStep === 'drivers' && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-2">
                  <User className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Paso 5: Conductores</h4>
                    <p className="text-sm text-orange-700">Indica el conductor para cada vehículo y asígnalo manualmente</p>
                  </div>
                </div>
              </div>

              {/* Formulario por cada conductor */}
              {drivers.map((driver, index) => {
                return (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">Conductor {index + 1}</Badge>
                        {index === 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Copiar datos del titular al conductor 1
                              const newDrivers = [...drivers];
                              if (customerSearchMode === 'new') {
                                newDrivers[0] = {
                                  ...newDrivers[0],
                                  full_name: `${formData.customer_first_name} ${formData.customer_last_name}`.trim(),
                                  phone: formData.customer_phone
                                };
                              } else if (selectedCustomer) {
                                newDrivers[0] = {
                                  ...newDrivers[0],
                                  full_name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim(),
                                  phone: selectedCustomer.phone || ''
                                };
                              }
                              setDrivers(newDrivers);
                              toast.success('Datos del titular copiados al conductor 1');
                            }}
                            className="text-xs"
                          >
                            <User className="h-3 w-3 mr-1" />
                            Copiar datos del titular
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Nombre Completo *</Label>
                          <Input
                            value={driver.full_name}
                            onChange={(e) => {
                              const newDrivers = [...drivers];
                              newDrivers[index] = { ...driver, full_name: e.target.value };
                              setDrivers(newDrivers);
                            }}
                            placeholder="Ej: Juan Pérez García"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Teléfono</Label>
                          <Input
                            value={driver.phone || ''}
                            onChange={(e) => {
                              const newDrivers = [...drivers];
                              newDrivers[index] = { ...driver, phone: e.target.value };
                              setDrivers(newDrivers);
                            }}
                            placeholder="Opcional"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">DNI/NIE</Label>
                          <Input
                            value={driver.dni_nie || ''}
                            onChange={(e) => {
                              const newDrivers = [...drivers];
                              newDrivers[index] = { ...driver, dni_nie: e.target.value };
                              setDrivers(newDrivers);
                            }}
                            placeholder="Ej: 12345678A"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Carnet de Conducir</Label>
                          <Input
                            value={driver.driver_license || ''}
                            onChange={(e) => {
                              const newDrivers = [...drivers];
                              newDrivers[index] = { ...driver, driver_license: e.target.value };
                              setDrivers(newDrivers);
                            }}
                            placeholder="Nº de carnet"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm">Vehículo Asignado *</Label>
                          <Select
                            value={driver.assigned_vehicle_id}
                            onValueChange={(value) => {
                              const newDrivers = [...drivers];
                              newDrivers[index] = { ...driver, assigned_vehicle_id: value };
                              setDrivers(newDrivers);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  <div className="flex items-center space-x-2">
                                    <Car className="h-4 w-4" />
                                    <span>{getVehicleVisualNumber(vehicle.registration_number)} - {vehicle.make} {vehicle.model}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Solo el nombre y vehículo asignado son obligatorios. El teléfono es opcional porque el responsable legal es el titular del contrato.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('customer')}
                  className="flex-1"
                >
                  Volver a Cliente
                </Button>
                <Button 
                  onClick={() => {
                    // Validar que todos los conductores tengan nombre y vehículo asignado (teléfono ya no es obligatorio)
                    const allValid = drivers.every(d => d.full_name && d.assigned_vehicle_id);
                    if (!allValid) {
                      toast.error('Por favor completa el nombre y vehículo asignado de todos los conductores');
                      return;
                    }
                    
                    // Validar que no haya vehículos sin conductor asignado
                    const vehiclesWithDriver = drivers.map(d => d.assigned_vehicle_id);
                    const unassignedVehicles = selectedVehicles.filter(v => !vehiclesWithDriver.includes(v.id));
                    if (unassignedVehicles.length > 0) {
                      toast.error('Hay vehículos sin conductor asignado');
                      return;
                    }
                    
                    setCurrentStep('confirm');
                  }}
                  className="flex-1"
                >
                  Continuar a Confirmar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 5/6: CONFIRMACIÓN */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">
                      Paso {selectedVehicles.length > 1 ? '6' : '5'}: Confirmar reserva
                    </h4>
                    <p className="text-sm text-orange-700">Revisa los detalles antes de confirmar</p>
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="font-semibold">Resumen de la Reserva</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* Vehículos seleccionados */}
                    <div className="flex flex-col space-y-1">
                      <span className="text-gray-600">Vehículo{selectedVehicles.length > 1 ? 's' : ''}:</span>
                      {selectedVehicles.map((vehicle, index) => (
                        <div key={vehicle.id} className="flex justify-between items-center ml-4">
                          <span className="font-medium">
                            {index + 1}. {getVehicleVisualNumber(vehicle.registration_number)} - {vehicle.make} {vehicle.model}
                          </span>
                          <span className="text-orange-600 font-medium">
                            {typeof vehicle.price === 'number' ? vehicle.price.toFixed(2) : '0.00'} €
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Conductores (si hay múltiples vehículos) - SIN vincular a vehículos */}
                    {selectedVehicles.length > 1 && drivers.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">Conductores Adicionales:</span>
                          {drivers.map((driver, index) => (
                            <div key={index} className="ml-4 text-xs">
                              <span>{driver.full_name}</span>
                              {driver.dni_nie && <span className="text-gray-500"> ({driver.dni_nie})</span>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Titular del Contrato:</span>
                      <span className="font-medium">
                        {customerSearchMode === 'new' 
                          ? `${formData.customer_first_name} ${formData.customer_last_name}`
                          : `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium">
                        {customerSearchMode === 'new' ? formData.customer_phone : selectedCustomer?.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recogida:</span>
                      <span className="font-medium">
                        {new Date(formData.pickup_date).toLocaleDateString('es-ES')} a las {formData.pickup_time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Devolución:</span>
                      <span className="font-medium">
                        {new Date(formData.return_date).toLocaleDateString('es-ES')} a las {formData.return_time}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Precio Total */}
                  <div className="space-y-2">
                    {/* Subtotal Vehículos */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({selectedVehicles.length} vehículo{selectedVehicles.length > 1 ? 's' : ''}):</span>
                      <span className="font-medium">{formData.total_price || '0'} €</span>
                    </div>
                    
                    {/* Extras */}
                    {selectedExtras.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Extras ({selectedExtras.length}):</span>
                        <span className="font-medium">
                          {selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0).toFixed(2)} €
                        </span>
                      </div>
                    )}
                    
                    {/* Upgrades */}
                    {selectedUpgrades.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upgrades ({selectedUpgrades.length}):</span>
                        <span className="font-medium">
                          {selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0).toFixed(2)} €
                        </span>
                      </div>
                    )}
                    
                    {/* Descuento (si existe) */}
                    {parseFloat(formData.discount_value) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : `${formData.discount_value} €`}):</span>
                        <span>
                          -{formData.discount_type === 'percentage' 
                            ? (((parseFloat(formData.total_price) || 0) + selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0) + selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0)) * (parseFloat(formData.discount_value) || 0) / 100).toFixed(2)
                            : formData.discount_value} €
                        </span>
                      </div>
                    )}
                    
                    {/* Total Final */}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total Final:</span>
                      <span className="text-orange-600">{calculateFinalPrice().toFixed(2)} €</span>
                    </div>
                    
                    {selectedVehicles.length > 1 && (
                      <div className="text-xs text-gray-500">
                        * El precio incluye la suma de todos los vehículos seleccionados
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="status">Estado de la reserva</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('customer')}
                  className="flex-1"
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={loading || calculating}
                >
                  {loading ? 'Creando...' : 'Confirmar Reserva'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}