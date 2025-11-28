'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Compass, Plus, Loader2, Users, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ExperienceModal } from '@/components/modals/experience-modal';

interface Experience {
  id: number;
  name: string;
  description: string | null;
  experience_type: string;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_fixed: number | null;
  duration_minutes: number | null;
  max_participants: number | null;
  min_age: number | null;
  is_available: boolean;
  requires_booking: boolean;
  advance_booking_hours: number;
  display_order: number;
}

export default function ExperiencesTab() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing/experiences');
      if (!response.ok) throw new Error('Failed to fetch experiences');
      const data = await response.json();
      setExperiences(data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast.error('Error al cargar experiencias');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta experiencia?')) return;

    try {
      const response = await fetch(`/api/pricing/experiences/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete experience');

      toast.success('Experiencia eliminada');
      fetchExperiences();
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast.error('Error al eliminar experiencia');
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return `€${Number(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Experiencias & Tours</h2>
          <p className="text-muted-foreground">
            Gestiona tours, lecciones y paquetes de experiencia (jet ski, buggies, excursiones, etc.)
          </p>
        </div>
        <Button onClick={() => { setSelectedExperience(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Experiencia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Experiencias Disponibles
          </CardTitle>
          <CardDescription>
            Tours, clases de conducción y otros paquetes de experiencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {experiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay experiencias configuradas. Añade tu primera experiencia para comenzar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Por Hora</TableHead>
                  <TableHead>Por Día</TableHead>
                  <TableHead>Fijo</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Max Part.</TableHead>
                  <TableHead>Edad Mín.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiences.map((experience) => (
                  <TableRow key={experience.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{experience.name}</div>
                        {experience.description && (
                          <div className="text-sm text-muted-foreground">
                            {experience.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{experience.experience_type}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(experience.price_per_hour)}</TableCell>
                    <TableCell>{formatPrice(experience.price_per_day)}</TableCell>
                    <TableCell>{formatPrice(experience.price_fixed)}</TableCell>
                    <TableCell>
                      {experience.duration_minutes 
                        ? `${Math.floor(experience.duration_minutes / 60)}h ${experience.duration_minutes % 60}m` 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {experience.max_participants || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {experience.min_age ? `${experience.min_age}+` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={experience.is_available ? 'default' : 'secondary'}
                      >
                        {experience.is_available ? 'Disponible' : 'No disponible'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedExperience(experience); setIsModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(experience.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchExperiences}
        experience={selectedExperience}
      />
    </div>
  );
}
