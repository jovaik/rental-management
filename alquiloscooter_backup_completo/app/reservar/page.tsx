
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon, Search, Car, Users, ArrowLeft, Check, Clock, Home } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useSession } from "next-auth/react";

type Vehicle = {
  id: number;
  model: string;
  brand: string;
  plate: string;
  category: string;
  imageUrl?: string;
  pricePerDay: number;
  available: boolean;
  capacity?: number;
};

type Location = {
  id: number;
  name: string;
  address?: string;
  city?: string;
};

export default function ReservarPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [pickupDate, setPickupDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickupLocationId, setPickupLocationId] = useState<string>("");
  const [returnLocationId, setReturnLocationId] = useState<string>("");
  const [publicLocations, setPublicLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Affiliate code from URL
  const [affiliateCode, setAffiliateCode] = useState<string>("");
  
  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerComments, setCustomerComments] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [bookingRequiresApproval, setBookingRequiresApproval] = useState(false);

  useEffect(() => {
    // Capturar código de afiliado de la URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('affiliate');
    if (ref) {
      setAffiliateCode(ref);
    }

    // Cargar ubicaciones públicas
    const loadLocations = async () => {
      try {
        const res = await fetch('/api/business-locations/public');
        if (res.ok) {
          const locations = await res.json();
          setPublicLocations(locations);
          
          // Preseleccionar la primera ubicación si existe
          if (locations.length > 0) {
            setPickupLocationId(locations[0].id.toString());
            setReturnLocationId(locations[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    };

    loadLocations();
  }, []);

  const searchVehicles = async () => {
    if (!pickupDate || !returnDate) {
      toast.error("Por favor selecciona ambas fechas");
      return;
    }

    if (returnDate <= pickupDate) {
      toast.error("La fecha de devolución debe ser posterior a la de recogida");
      return;
    }

    setSearching(true);
    setShowResults(false);

    try {
      const response = await fetch("/api/booking-widget/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupDate: pickupDate.toISOString(),
          returnDate: returnDate.toISOString(),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setVehicles(data.vehicles || []);
        setShowResults(true);
        
        if (data.vehicles.length === 0) {
          toast.info("No hay vehículos disponibles para estas fechas");
        } else {
          toast.success(`${data.vehicles.length} vehículos disponibles`);
        }
      } else {
        toast.error(data.error || "Error al buscar vehículos");
      }
    } catch (error) {
      console.error("Error searching vehicles:", error);
      toast.error("Error al buscar vehículos");
    } finally {
      setSearching(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedVehicle || !pickupDate || !returnDate) return 0;
    
    const days = Math.ceil(
      (returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return selectedVehicle.pricePerDay * days;
  };

  const handleBooking = async () => {
    if (!selectedVehicle || !pickupDate || !returnDate) {
      toast.error("Por favor completa todos los campos de búsqueda");
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error("Por favor completa todos tus datos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/booking-widget/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          pickupDate: pickupDate.toISOString(),
          returnDate: returnDate.toISOString(),
          customerName,
          customerEmail,
          customerPhone,
          customerComments,
          affiliateCode: affiliateCode || undefined, // Código de afiliado si existe
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingSuccess(true);
        setBookingNumber(data.bookingNumber);
        setBookingRequiresApproval(data.requiresApproval || false);
        
        // Show appropriate message
        if (data.requiresApproval) {
          toast.success("¡Pre-reserva recibida! Pendiente de confirmación por el operador");
        } else {
          toast.success("¡Solicitud de reserva recibida exitosamente!");
        }
        
        // Reset form after 8 seconds (más tiempo para leer el mensaje)
        setTimeout(() => {
          setBookingSuccess(false);
          setBookingRequiresApproval(false);
          setSelectedVehicle(null);
          setPickupDate(undefined);
          setReturnDate(undefined);
          setDateRange(undefined);
          setCustomerName("");
          setCustomerEmail("");
          setCustomerPhone("");
          setCustomerComments("");
          setShowResults(false);
          setVehicles([]);
        }, 8000);
      } else {
        toast.error(data.error || "Error al crear la reserva");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Error al crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className={`min-h-screen ${bookingRequiresApproval ? 'bg-gradient-to-br from-orange-50 to-yellow-50' : 'bg-gradient-to-br from-green-50 to-blue-50'} flex items-center justify-center p-4`}>
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 w-16 h-16 ${bookingRequiresApproval ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
              {bookingRequiresApproval ? (
                <Clock className="w-8 h-8 text-orange-600" />
              ) : (
                <Check className="w-8 h-8 text-green-600" />
              )}
            </div>
            <CardTitle className={`text-2xl ${bookingRequiresApproval ? 'text-orange-600' : 'text-green-600'}`}>
              {bookingRequiresApproval 
                ? "¡Pre-reserva Recibida!" 
                : "¡Solicitud Recibida!"
              }
            </CardTitle>
            <CardDescription>
              {bookingRequiresApproval
                ? "Tu solicitud está pendiente de confirmación por nuestro equipo"
                : "Tu solicitud de reserva ha sido registrada correctamente"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Número de Expediente</p>
              <p className="text-2xl font-bold font-mono text-gray-900">{bookingNumber}</p>
            </div>
            
            {bookingRequiresApproval ? (
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                <p className="text-sm text-orange-900">
                  <strong>⏳ Pre-reserva Pendiente de Confirmación</strong><br/>
                  Tu solicitud requiere aprobación manual por parte de nuestro equipo.
                  Te contactaremos en breve para confirmar disponibilidad y completar la reserva.
                  Recibirás un email con todos los detalles.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Te hemos enviado un email de confirmación</strong> con todos los detalles.
                  Nos pondremos en contacto contigo pronto para completar el proceso.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setBookingSuccess(false);
                  setBookingNumber("");
                  setBookingRequiresApproval(false);
                  setSelectedVehicle(null);
                  setPickupDate(undefined);
                  setReturnDate(undefined);
                  setDateRange(undefined);
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                  setCustomerComments("");
                  setShowResults(false);
                  setVehicles([]);
                }}
                className="w-full"
              >
                Hacer otra reserva
              </Button>
              {session && (
                <Button 
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-6xl">
        {/* Search Section - Profesional */}
        {/* Botón de vuelta al dashboard si hay sesión - discreto */}
        {session && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-orange-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        )}

        <div>
          <Card className="mb-8 shadow-lg border border-gray-200 bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Buscar Vehículo Disponible
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Selecciona las fechas de tu alquiler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-sm font-semibold text-gray-700">Selecciona el Período de Alquiler</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12 border-gray-300 focus:border-[#FF6B35]",
                            !dateRange?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd MMM", { locale: es })} → {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                              </>
                            ) : (
                              format(dateRange.from, "dd MMM yyyy", { locale: es })
                            )
                          ) : (
                            "Selecciona fechas de recogida y devolución"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => {
                              setDateRange(range);
                              if (range?.from) setPickupDate(range.from);
                              if (range?.to) setReturnDate(range.to);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                            numberOfMonths={2}
                          />
                          {dateRange?.from && dateRange?.to && (
                            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm font-semibold text-orange-900">
                                {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} días de alquiler
                              </p>
                              <Button
                                onClick={() => setIsCalendarOpen(false)}
                                className="w-full mt-2 bg-[#FF6B35] hover:bg-[#FF5520]"
                                size="sm"
                              >
                                Confirmar Fechas
                              </Button>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={searchVehicles} 
                      disabled={!pickupDate || !returnDate || searching}
                      className="w-full h-12 px-8 text-base font-bold bg-[#FF6B35] hover:bg-[#FF5520] text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {searching ? (
                        <>
                          <Clock className="mr-2 h-5 w-5 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          Buscar Vehículos
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {publicLocations.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Lugar de Recogida</Label>
                      <Select
                        value={pickupLocationId}
                        onValueChange={setPickupLocationId}
                      >
                        <SelectTrigger className="h-12 border-gray-300">
                          <SelectValue placeholder="Selecciona ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                          {publicLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name} {location.city ? `- ${location.city}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Lugar de Devolución</Label>
                      <Select
                        value={returnLocationId}
                        onValueChange={setReturnLocationId}
                      >
                        <SelectTrigger className="h-12 border-gray-300">
                          <SelectValue placeholder="Selecciona ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                          {publicLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name} {location.city ? `- ${location.city}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {showResults && (
          <>
            {!selectedVehicle ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    Vehículos Disponibles ({vehicles.length})
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResults(false);
                      setVehicles([]);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Nueva Búsqueda
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map((vehicle) => (
                    <Card 
                      key={vehicle.id} 
                      className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 hover:-translate-y-1"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {vehicle.imageUrl ? (
                          <img 
                            src={vehicle.imageUrl} 
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-24 h-24 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline">{vehicle.category}</Badge>
                          {vehicle.capacity && (
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              {vehicle.capacity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Desde</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {vehicle.pricePerDay}€
                              <span className="text-sm font-normal text-gray-500 ml-1">/día</span>
                            </p>
                          </div>
                          <Button className="group-hover:bg-blue-600 transition-colors">
                            Seleccionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Vehicle Summary */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Resumen de la Reserva</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg">
                      {selectedVehicle.imageUrl ? (
                        <img 
                          src={selectedVehicle.imageUrl} 
                          alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-24 h-24 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                      <p className="text-sm text-gray-600">Matrícula: {selectedVehicle.plate}</p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Recogida:</span>
                        <span className="font-semibold">
                          {pickupDate && format(pickupDate, "PPP", { locale: es })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Devolución:</span>
                        <span className="font-semibold">
                          {returnDate && format(returnDate, "PPP", { locale: es })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Días:</span>
                        <span className="font-semibold">
                          {pickupDate && returnDate && 
                            Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-3xl font-bold text-blue-600">
                          {calculateTotalPrice()}€
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedVehicle(null)}
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cambiar Vehículo
                    </Button>
                  </CardContent>
                </Card>

                {/* Customer Form */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Tus Datos</CardTitle>
                    <CardDescription>
                      Completa tus datos para finalizar la reserva
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="juan@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comments">Comentarios (opcional)</Label>
                      <Textarea
                        id="comments"
                        value={customerComments}
                        onChange={(e) => setCustomerComments(e.target.value)}
                        placeholder="¿Alguna solicitud especial?"
                        rows={3}
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-900">
                      <p className="font-semibold mb-1">⚠️ Nota Importante</p>
                      <p>
                        Esta es una <strong>solicitud de reserva</strong>. Recibirás un email de confirmación 
                        y nos pondremos en contacto contigo pronto para completar el proceso.
                      </p>
                    </div>

                    <Button 
                      onClick={handleBooking}
                      disabled={loading || !customerName || !customerEmail || !customerPhone}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? "Procesando..." : "Confirmar Reserva"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
