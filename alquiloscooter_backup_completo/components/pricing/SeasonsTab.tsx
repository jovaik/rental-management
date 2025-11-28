'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sun, Snowflake, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SeasonModal } from '@/components/modals/season-modal';

interface Season {
  id: number;
  season_name: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  is_high_season: boolean;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function SeasonsTab() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seasons');
      if (response?.ok) {
        const data = await response.json();
        setSeasons(data);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      toast.error('Error al cargar temporadas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta temporada?')) return;

    try {
      const response = await fetch(`/api/seasons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete season');

      toast.success('Temporada eliminada');
      fetchSeasons();
    } catch (error) {
      console.error('Error deleting season:', error);
      toast.error('Error al eliminar temporada');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Define las fechas de temporada alta y baja. Los precios base se aplican en temporada alta y se
            aplica el multiplicador en temporada baja.
          </p>
        </div>
        <Button onClick={() => { setSelectedSeason(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Temporada
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {seasons.map((season) => (
          <Card key={season.id} className={season.is_high_season ? 'border-orange-300' : 'border-blue-300'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {season.is_high_season ? (
                    <Sun className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Snowflake className="w-5 h-5 text-blue-500" />
                  )}
                  {season.season_name}
                </span>
                <Badge variant={season.is_high_season ? 'default' : 'secondary'}>
                  {season.is_high_season ? 'Alta' : 'Baja'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {season.start_day} de {monthNames[season.start_month - 1]} 
                  {' '}al{' '}
                  {season.end_day} de {monthNames[season.end_month - 1]}
                </span>
              </div>
              
              {season.is_high_season && (
                <div className="mb-4 p-3 bg-orange-50 rounded text-sm text-orange-800">
                  <p>Los precios base configurados en cada grupo de tarifas se aplican durante esta temporada.</p>
                </div>
              )}
              
              {!season.is_high_season && (
                <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                  <p>Se aplica el multiplicador de temporada baja configurado en cada grupo de tarifas.</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => { setSelectedSeason(season); setIsModalOpen(true); }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(season.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {seasons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No hay temporadas configuradas. Añade tu primera temporada para comenzar.</p>
          </CardContent>
        </Card>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">ℹ️ Información Importante</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Define todas las temporadas del año para que el sistema calcule correctamente los precios</li>
          <li>Los precios base se definen en la pestaña "Grupos de Tarifas" y representan precios de temporada alta</li>
          <li>En temporada baja se aplica automáticamente el multiplicador configurado en cada grupo</li>
          <li>Ejemplo: Si un scooter cuesta 25€/día en alta y el multiplicador es 0.5, en baja costará 12.50€/día</li>
        </ul>
      </div>

      <SeasonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchSeasons}
        season={selectedSeason}
      />
    </div>
  );
}
