'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, Calendar, Car, Search, Filter, FileText, Trash2, Edit, Download, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import GastoModal from '@/components/modals/gasto-modal';

interface Gasto {
  id: number;
  fecha: Date;
  tipo_documento: string;
  numero_factura?: string;
  proveedor?: string;
  categoria: string;
  descripcion: string;
  base_imponible?: number;
  iva_porcentaje?: number;
  iva_importe?: number;
  total: number;
  metodo_pago: string;
  maintenance_id?: number;
  adjunto: boolean;
  factura_pdf_path?: string | null;
  vehicle?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
  };
}

export default function GastosPage() {
  const { data: session } = useSession() || {};
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [tipoDocumentoFilter, setTipoDocumentoFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [gastoToEdit, setGastoToEdit] = useState<Gasto | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadGastos();
    }
  }, [mounted, categoriaFilter, tipoDocumentoFilter]);

  const loadGastos = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (categoriaFilter && categoriaFilter !== 'all') {
        params.append('categoria', categoriaFilter);
      }
      if (tipoDocumentoFilter && tipoDocumentoFilter !== 'all') {
        params.append('tipo_documento', tipoDocumentoFilter);
      }
      
      const response = await fetch(`/api/gastos?${params.toString()}`);
      if (response?.ok) {
        const data = await response.json();
        setGastos(data.gastos);
      }
    } catch (error) {
      console.error('Error loading gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGasto = async (gastoId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/gastos/${gastoId}`, {
        method: 'DELETE',
      });
      
      if (response?.ok) {
        setGastos(gastos.filter(g => g.id !== gastoId));
      } else {
        const error = await response?.json();
        alert(error?.error || 'Error al eliminar el gasto');
      }
    } catch (error) {
      console.error('Error deleting gasto:', error);
      alert('Error al eliminar el gasto');
    }
  };
  
  const handleOpenGastoModal = (gasto?: Gasto) => {
    setGastoToEdit(gasto);
    setGastoModalOpen(true);
  };
  
  const handleCloseGastoModal = () => {
    setGastoModalOpen(false);
    setGastoToEdit(undefined);
  };
  
  const handleGastoSuccess = () => {
    loadGastos();
  };

  const convertS3PathToProxyUrl = (s3Path: string): string => {
    // Remover prefijo del bucket si existe
    const cleanPath = s3Path.replace(/^rental-app-storage\//, '');
    // Convertir a URL del proxy interno
    return `/api/s3/image/${cleanPath}`;
  };

  const verDocumentoAdjunto = (gasto: Gasto) => {
    if (!gasto.factura_pdf_path) {
      alert('Este gasto no tiene documento adjunto');
      return;
    }

    try {
      const proxyUrl = convertS3PathToProxyUrl(gasto.factura_pdf_path);
      window.open(proxyUrl, '_blank');
    } catch (error) {
      console.error('Error al abrir documento:', error);
      alert('Error al abrir el documento adjunto');
    }
  };

  const descargarDocumentoAdjunto = async (gasto: Gasto) => {
    if (!gasto.factura_pdf_path) {
      alert('Este gasto no tiene documento adjunto');
      return;
    }

    try {
      const proxyUrl = convertS3PathToProxyUrl(gasto.factura_pdf_path);
      
      // Crear enlace temporal y simular click
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.download = `gasto-${gasto.numero_factura || gasto.id}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar documento:', error);
      alert('Error al descargar el documento adjunto');
    }
  };

  const filteredGastos = gastos.filter(gasto => {
    const matchesSearch = 
      gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gasto.proveedor && gasto.proveedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gasto.numero_factura && gasto.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getMetodoPagoText = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO': return 'Efectivo';
      case 'TPV_SUMUP': return 'TPV SumUp';
      case 'TPV_UNICAJA': return 'TPV Unicaja';
      default: return metodo;
    }
  };

  const getTipoDocumentoColor = (tipo: string) => {
    return tipo === 'FACTURA' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
  };

  // Calcular totales
  const totalGeneral = filteredGastos.reduce((sum, g) => sum + parseFloat(g.total.toString()), 0);
  const totalTickets = filteredGastos
    .filter(g => g.tipo_documento === 'TICKET')
    .reduce((sum, g) => sum + parseFloat(g.total.toString()), 0);
  const totalFacturas = filteredGastos
    .filter(g => g.tipo_documento === 'FACTURA')
    .reduce((sum, g) => sum + parseFloat(g.total.toString()), 0);

  if (!mounted || loading) {
    return (
      <div className="p-6">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-7 w-7 text-green-600" />
            Diario de Gastos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos los gastos del negocio
          </p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => handleOpenGastoModal()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gastos</p>
                <p className="text-2xl font-bold text-gray-900">€{totalGeneral.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets</p>
                <p className="text-2xl font-bold text-gray-700">€{totalTickets.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facturas</p>
                <p className="text-2xl font-bold text-blue-600">€{totalFacturas.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descripción, proveedor o nº factura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="Combustible">🛢️ Combustible</SelectItem>
                <SelectItem value="Mantenimiento">🔧 Mantenimiento</SelectItem>
                <SelectItem value="Alquiler/Renting motos">🛵 Alquiler/Renting motos</SelectItem>
                <SelectItem value="Repuestos">⚙️ Repuestos</SelectItem>
                <SelectItem value="Alquiler">🏢 Alquiler</SelectItem>
                <SelectItem value="Seguros">🛡️ Seguros</SelectItem>
                <SelectItem value="Limpieza">🧹 Limpieza</SelectItem>
                <SelectItem value="Suministros">💡 Suministros</SelectItem>
                <SelectItem value="Administración">📋 Administración</SelectItem>
                <SelectItem value="Marketing y Publicidad">📢 Marketing y Publicidad</SelectItem>
                <SelectItem value="Personal">👥 Personal</SelectItem>
                <SelectItem value="Asesoría">💼 Asesoría</SelectItem>
                <SelectItem value="Otros">📦 Otros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoDocumentoFilter} onValueChange={setTipoDocumentoFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="TICKET">Tickets</SelectItem>
                <SelectItem value="FACTURA">Facturas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos */}
      <div className="space-y-4">
        {filteredGastos.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron gastos
              </h3>
              <p className="text-gray-500">
                {searchTerm || categoriaFilter !== 'all' || tipoDocumentoFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Registra tu primer gasto para comenzar'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGastos.map((gasto) => (
            <Card key={gasto.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">{gasto.descripcion}</h3>
                      <Badge className={getTipoDocumentoColor(gasto.tipo_documento)}>
                        {gasto.tipo_documento}
                      </Badge>
                      <Badge variant="outline">
                        {gasto.categoria}
                      </Badge>
                      {gasto.maintenance_id && (
                        <Badge className="bg-orange-100 text-orange-700">
                          Auto (Mantenimiento)
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(gasto.fecha)}</span>
                      </div>
                      {gasto.proveedor && (
                        <span>Proveedor: {gasto.proveedor}</span>
                      )}
                      {gasto.numero_factura && (
                        <span>Nº: {gasto.numero_factura}</span>
                      )}
                      {gasto.vehicle && (
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          <span>{gasto.vehicle.registration_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        Pago: {getMetodoPagoText(gasto.metodo_pago)}
                      </span>
                      {gasto.tipo_documento === 'FACTURA' && gasto.base_imponible && (
                        <>
                          <span className="text-gray-500">
                            Base: €{parseFloat(gasto.base_imponible.toString()).toFixed(2)}
                          </span>
                          <span className="text-gray-500">
                            IVA ({gasto.iva_porcentaje}%): €{parseFloat(gasto.iva_importe?.toString() || '0').toFixed(2)}
                          </span>
                        </>
                      )}
                      <span className="font-semibold text-green-700">
                        Total: €{parseFloat(gasto.total.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {/* Botones de documento adjunto */}
                    {gasto.adjunto && gasto.factura_pdf_path && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => verDocumentoAdjunto(gasto)}
                          title="Ver documento adjunto"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => descargarDocumentoAdjunto(gasto)}
                          title="Descargar documento adjunto"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {/* Botones de edición/eliminación */}
                    {!gasto.maintenance_id && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenGastoModal(gasto)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteGasto(gasto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Modal de Gasto */}
      <GastoModal
        open={gastoModalOpen}
        onClose={handleCloseGastoModal}
        onSuccess={handleGastoSuccess}
        gastoToEdit={gastoToEdit}
      />
    </div>
  );
}
