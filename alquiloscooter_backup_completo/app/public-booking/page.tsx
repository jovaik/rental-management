"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Phone, Mail, Car, Clock, Calculator, ChevronRight, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExtrasUpgradesSelector } from '@/components/modals/extras-upgrades-selector';

interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  status: string;
  type?: string;
}

interface WorkingHours {
  day_of_week: number;
  is_working_day: boolean;
  opening_time: string;
  closing_time: string;
}

interface Driver {
  full_name: string;
  dni_nie?: string;
  driver_license?: string;
  license_expiry?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  assigned_vehicle_id: string;
  notes?: string;
}

export default function BookingWidgetPage() {
  const [currentStep, setCurrentStep] = useState<'dates' | 'vehicle' | 'extras' | 'drivers' | 'customer' | 'confirm'>('dates');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [companyName, setCompanyName] = useState("AlquiloScooter");
  
  const [selectedVehicles, setSelectedVehicles] = useState<Array<{ id: string; price: number; registration_number?: string; make?: string; model?: string }>>([]);
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id: number; name: string; quantity: number; unitPrice: number; totalPrice: number }>>([]);
  const [selectedUpgrades, setSelectedUpgrades] = useState<Array<{ id: number; name: string; days: number; unitPricePerDay: number; totalPrice: number }>>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<Array<{ id: number; name: string; quantity: number; unitPrice: number; totalPrice: number }>>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [formData, setFormData] = useState({
    pickup_date: '',
    pickup_time: '09:00',
    return_date: '',
    return_time: '19:00',
    customer_first_name: '',
    customer_last_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_city: '',
    total_price: '',
    status: 'pending',
    discount_type: 'amount' as 'amount' | 'percentage',
    discount_value: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData);
      }

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

      const response = await fetch("/api/company-config");
      const data = await response.json();
      if (data.company_name) setCompanyName(data.company_name);
      if (data.logo_url) setCompanyLogo(data.logo_url);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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

  const getWorkingHoursForDay = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T12:00:00');
    const dayOfWeek = date.getDay();
    return workingHours.find(h => h.day_of_week === dayOfWeek);
  };

  const generateTimeOptions = (dateString: string, isReturnTime: boolean = false) => {
    if (!dateString) {
      return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
              '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
              '17:00', '17:30', '18:00', '18:30', '19:00'];
    }
    
    const hours = getWorkingHoursForDay(dateString);
    const defaultOpenHour = 9;
    const defaultCloseHour = 19;
    
    let openHour = hours?.is_working_day 
      ? parseInt(hours.opening_time.split(':')[0]) 
      : defaultOpenHour;
    let closeHour = hours?.is_working_day 
      ? parseInt(hours.closing_time.split(':')[0]) 
      : defaultCloseHour;
    
    if (closeHour < 19) {
      closeHour = 19;
    }
    
    const options = [];
    for (let h = openHour; h <= closeHour; h++) {
      options.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < closeHour) {
        options.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }

    if (isReturnTime && formData.pickup_date && formData.return_date && 
        formData.pickup_date === formData.return_date && formData.pickup_time) {
      
      const [pickupHour, pickupMinute] = formData.pickup_time.split(':').map(Number);
      
      const filteredOptions = options.filter(time => {
        const [h, m] = time.split(':').map(Number);
        return (h > pickupHour) || (h === pickupHour && m > pickupMinute);
      });
      
      return filteredOptions;
    }

    return options;
  };

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
      
      const bookingsRes = await fetch(
        `/api/bookings?start=${pickupDateTime.toISOString()}&end=${returnDateTime.toISOString()}`
      );
      
      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        const reservedCarIds = new Set(bookings.map((b: any) => b.car_id?.toString()).filter(Boolean));
        
        const available = vehicles.filter(v => !reservedCarIds.has(v.id) && v.status === 'T');
        
        if (available.length === 0) {
          toast.error('No hay vehículos disponibles para esas fechas');
          setAvailableVehicles([]);
        } else {
          setAvailableVehicles(available);
          toast.success(`${available.length} vehículo(s) disponible(s)`);
          setCurrentStep('vehicle');
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Error verificando disponibilidad');
    } finally {
      setCheckingAvailability(false);
    }
  };

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
      }
      return 0;
    } catch (error) {
      console.error('Error calculating price for vehicle:', carId, error);
      return 0;
    }
  };

  const getRentalDays = (): number => {
    if (!formData.pickup_date || !formData.return_date) return 1;
    
    const pickup = new Date(`${formData.pickup_date}T${formData.pickup_time || '00:00'}`);
    const returnDate = new Date(`${formData.return_date}T${formData.return_time || '23:59'}`);
    
    const diffTime = Math.abs(returnDate.getTime() - pickup.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  };

  const calculateFinalPrice = (): number => {
    const basePrice = parseFloat(formData.total_price) || 0;
    const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.totalPrice, 0);
    const upgradesTotal = selectedUpgrades.reduce((sum, upgrade) => sum + upgrade.totalPrice, 0);
    const subtotal = basePrice + extrasTotal + upgradesTotal;
    
    const discountValue = parseFloat(formData.discount_value) || 0;
    
    if (discountValue === 0) return subtotal;
    
    if (formData.discount_type === 'percentage') {
      const discountAmount = (subtotal * discountValue) / 100;
      return Math.max(0, subtotal - discountAmount);
    } else {
      return Math.max(0, subtotal - discountValue);
    }
  };

  const handleVehicleToggle = async (vehicle: Vehicle) => {
    const isSelected = selectedVehicles.some(v => v.id === vehicle.id);
    
    if (isSelected) {
      const newSelection = selectedVehicles.filter(v => v.id !== vehicle.id);
      setSelectedVehicles(newSelection);
      
      const total = newSelection.reduce((sum, v) => sum + (Number(v.price) || 0), 0);
      const totalNumber = Number(total);
      setFormData(prev => ({ ...prev, total_price: isNaN(totalNumber) ? '0.00' : totalNumber.toFixed(2) }));
    } else {
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
      
      const total = newSelection.reduce((sum, v) => sum + (Number(v.price) || 0), 0);
      const totalNumber = Number(total);
      setFormData(prev => ({ ...prev, total_price: isNaN(totalNumber) ? '0.00' : totalNumber.toFixed(2) }));
      setCalculating(false);
    }
  };

  const handleContinueFromVehicles = () => {
    if (selectedVehicles.length === 0) {
      toast.error('Debes seleccionar al menos un vehículo');
      return;
    }
    setCurrentStep('extras');
  };

  const handleSubmit = async () => {
    if (selectedVehicles.length === 0 || !formData.pickup_date || !formData.return_date) {
      toast.error('Faltan datos obligatorios: debes seleccionar al menos un vehículo y las fechas');
      return;
    }

    if (!formData.customer_first_name || !formData.customer_last_name || !formData.customer_phone) {
      toast.error('Por favor completa los datos del cliente (nombre, apellidos, teléfono)');
      return;
    }

    const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}:00`);
    const returnDateTime = new Date(`${formData.return_date}T${formData.return_time}:00`);

    try {
      setLoading(true);
      
      const customerName = `${formData.customer_first_name} ${formData.customer_last_name}`;
      const customerEmail = formData.customer_email;
      const customerPhone = formData.customer_phone;

      const vehicleIds = selectedVehicles.map(v => ({
        id: parseInt(v.id),
        price: v.price
      }));

      const finalPrice = calculateFinalPrice();
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_ids: vehicleIds,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          pickup_date: pickupDateTime.toISOString(),
          return_date: returnDateTime.toISOString(),
          total_price: finalPrice,
          status: formData.status,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value) || 0,
          additional_drivers: selectedVehicles.length > 1 ? drivers : [],
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
          }))
        })
      });

      if (response.ok) {
        const bookingData = await response.json();
        const msg = selectedVehicles.length === 1 
          ? '¡Reserva creada exitosamente!' 
          : `¡Reserva creada exitosamente con ${selectedVehicles.length} vehículos!`;
        toast.success(msg);
        
        try {
          const contractResponse = await fetch('/api/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: bookingData.id })
          });

          if (contractResponse.ok) {
            const contractData = await contractResponse.json();
            console.log('✅ Contrato generado automáticamente:', contractData.id);
          }
        } catch (error) {
          console.error('❌ Error al generar contrato:', error);
        }
        
        // Reset form
        setFormData({
          pickup_date: '',
          pickup_time: '09:00',
          return_date: '',
          return_time: '19:00',
          customer_first_name: '',
          customer_last_name: '',
          customer_email: '',
          customer_phone: '',
          customer_address: '',
          customer_city: '',
          total_price: '',
          status: 'pending',
          discount_type: 'amount',
          discount_value: ''
        });
        setSelectedVehicles([]);
        setSelectedExtras([]);
        setSelectedUpgrades([]);
        setDrivers([]);
        setCurrentStep('dates');
      } else {
        const error = await response.json();
        if (response.status === 409) {
          toast.error(error.message || 'Uno o más vehículos ya están reservados en esas fechas', {
            duration: 6000,
            style: {
              background: '#ef4444',
              color: 'white',
              fontWeight: 'bold'
            }
          });
        } else {
          toast.error(error.message || 'Error creando reserva');
        }
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error creando reserva');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => {
    const baseSteps = [
      { key: 'dates', label: '1. Fechas', icon: Calendar },
      { key: 'vehicle', label: '2. Vehículo', icon: Car },
      { key: 'extras', label: '3. Extras', icon: Calculator }
    ];
    
    const steps = selectedVehicles.length > 1 
      ? [
          ...baseSteps,
          { key: 'customer', label: '4. Cliente', icon: User },
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
    <div className="min-h-screen bg-white">
      {/* Widget Content - SIN BANNER para embeber */}
      <div className="container mx-auto px-2 py-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-6 w-6 text-orange-600" />
                  <h2 className="text-2xl font-bold">Nueva Reserva</h2>
                </div>
                <p className="text-gray-600">Sigue los pasos para crear tu reserva</p>
              </div>

              <StepIndicator />

              <div className="space-y-6">
                {/* PASO 1: FECHAS */}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="pickup_date">Fecha Recogida *</Label>
                        <Input
                          id="pickup_date"
                          type="date"
                          value={formData.pickup_date}
                          onChange={(e) => {
                            const newPickupDate = e.target.value;
                            setFormData(prev => {
                              const newReturnDate = !prev.return_date || prev.return_date < newPickupDate 
                                ? newPickupDate 
                                : prev.return_date;
                              return { 
                                ...prev, 
                                pickup_date: newPickupDate,
                                return_date: newReturnDate
                              };
                            });
                          }}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pickup_time">Hora Recogida *</Label>
                        <Select
                          value={formData.pickup_time}
                          onValueChange={(value) => {
                            setFormData(prev => {
                              if (prev.pickup_date === prev.return_date && prev.return_time) {
                                const [newPickupHour, newPickupMin] = value.split(':').map(Number);
                                const [returnHour, returnMin] = prev.return_time.split(':').map(Number);
                                
                                if (returnHour < newPickupHour || (returnHour === newPickupHour && returnMin <= newPickupMin)) {
                                  const newReturnHour = newPickupHour + 1;
                                  const newReturnTime = `${newReturnHour.toString().padStart(2, '0')}:${newPickupMin.toString().padStart(2, '0')}`;
                                  
                                  return {
                                    ...prev,
                                    pickup_time: value,
                                    return_time: newReturnTime
                                  };
                                }
                              }
                              
                              return { ...prev, pickup_time: value };
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
                        <Label htmlFor="return_date">Fecha Devolución *</Label>
                        <Input
                          id="return_date"
                          type="date"
                          value={formData.return_date}
                          onChange={(e) => {
                            const newReturnDate = e.target.value;
                            setFormData(prev => {
                              if (newReturnDate === prev.pickup_date && prev.pickup_time && prev.return_time) {
                                const [pickupHour, pickupMin] = prev.pickup_time.split(':').map(Number);
                                const [returnHour, returnMin] = prev.return_time.split(':').map(Number);
                                
                                if (returnHour < pickupHour || (returnHour === pickupHour && returnMin <= pickupMin)) {
                                  const newReturnHour = pickupHour + 1;
                                  const newReturnTime = `${newReturnHour.toString().padStart(2, '0')}:${pickupMin.toString().padStart(2, '0')}`;
                                  
                                  return {
                                    ...prev,
                                    return_date: newReturnDate,
                                    return_time: newReturnTime
                                  };
                                }
                              }
                              
                              return { ...prev, return_date: newReturnDate };
                            });
                          }}
                          min={formData.pickup_date}
                          required
                        />
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

                {/* PASO 2: VEHÍCULOS */}
                {currentStep === 'vehicle' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900">Paso 2: Selecciona vehículo(s)</h4>
                          <p className="text-sm text-green-700">
                            {availableVehicles.length} vehículo(s) disponible(s)
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
                                    <div className="font-semibold">{vehicle.registration_number}</div>
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

                    {selectedVehicles.length > 0 && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-orange-900">Subtotal ({selectedVehicles.length} vehículo{selectedVehicles.length > 1 ? 's' : ''}):</span>
                          <span className="text-lg font-semibold text-orange-900">
                            {calculating ? 'Calculando...' : `${formData.total_price || '0'} €`}
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

                {/* PASO 3: EXTRAS */}
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

                    <Card>
                      <CardContent className="p-4">
                        {selectedVehicles.length > 0 && (
                          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-900 font-medium">
                              ℹ️ Los extras y upgrades se aplicarán a cada uno de los {selectedVehicles.length} vehículo{selectedVehicles.length !== 1 ? 's' : ''} seleccionado{selectedVehicles.length !== 1 ? 's' : ''}
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

                    {(selectedExtras.length > 0 || selectedUpgrades.length > 0) && (
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between font-medium text-orange-900">
                            <span>Subtotal vehículos:</span>
                            <span>{formData.total_price || '0'} €</span>
                          </div>
                          
                          {selectedExtras.length > 0 && (
                            <div className="flex justify-between text-orange-800">
                              <span>Extras ({selectedExtras.length}):</span>
                              <span>{selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0).toFixed(2)} €</span>
                            </div>
                          )}
                          
                          {selectedUpgrades.length > 0 && (
                            <div className="flex justify-between text-orange-800">
                              <span>Upgrades ({selectedUpgrades.length}):</span>
                              <span>{selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0).toFixed(2)} €</span>
                            </div>
                          )}
                          
                          <Separator className="bg-orange-300" />
                          
                          <div className="flex justify-between font-bold text-lg text-orange-900">
                            <span>Total:</span>
                            <span>{(
                              (parseFloat(formData.total_price) || 0) +
                              selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0) +
                              selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0)
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
                        onClick={() => setCurrentStep('customer')}
                        className="flex-1"
                      >
                        Continuar con Cliente
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* PASO 4: CLIENTE (SOLO NUEVO) */}
                {currentStep === 'customer' && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-start space-x-2">
                        <User className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-900">Paso 4: Datos del Cliente</h4>
                          <p className="text-sm text-purple-700">Completa tus datos para la reserva</p>
                        </div>
                      </div>
                    </div>

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
                    </div>

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
                          if (selectedVehicles.length > 1) {
                            if (drivers.length === 0) {
                              setDrivers(selectedVehicles.map((v) => ({
                                full_name: '',
                                phone: '',
                                dni_nie: '',
                                driver_license: '',
                                assigned_vehicle_id: v.id
                              })));
                            }
                            setCurrentStep('drivers');
                          } else {
                            setCurrentStep('confirm');
                          }
                        }}
                        className="flex-1"
                        disabled={!formData.customer_first_name || !formData.customer_last_name || !formData.customer_phone}
                      >
                        {selectedVehicles.length > 1 ? 'Continuar con Conductores' : 'Continuar a Confirmar'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* PASO 5: CONDUCTORES (múltiples vehículos) */}
                {currentStep === 'drivers' && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-start space-x-2">
                        <User className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-orange-900">Paso 5: Conductores</h4>
                          <p className="text-sm text-orange-700">Indica el conductor para cada vehículo</p>
                        </div>
                      </div>
                    </div>

                    {drivers.map((driver, index) => (
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
                                  const newDrivers = [...drivers];
                                  newDrivers[0] = {
                                    ...newDrivers[0],
                                    full_name: `${formData.customer_first_name} ${formData.customer_last_name}`.trim(),
                                    phone: formData.customer_phone
                                  };
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
                                        <span>{vehicle.make} {vehicle.model} - {vehicle.registration_number}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        ℹ️ Solo el nombre y vehículo asignado son obligatorios.
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
                          const allValid = drivers.every(d => d.full_name && d.assigned_vehicle_id);
                          if (!allValid) {
                            toast.error('Por favor completa el nombre y vehículo asignado de todos los conductores');
                            return;
                          }
                          
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

                {/* PASO FINAL: CONFIRMAR */}
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

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-semibold">Resumen de la Reserva</span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex flex-col space-y-1">
                            <span className="text-gray-600">Vehículo{selectedVehicles.length > 1 ? 's' : ''}:</span>
                            {selectedVehicles.map((vehicle, index) => (
                              <div key={vehicle.id} className="flex justify-between items-center ml-4">
                                <span className="font-medium">
                                  {index + 1}. {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                                </span>
                                <span className="text-orange-600 font-medium">
                                  {typeof vehicle.price === 'number' ? vehicle.price.toFixed(2) : '0.00'} €
                                </span>
                              </div>
                            ))}
                          </div>
                          
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
                            <span className="text-gray-600">Cliente:</span>
                            <span className="font-medium">{formData.customer_first_name} {formData.customer_last_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Teléfono:</span>
                            <span className="font-medium">{formData.customer_phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Periodo:</span>
                            <span className="font-medium">
                              {formData.pickup_date} {formData.pickup_time} → {formData.return_date} {formData.return_time}
                            </span>
                          </div>
                          
                          {(selectedExtras.length > 0 || selectedUpgrades.length > 0) && (
                            <>
                              <Separator className="my-2" />
                              {selectedExtras.length > 0 && (
                                <div>
                                  <span className="text-gray-600 font-medium">Extras:</span>
                                  {selectedExtras.map((extra, idx) => (
                                    <div key={idx} className="ml-4 text-xs">
                                      {extra.name} x{extra.quantity} = {extra.totalPrice.toFixed(2)} €
                                    </div>
                                  ))}
                                </div>
                              )}
                              {selectedUpgrades.length > 0 && (
                                <div>
                                  <span className="text-gray-600 font-medium">Upgrades:</span>
                                  {selectedUpgrades.map((upgrade, idx) => (
                                    <div key={idx} className="ml-4 text-xs">
                                      {upgrade.name} x{upgrade.days} días = {upgrade.totalPrice.toFixed(2)} €
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-orange-600">{calculateFinalPrice().toFixed(2)} €</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentStep(selectedVehicles.length > 1 ? 'drivers' : 'customer')}
                        className="flex-1"
                      >
                        Volver
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Creando Reserva...' : 'Confirmar Reserva'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
