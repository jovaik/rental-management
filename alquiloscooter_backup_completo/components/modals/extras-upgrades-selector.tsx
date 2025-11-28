
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { Plus, Minus, DollarSign, Tag } from 'lucide-react';

interface Extra {
  id: number;
  name: string;
  description?: string;
  extra_type: string;
  pricing_type: string;
  price: number;
  is_available: boolean;
}

interface Upgrade {
  id: number;
  name: string;
  description?: string;
  upgrade_type: string;
  fee_per_day: number;
  is_available: boolean;
}

interface Experience {
  id: number;
  name: string;
  description?: string;
  experience_type: string;
  price_per_hour?: number;
  price_per_day?: number;
  price_fixed?: number;
  duration_minutes?: number;
  max_participants?: number;
  is_available: boolean;
}

interface SelectedExtra {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SelectedUpgrade {
  id: number;
  name: string;
  days: number;
  unitPricePerDay: number;
  totalPrice: number;
}

interface SelectedExperience {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ExtrasUpgradesSelectorProps {
  rentalDays: number;
  vehicleCount: number; // Cantidad de vehículos para multiplicar precios
  selectedExtras: SelectedExtra[];
  selectedUpgrades: SelectedUpgrade[];
  selectedExperiences: SelectedExperience[];
  onExtrasChange: (extras: SelectedExtra[]) => void;
  onUpgradesChange: (upgrades: SelectedUpgrade[]) => void;
  onExperiencesChange: (experiences: SelectedExperience[]) => void;
}

export function ExtrasUpgradesSelector({
  rentalDays,
  vehicleCount,
  selectedExtras,
  selectedUpgrades,
  selectedExperiences,
  onExtrasChange,
  onUpgradesChange,
  onExperiencesChange
}: ExtrasUpgradesSelectorProps) {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 [ExtrasUpgradesSelector] Cargando extras, upgrades y experiencias...');
      
      const [extrasRes, upgradesRes, experiencesRes] = await Promise.all([
        fetch('/api/pricing/extras'),
        fetch('/api/pricing/upgrades'),
        fetch('/api/pricing/experiences')
      ]);

      console.log(`📊 [ExtrasUpgradesSelector] Respuestas: Extras=${extrasRes.status}, Upgrades=${upgradesRes.status}, Experiencias=${experiencesRes.status}`);

      if (extrasRes.ok && upgradesRes.ok && experiencesRes.ok) {
        const extrasData = await extrasRes.json();
        const upgradesData = await upgradesRes.json();
        const experiencesData = await experiencesRes.json();
        
        const availableExtras = extrasData.filter((e: Extra) => e.is_available);
        const availableUpgrades = upgradesData.filter((u: Upgrade) => u.is_available);
        const availableExperiences = experiencesData.filter((exp: Experience) => exp.is_available);
        
        console.log(`✅ [ExtrasUpgradesSelector] Datos cargados: ${availableExtras.length} extras, ${availableUpgrades.length} upgrades, ${availableExperiences.length} experiencias`);
        
        setExtras(availableExtras);
        setUpgrades(availableUpgrades);
        setExperiences(availableExperiences);
      } else {
        console.error('❌ [ExtrasUpgradesSelector] Error en respuestas:', {
          extras: extrasRes.status,
          upgrades: upgradesRes.status,
          experiences: experiencesRes.status
        });
        toast.error('Error al cargar datos. Verifica la autenticación.');
      }
    } catch (error) {
      console.error('❌ [ExtrasUpgradesSelector] Error loading extras, upgrades and experiences:', error);
      toast.error('Error al cargar extras, upgrades y experiencias');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraToggle = (extra: Extra, checked: boolean) => {
    if (checked) {
      const newExtra: SelectedExtra = {
        id: extra.id,
        name: extra.name,
        quantity: 1,
        unitPrice: Number(extra.price),
        totalPrice: Number(extra.price) * vehicleCount // Multiplicar por cantidad de vehículos
      };
      console.log('✅ [Extra seleccionado]', newExtra);
      onExtrasChange([...selectedExtras, newExtra]);
    } else {
      console.log('❌ [Extra deseleccionado]', extra.name);
      onExtrasChange(selectedExtras.filter(e => e.id !== extra.id));
    }
  };

  const handleExtraQuantityChange = (extraId: number, quantity: number) => {
    const updatedExtras = selectedExtras.map(e => {
      if (e.id === extraId) {
        return {
          ...e,
          quantity: Math.max(1, quantity),
          totalPrice: e.unitPrice * Math.max(1, quantity) * vehicleCount // Multiplicar por vehículos
        };
      }
      return e;
    });
    onExtrasChange(updatedExtras);
  };

  const handleUpgradeToggle = (upgrade: Upgrade, checked: boolean) => {
    if (checked) {
      const newUpgrade: SelectedUpgrade = {
        id: upgrade.id,
        name: upgrade.name,
        days: rentalDays,
        unitPricePerDay: Number(upgrade.fee_per_day),
        totalPrice: Number(upgrade.fee_per_day) * rentalDays * vehicleCount // Multiplicar por vehículos
      };
      onUpgradesChange([...selectedUpgrades, newUpgrade]);
    } else {
      onUpgradesChange(selectedUpgrades.filter(u => u.id !== upgrade.id));
    }
  };

  const handleExperienceToggle = (experience: Experience, checked: boolean) => {
    if (checked) {
      // Determinar el precio según el tipo de tarificación
      const price = experience.price_fixed 
        || (experience.price_per_day ? Number(experience.price_per_day) * rentalDays : 0)
        || (experience.price_per_hour ? Number(experience.price_per_hour) * ((experience.duration_minutes || 60) / 60) : 0);
      
      const newExperience: SelectedExperience = {
        id: experience.id,
        name: experience.name,
        quantity: 1,
        unitPrice: Number(price),
        totalPrice: Number(price) // Las experiencias no se multiplican por vehículos, son por reserva
      };
      console.log('✅ [Experiencia seleccionada]', newExperience);
      onExperiencesChange([...selectedExperiences, newExperience]);
    } else {
      console.log('❌ [Experiencia deseleccionada]', experience.name);
      onExperiencesChange(selectedExperiences.filter(exp => exp.id !== experience.id));
    }
  };

  const handleExperienceQuantityChange = (experienceId: number, quantity: number) => {
    const updatedExperiences = selectedExperiences.map(exp => {
      if (exp.id === experienceId) {
        return {
          ...exp,
          quantity: Math.max(1, quantity),
          totalPrice: exp.unitPrice * Math.max(1, quantity)
        };
      }
      return exp;
    });
    onExperiencesChange(updatedExperiences);
  };

  const getTotalExtras = () => {
    return selectedExtras.reduce((sum, e) => sum + e.totalPrice, 0);
  };

  const getTotalUpgrades = () => {
    return selectedUpgrades.reduce((sum, u) => sum + u.totalPrice, 0);
  };

  const getTotalExperiences = () => {
    return selectedExperiences.reduce((sum, exp) => sum + exp.totalPrice, 0);
  };

  const getTotalAll = () => {
    return getTotalExtras() + getTotalUpgrades() + getTotalExperiences();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Cargando extras y upgrades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="extras" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="extras">
            Extras {selectedExtras.length > 0 && <Badge variant="secondary" className="ml-2">{selectedExtras.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="upgrades">
            Upgrades {selectedUpgrades.length > 0 && <Badge variant="secondary" className="ml-2">{selectedUpgrades.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="experiences">
            Experiencias {selectedExperiences.length > 0 && <Badge variant="secondary" className="ml-2">{selectedExperiences.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extras" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Selecciona los extras que desees añadir a la reserva
          </div>

          {extras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay extras disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {extras.map((extra) => {
                const selected = selectedExtras.find(e => e.id === extra.id);
                const isSelected = !!selected;

                return (
                  <Card key={extra.id} className={isSelected ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            id={`extra-${extra.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleExtraToggle(extra, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`extra-${extra.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {extra.name}
                            </Label>
                            {extra.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {extra.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {extra.pricing_type === 'fixed' && 'Precio fijo'}
                                {extra.pricing_type === 'per_day' && 'Por día'}
                                {extra.pricing_type === 'per_km' && 'Por km'}
                              </Badge>
                              <span className="text-sm font-semibold">
                                {Number(extra.price).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExtraQuantityChange(extra.id, selected!.quantity - 1)}
                              className="h-8 w-8 flex items-center justify-center rounded border hover:bg-muted"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <Input
                              type="number"
                              min="1"
                              value={selected!.quantity}
                              onChange={(e) => handleExtraQuantityChange(extra.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleExtraQuantityChange(extra.id, selected!.quantity + 1)}
                              className="h-8 w-8 flex items-center justify-center rounded border hover:bg-muted"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-semibold ml-2 min-w-[60px] text-right">
                              {selected!.totalPrice.toFixed(2)} €
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedExtras.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Extras:</span>
                  <span className="text-lg font-bold">{getTotalExtras().toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upgrades" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Selecciona los upgrades que desees añadir ({rentalDays} {rentalDays === 1 ? 'día' : 'días'})
          </div>

          {upgrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay upgrades disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {upgrades.map((upgrade) => {
                const selected = selectedUpgrades.find(u => u.id === upgrade.id);
                const isSelected = !!selected;
                const totalPrice = Number(upgrade.fee_per_day) * rentalDays;

                return (
                  <Card key={upgrade.id} className={isSelected ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            id={`upgrade-${upgrade.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleUpgradeToggle(upgrade, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`upgrade-${upgrade.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {upgrade.name}
                            </Label>
                            {upgrade.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {upgrade.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {Number(upgrade.fee_per_day).toFixed(2)} € / día
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                × {rentalDays} {rentalDays === 1 ? 'día' : 'días'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-semibold">
                            {totalPrice.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedUpgrades.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Upgrades:</span>
                  <span className="text-lg font-bold">{getTotalUpgrades().toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="experiences" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Selecciona las experiencias que desees añadir a tu reserva
          </div>

          {experiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay experiencias disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {experiences.map((experience) => {
                const selected = selectedExperiences.find(exp => exp.id === experience.id);
                const isSelected = !!selected;
                
                // Calcular precio según tipo de tarificación
                const price = experience.price_fixed 
                  || (experience.price_per_day ? Number(experience.price_per_day) * rentalDays : 0)
                  || (experience.price_per_hour ? Number(experience.price_per_hour) * ((experience.duration_minutes || 60) / 60) : 0);

                return (
                  <Card key={experience.id} className={isSelected ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            id={`experience-${experience.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleExperienceToggle(experience, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`experience-${experience.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {experience.name}
                            </Label>
                            {experience.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {experience.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {experience.price_fixed && 'Precio fijo'}
                                {experience.price_per_day && 'Por día'}
                                {experience.price_per_hour && 'Por hora'}
                              </Badge>
                              <span className="text-sm font-semibold">
                                {Number(price).toFixed(2)} €
                              </span>
                              {experience.duration_minutes && (
                                <span className="text-xs text-muted-foreground">
                                  ({experience.duration_minutes} min)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExperienceQuantityChange(experience.id, selected!.quantity - 1)}
                              className="h-8 w-8 flex items-center justify-center rounded border hover:bg-muted"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <Input
                              type="number"
                              min="1"
                              value={selected!.quantity}
                              onChange={(e) => handleExperienceQuantityChange(experience.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleExperienceQuantityChange(experience.id, selected!.quantity + 1)}
                              className="h-8 w-8 flex items-center justify-center rounded border hover:bg-muted"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-semibold ml-2 min-w-[60px] text-right">
                              {selected!.totalPrice.toFixed(2)} €
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedExperiences.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Experiencias:</span>
                  <span className="text-lg font-bold">{getTotalExperiences().toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {(selectedExtras.length > 0 || selectedUpgrades.length > 0 || selectedExperiences.length > 0) && (
        <>
          <Separator />
          <Card className="bg-primary/5 border-primary">
            <CardContent className="p-4">
              <div className="space-y-2">
                {selectedExtras.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal Extras:</span>
                    <span className="font-medium">{getTotalExtras().toFixed(2)} €</span>
                  </div>
                )}
                {selectedUpgrades.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal Upgrades:</span>
                    <span className="font-medium">{getTotalUpgrades().toFixed(2)} €</span>
                  </div>
                )}
                {selectedExperiences.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal Experiencias:</span>
                    <span className="font-medium">{getTotalExperiences().toFixed(2)} €</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">{getTotalAll().toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
