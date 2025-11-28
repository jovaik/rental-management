
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Car, AlertCircle, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type VehicleCommission = {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  ownership_type: string;
  commission_percentage: number | null;
  monthly_fixed_costs: number | null;
  total_revenue: number;
  total_days_rented: number;
  commission_amount: number;
  net_income: number;
  our_share: number;
  owner_name: string;
  bookings_count: number;
};

type BookingDetail = {
  id: number;
  booking_number: string; // LOPD: Número de reserva en lugar de nombre de cliente
  pickup_date: string;
  return_date: string;
  total_price: number;
  status: string;
  days: number;
};

type YearlyTotals = {
  total_revenue: number;
  total_commissions: number;
  total_net_income: number;
  total_our_share: number;
};

type Owner = {
  id: number;
  name: string;
};

// Updated: 2025-11-05 - Sistema de comisiones con filtro de propietarios
export default function ComisionesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleCommission[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCommission | null>(null);
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" o "0"-"11" para los meses
  const [selectedOwner, setSelectedOwner] = useState<string>("all"); // "all" o ID del propietario
  const [owners, setOwners] = useState<Owner[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<YearlyTotals>({
    total_revenue: 0,
    total_commissions: 0,
    total_net_income: 0,
    total_our_share: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const userRole = session?.user?.role;
      if (!["super_admin", "propietario", "colaborador"].includes(userRole || "")) {
        toast.error("No tienes permisos para acceder a esta página");
        router.push("/");
        return;
      }
      loadOwners();
      loadVehicles();
      loadYearlyTotals();
    }
  }, [status, session, router, selectedMonth, selectedOwner]);

  const loadOwners = async () => {
    try {
      const response = await fetch('/api/comisiones/owners');
      if (!response.ok) throw new Error("Error al cargar propietarios");
      const data = await response.json();
      setOwners(data);
    } catch (error) {
      console.error("Error loading owners:", error);
    }
  };

  const loadVehicles = async () => {
    try {
      const params = new URLSearchParams({ month: selectedMonth });
      if (selectedOwner !== "all") {
        params.append("ownerId", selectedOwner);
      }
      const response = await fetch(`/api/comisiones?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar datos de comisiones");
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error loading commissions:", error);
      toast.error("Error al cargar datos de comisiones");
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyTotals = async () => {
    try {
      const params = new URLSearchParams({ month: "all" });
      if (selectedOwner !== "all") {
        params.append("ownerId", selectedOwner);
      }
      const response = await fetch(`/api/comisiones?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar totales anuales");
      const data = await response.json();
      
      const totals = {
        total_revenue: data.reduce((sum: number, v: VehicleCommission) => sum + v.total_revenue, 0),
        total_commissions: data.reduce((sum: number, v: VehicleCommission) => sum + v.commission_amount, 0),
        total_net_income: data.reduce((sum: number, v: VehicleCommission) => sum + v.net_income, 0),
        total_our_share: data.reduce((sum: number, v: VehicleCommission) => sum + v.our_share, 0),
      };
      
      setYearlyTotals(totals);
    } catch (error) {
      console.error("Error loading yearly totals:", error);
    }
  };

  const loadVehicleBookings = async (vehicleId: number) => {
    setLoadingBookings(true);
    try {
      const response = await fetch(`/api/comisiones/${vehicleId}?month=${selectedMonth}`);
      if (!response.ok) throw new Error("Error al cargar alquileres");
      const data = await response.json();
      setBookings(data.bookings);
      setSelectedVehicle(vehicles.find(v => v.id === vehicleId) || null);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Error al cargar alquileres del vehículo");
    } finally {
      setLoadingBookings(false);
    }
  };

  const getTotalRevenue = () => {
    return vehicles.reduce((sum, v) => sum + v.total_revenue, 0);
  };

  const getTotalCommissions = () => {
    return vehicles.reduce((sum, v) => sum + v.commission_amount, 0);
  };

  const getTotalNetIncome = () => {
    return vehicles.reduce((sum, v) => sum + v.net_income, 0);
  };
  
  const getTotalOurShare = () => {
    return vehicles.reduce((sum, v) => sum + v.our_share, 0);
  };

  const getOwnershipBadge = (type: string) => {
    switch (type) {
      case "owned":
        return <Badge variant="secondary">Propio</Badge>;
      case "renting":
        return <Badge variant="outline">Renting</Badge>;
      case "commission":
        return <Badge variant="default">Comisión</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando datos de comisiones...</p>
      </div>
    );
  }

  const months = [
    { value: "all", label: "Todo el año" },
    { value: "0", label: "Enero" },
    { value: "1", label: "Febrero" },
    { value: "2", label: "Marzo" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Mayo" },
    { value: "5", label: "Junio" },
    { value: "6", label: "Julio" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Septiembre" },
    { value: "9", label: "Octubre" },
    { value: "10", label: "Noviembre" },
    { value: "11", label: "Diciembre" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comisiones y Rentabilidad</h1>
          <p className="text-muted-foreground">
            {session?.user?.role === "super_admin" 
              ? "Gestión completa de comisiones de todos los vehículos"
              : "Tus vehículos y comisiones"
            }
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {session?.user?.role === "super_admin" && owners.length > 0 && (
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Seleccionar propietario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los propietarios</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id.toString()}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Acumulado Anual - KPI Destacado */}
      {selectedMonth !== "all" && (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Acumulado Anual 2025
              {selectedOwner !== "all" && (
                <Badge variant="secondary" className="ml-2">
                  {owners.find(o => o.id.toString() === selectedOwner)?.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-purple-700">
              {selectedOwner === "all" 
                ? `Total de comisiones del año completo (mostrando datos de ${months.find(m => m.value === selectedMonth)?.label})`
                : `Comisiones anuales de ${owners.find(o => o.id.toString() === selectedOwner)?.name} (mostrando ${months.find(m => m.value === selectedMonth)?.label})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-purple-700 font-medium mb-1">Ingresos Totales</p>
                <p className="text-xl font-bold text-purple-900">{yearlyTotals.total_revenue.toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-xs text-purple-700 font-medium mb-1">Beneficio Neto</p>
                <p className="text-xl font-bold text-green-700">{yearlyTotals.total_net_income.toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-xs text-purple-700 font-medium mb-1">Comisiones Pagadas</p>
                <p className="text-xl font-bold text-orange-700">{yearlyTotals.total_commissions.toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-xs text-purple-700 font-medium mb-1">Nuestra Parte</p>
                <p className="text-2xl font-bold text-purple-900">{yearlyTotals.total_our_share.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards del período seleccionado */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          {selectedMonth === "all" ? "Resumen Anual" : `Resumen de ${months.find(m => m.value === selectedMonth)?.label}`}
        </h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{getTotalRevenue().toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                De {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{getTotalNetIncome().toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                Ingresos - Gastos Fijos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones Propietarios</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{getTotalCommissions().toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                A pagar a propietarios
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Nuestra Parte</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{getTotalOurShare().toFixed(2)}€</div>
              <p className="text-xs text-purple-700">
                Beneficio - Comisiones
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Vehículo</CardTitle>
          <CardDescription>
            Haz clic en un vehículo para ver sus alquileres detallados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Días</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Costos Fijos</TableHead>
                <TableHead className="text-right">Beneficio Neto</TableHead>
                <TableHead className="text-right">Comisión (%)</TableHead>
                <TableHead className="text-right">A Propietario</TableHead>
                <TableHead className="text-right">Nuestra Parte</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-12 w-12 mb-4 text-muted-foreground" />
                      <p>No hay datos de comisiones para el período seleccionado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow 
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => loadVehicleBookings(vehicle.id)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.registration_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {vehicle.owner_name || 'Sin propietario'}
                    </TableCell>
                    <TableCell className="text-right">{vehicle.bookings_count}</TableCell>
                    <TableCell className="text-right">{vehicle.total_days_rented}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {vehicle.total_revenue.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {vehicle.monthly_fixed_costs && vehicle.monthly_fixed_costs > 0
                        ? `-${vehicle.monthly_fixed_costs.toFixed(2)}€`
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {vehicle.net_income.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      {vehicle.commission_percentage ? `${vehicle.commission_percentage}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      {vehicle.commission_amount > 0
                        ? `${vehicle.commission_amount.toFixed(2)}€`
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-right font-bold text-purple-600">
                      {vehicle.our_share.toFixed(2)}€
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadVehicleBookings(vehicle.id);
                        }}
                      >
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bookings Detail Dialog */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>
              Alquileres de {selectedVehicle.make} {selectedVehicle.model}
            </CardTitle>
            <CardDescription>
              Matrícula: {selectedVehicle.registration_number}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <p className="text-center text-muted-foreground py-4">Cargando alquileres...</p>
            ) : bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay alquileres registrados en este período
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Reserva</TableHead>
                    <TableHead>Recogida</TableHead>
                    <TableHead>Devolución</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.booking_number}</TableCell>
                      <TableCell>
                        {format(new Date(booking.pickup_date), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.return_date), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">{booking.days}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {booking.total_price.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}