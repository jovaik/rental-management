
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Download,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VehicleDetails {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  commission_percentage: any;
  estadisticas: {
    totalReservas: number;
    reservasActivas: number;
    ingresosTotales: string;
    comisionPorcentaje: number;
    comisionTotal: string;
    totalGastos: string;
    balance: string;
  };
  pricingGroup: {
    name: string;
    price_per_day: any;
  } | null;
}

interface Reserva {
  id: number;
  booking_number: string;
  pickup_date: string;
  return_date: string;
  actual_pickup: string | null;
  actual_return: string | null;
  status: string;
  total_price: any;
  comision: string;
}

interface Gasto {
  id: number;
  fecha: string;
  tipo_documento: string;
  numero_factura: string | null;
  proveedor: string | null;
  categoria: string;
  descripcion: string;
  total: any;
  metodo_pago: string;
}

export default function VehicleDetailPage({ params }: { params: { vehicleId: string } }) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehiculo, setVehiculo] = useState<VehicleDetails | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGastoDialog, setShowGastoDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'resumen');

  // Form state para nuevo gasto
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_documento: 'TICKET',
    numero_factura: '',
    proveedor: '',
    proveedor_cif: '',
    categoria: 'Mantenimiento',
    descripcion: '',
    base_imponible: '',
    iva_porcentaje: '21',
    iva_importe: '',
    total: '',
    metodo_pago: 'EFECTIVO'
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'propietario' && session.user?.role !== 'super_admin') {
      toast.error('No tienes acceso a esta página');
      router.push('/');
      return;
    }

    fetchVehicleDetails();
  }, [session, status, params.vehicleId, router]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/propietarios/vehiculos/${params.vehicleId}`);
      const data = await response.json();

      if (data.success) {
        setVehiculo(data.vehiculo);
        setReservas(data.reservas);
        setGastos(data.gastos);
      } else {
        toast.error('Error al cargar detalles del vehículo');
        router.push('/mis-vehiculos');
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      toast.error('Error al cargar detalles del vehículo');
      router.push('/mis-vehiculos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGasto = async () => {
    try {
      // Validaciones
      if (!nuevoGasto.categoria || !nuevoGasto.descripcion || !nuevoGasto.total) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const response = await fetch('/api/propietarios/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoGasto,
          vehicle_id: params.vehicleId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Gasto registrado correctamente');
        setShowGastoDialog(false);
        fetchVehicleDetails();
        // Reset form
        setNuevoGasto({
          fecha: new Date().toISOString().split('T')[0],
          tipo_documento: 'TICKET',
          numero_factura: '',
          proveedor: '',
          proveedor_cif: '',
          categoria: 'Mantenimiento',
          descripcion: '',
          base_imponible: '',
          iva_porcentaje: '21',
          iva_importe: '',
          total: '',
          metodo_pago: 'EFECTIVO'
        });
      } else {
        toast.error(data.error || 'Error al registrar gasto');
      }
    } catch (error) {
      console.error('Error creating gasto:', error);
      toast.error('Error al registrar gasto');
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'confirmed': { label: 'Confirmada', variant: 'default' },
      'in_progress': { label: 'En Curso', variant: 'secondary' },
      'completed': { label: 'Completada', variant: 'outline' },
      'cancelled': { label: 'Cancelada', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!vehiculo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/mis-vehiculos')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mis Vehículos
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {vehiculo.make} {vehiculo.model}
            </h1>
            <p className="text-gray-600 mt-1">
              {vehiculo.registration_number} • {vehiculo.year} • {vehiculo.color}
            </p>
          </div>
          <Badge className="text-lg px-4 py-2">
            {vehiculo.estadisticas.comisionPorcentaje}% comisión
          </Badge>
        </div>

        {/* Estadísticas Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehiculo.estadisticas.totalReservas}</div>
              <p className="text-xs text-gray-500 mt-1">
                {vehiculo.estadisticas.reservasActivas} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tu Comisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(vehiculo.estadisticas.comisionTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                de {formatCurrency(vehiculo.estadisticas.ingresosTotales)} totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(vehiculo.estadisticas.totalGastos)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {gastos.length} registros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${parseFloat(vehiculo.estadisticas.balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(vehiculo.estadisticas.balance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Comisión - Gastos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumen">Reservas</TabsTrigger>
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
          </TabsList>

          {/* Tab Reservas */}
          <TabsContent value="resumen" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Reservas</CardTitle>
                <CardDescription>
                  Todas las reservas de este vehículo (sin datos personales de clientes)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reservas.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay reservas registradas para este vehículo
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-600">N° Reserva</th>
                          <th className="text-left p-3 font-medium text-gray-600">Fecha Recogida</th>
                          <th className="text-left p-3 font-medium text-gray-600">Fecha Entrega</th>
                          <th className="text-left p-3 font-medium text-gray-600">Estado</th>
                          <th className="text-right p-3 font-medium text-gray-600">Total</th>
                          <th className="text-right p-3 font-medium text-gray-600">Tu Comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map((reserva) => (
                          <tr key={reserva.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{reserva.booking_number}</td>
                            <td className="p-3 text-sm">{formatDate(reserva.pickup_date)}</td>
                            <td className="p-3 text-sm">{formatDate(reserva.return_date)}</td>
                            <td className="p-3">{getStatusBadge(reserva.status)}</td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(reserva.total_price)}
                            </td>
                            <td className="p-3 text-right font-bold text-green-600">
                              {formatCurrency(reserva.comision)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gastos */}
          <TabsContent value="gastos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gastos del Vehículo</CardTitle>
                    <CardDescription>
                      Registro de todos los gastos asociados a este vehículo
                    </CardDescription>
                  </div>
                  <Dialog open={showGastoDialog} onOpenChange={setShowGastoDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Gasto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                        <DialogDescription>
                          Completa los datos del gasto para este vehículo
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fecha">Fecha *</Label>
                            <Input
                              id="fecha"
                              type="date"
                              value={nuevoGasto.fecha}
                              onChange={(e) => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tipo_documento">Tipo Documento *</Label>
                            <Select
                              value={nuevoGasto.tipo_documento}
                              onValueChange={(value) => setNuevoGasto({ ...nuevoGasto, tipo_documento: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TICKET">Ticket</SelectItem>
                                <SelectItem value="FACTURA">Factura</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {nuevoGasto.tipo_documento === 'FACTURA' && (
                          <div className="space-y-2">
                            <Label htmlFor="numero_factura">Número de Factura</Label>
                            <Input
                              id="numero_factura"
                              value={nuevoGasto.numero_factura}
                              onChange={(e) => setNuevoGasto({ ...nuevoGasto, numero_factura: e.target.value })}
                              placeholder="Ej: F-2024-001"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="proveedor">Proveedor</Label>
                            <Input
                              id="proveedor"
                              value={nuevoGasto.proveedor}
                              onChange={(e) => setNuevoGasto({ ...nuevoGasto, proveedor: e.target.value })}
                              placeholder="Nombre del proveedor"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="proveedor_cif">CIF/NIF Proveedor</Label>
                            <Input
                              id="proveedor_cif"
                              value={nuevoGasto.proveedor_cif}
                              onChange={(e) => setNuevoGasto({ ...nuevoGasto, proveedor_cif: e.target.value })}
                              placeholder="B12345678"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="categoria">Categoría *</Label>
                          <Select
                            value={nuevoGasto.categoria}
                            onValueChange={(value) => setNuevoGasto({ ...nuevoGasto, categoria: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                              <SelectItem value="Combustible">Combustible</SelectItem>
                              <SelectItem value="Seguros">Seguros</SelectItem>
                              <SelectItem value="Impuestos">Impuestos</SelectItem>
                              <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                              <SelectItem value="Limpieza">Limpieza</SelectItem>
                              <SelectItem value="Otros">Otros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="descripcion">Descripción *</Label>
                          <Textarea
                            id="descripcion"
                            value={nuevoGasto.descripcion}
                            onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
                            placeholder="Describe el gasto..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="total">Total (€) *</Label>
                          <Input
                            id="total"
                            type="number"
                            step="0.01"
                            value={nuevoGasto.total}
                            onChange={(e) => setNuevoGasto({ ...nuevoGasto, total: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="metodo_pago">Método de Pago *</Label>
                          <Select
                            value={nuevoGasto.metodo_pago}
                            onValueChange={(value) => setNuevoGasto({ ...nuevoGasto, metodo_pago: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EFECTIVO">Efectivo (TICKET)</SelectItem>
                              <SelectItem value="TPV_SUMUP">TPV SUMUP (TICKET)</SelectItem>
                              <SelectItem value="TPV_UNICAJA">TPV UNICAJA - Tarjeta (FACTURA)</SelectItem>
                              <SelectItem value="TRANSFERENCIA">Transferencia (FACTURA)</SelectItem>
                              <SelectItem value="BIZUM">Bizum (FACTURA)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGastoDialog(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCreateGasto}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Registrar Gasto
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {gastos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay gastos registrados para este vehículo
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                          <th className="text-left p-3 font-medium text-gray-600">Tipo</th>
                          <th className="text-left p-3 font-medium text-gray-600">Categoría</th>
                          <th className="text-left p-3 font-medium text-gray-600">Descripción</th>
                          <th className="text-left p-3 font-medium text-gray-600">Proveedor</th>
                          <th className="text-right p-3 font-medium text-gray-600">Total</th>
                          <th className="text-left p-3 font-medium text-gray-600">Método</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gastos.map((gasto) => (
                          <tr key={gasto.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{formatDate(gasto.fecha)}</td>
                            <td className="p-3">
                              <Badge variant={gasto.tipo_documento === 'FACTURA' ? 'default' : 'secondary'}>
                                {gasto.tipo_documento}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">{gasto.categoria}</td>
                            <td className="p-3 text-sm">{gasto.descripcion}</td>
                            <td className="p-3 text-sm">{gasto.proveedor || '-'}</td>
                            <td className="p-3 text-right font-bold text-red-600">
                              {formatCurrency(gasto.total)}
                            </td>
                            <td className="p-3 text-sm">{gasto.metodo_pago}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
