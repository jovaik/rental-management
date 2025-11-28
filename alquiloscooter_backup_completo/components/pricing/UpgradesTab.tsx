
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UpgradeModal } from '@/components/modals/upgrade-modal';

interface Upgrade {
  id: number;
  name: string;
  description: string | null;
  upgrade_type: string;
  fee_per_day: number;
  is_available: boolean;
  display_order: number;
}

export default function UpgradesTab() {
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<Upgrade | null>(null);

  useEffect(() => {
    fetchUpgrades();
  }, []);

  const fetchUpgrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing/upgrades');
      if (!response.ok) throw new Error('Failed to fetch upgrades');
      const data = await response.json();
      setUpgrades(data);
    } catch (error) {
      console.error('Error fetching upgrades:', error);
      toast.error('Error al cargar upgrades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este upgrade?')) return;

    try {
      const response = await fetch(`/api/pricing/upgrades/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete upgrade');

      toast.success('Upgrade eliminado');
      fetchUpgrades();
    } catch (error) {
      console.error('Error deleting upgrade:', error);
      toast.error('Error al eliminar upgrade');
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
          <h2 className="text-2xl font-bold tracking-tight">Upgrades & Add-ons</h2>
          <p className="text-muted-foreground">
            Gestiona seguros adicionales, kilometraje ilimitado y otros upgrades
          </p>
        </div>
        <Button onClick={() => { setSelectedUpgrade(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Upgrade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Upgrades Disponibles
          </CardTitle>
          <CardDescription>
            Servicios adicionales y opciones de protección para alquileres
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upgrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay upgrades configurados. Añade tu primer upgrade para comenzar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tarifa por Día</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upgrades.map((upgrade) => (
                  <TableRow key={upgrade.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{upgrade.name}</div>
                        {upgrade.description && (
                          <div className="text-sm text-muted-foreground">
                            {upgrade.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{upgrade.upgrade_type}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(Number(upgrade.fee_per_day))}</TableCell>
                    <TableCell>
                      <Badge
                        variant={upgrade.is_available ? 'default' : 'secondary'}
                      >
                        {upgrade.is_available ? 'Disponible' : 'No disponible'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedUpgrade(upgrade); setIsModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(upgrade.id)}
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

      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchUpgrades}
        upgrade={selectedUpgrade}
      />
    </div>
  );
}
