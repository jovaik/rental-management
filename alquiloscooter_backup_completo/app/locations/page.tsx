
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NavigationButtons } from '@/components/ui/navigation-buttons';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Search, 
  Building2, 
  Wrench, 
  Package, 
  User,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LocationModal } from '@/components/modals/location-modal';

interface BusinessLocation {
  id: number;
  name: string;
  type: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  user_id?: number;
  notes?: string;
  active: boolean;
  is_public_pickup_point: boolean;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
  };
  _count?: {
    vehicles: number;
  };
}

const LOCATION_TYPES = {
  office: { label: 'Oficina', icon: Building2, color: 'text-blue-600' },
  workshop: { label: 'Taller', icon: Wrench, color: 'text-orange-600' },
  depot: { label: 'Depósito', icon: Package, color: 'text-purple-600' },
  client: { label: 'Cliente', icon: User, color: 'text-green-600' },
  other: { label: 'Otro', icon: MapPin, color: 'text-gray-600' },
};

export default function LocationsPage() {
  const { data: session } = useSession() || {};
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<BusinessLocation | undefined>();

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    filterData();
  }, [locations, searchTerm, filterType]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business-locations');
      if (response?.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = locations;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (loc) =>
          loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loc.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loc.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter((loc) => loc.type === filterType);
    }

    setFilteredLocations(filtered);
  };

  const handleSave = async (locationData: any) => {
    try {
      const url = selectedLocation
        ? `/api/business-locations/${selectedLocation.id}`
        : '/api/business-locations';
      
      const method = selectedLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });

      if (response?.ok) {
        toast.success(
          selectedLocation
            ? 'Ubicación actualizada correctamente'
            : 'Ubicación creada correctamente'
        );
        setIsModalOpen(false);
        setSelectedLocation(undefined);
        loadLocations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar ubicación');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Error al guardar ubicación');
    }
  };

  const handleDelete = async (location: BusinessLocation) => {
    if (location._count?.vehicles && location._count.vehicles > 0) {
      toast.error(
        `No se puede eliminar. Hay ${location._count.vehicles} vehículo(s) asignado(s).`
      );
      return;
    }

    if (
      !confirm(
        `¿Está seguro de eliminar la ubicación "${location.name}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/business-locations/${location.id}`, {
        method: 'DELETE',
      });

      if (response?.ok) {
        toast.success('Ubicación eliminada correctamente');
        loadLocations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar ubicación');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Error al eliminar ubicación');
    }
  };

  const handleEdit = (location: BusinessLocation) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedLocation(undefined);
    setIsModalOpen(true);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Botones de Navegación */}
      <NavigationButtons className="mb-4" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ubicaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona oficinas, talleres, depósitos y otras ubicaciones
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, ciudad, contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                Todas ({locations.length})
              </Button>
              {Object.entries(LOCATION_TYPES).map(([type, { label, icon: Icon }]) => {
                const count = locations.filter((l) => l.type === type).length;
                return (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(type)}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ubicaciones */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p>Cargando ubicaciones...</p>
          </CardContent>
        </Card>
      ) : filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron ubicaciones</p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => {
            const TypeInfo = LOCATION_TYPES[location.type as keyof typeof LOCATION_TYPES] || LOCATION_TYPES.other;
            const TypeIcon = TypeInfo.icon;
            
            return (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-gray-100 ${TypeInfo.color}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{location.name}</CardTitle>
                          {location.is_public_pickup_point && (
                            <Badge variant="default" className="bg-green-500 text-white text-xs">
                              Público
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{TypeInfo.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(location)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(location)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {location.address && (
                    <div className="text-sm">
                      <p className="text-gray-700">{location.address}</p>
                      {location.city && (
                        <p className="text-gray-600">
                          {location.city}
                          {location.postal_code && ` - ${location.postal_code}`}
                        </p>
                      )}
                    </div>
                  )}

                  {location.contact_person && (
                    <div className="text-sm">
                      <p className="text-gray-700 font-medium">
                        {location.contact_person}
                      </p>
                      {location.contact_phone && (
                        <p className="text-gray-600">{location.contact_phone}</p>
                      )}
                      {location.contact_email && (
                        <p className="text-gray-600 text-xs">{location.contact_email}</p>
                      )}
                    </div>
                  )}

                  {location.user && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600">Usuario asociado:</p>
                      <p className="text-sm font-medium">
                        {location.user.firstname} {location.user.lastname}
                      </p>
                      <p className="text-xs text-gray-600">{location.user.role}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vehículos:</span>
                      <span className="font-semibold">
                        {location._count?.vehicles || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLocation(undefined);
        }}
        onSave={handleSave}
        location={selectedLocation}
      />
    </div>
  );
}
