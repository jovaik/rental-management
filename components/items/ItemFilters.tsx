'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ItemType, ItemStatus } from '@prisma/client';
import { Search } from 'lucide-react';

interface ItemFiltersProps {
  filters: {
    search: string;
    type: ItemType | 'ALL';
    status: ItemStatus | 'ALL';
  };
  onFilterChange: (filters: {
    search: string;
    type: ItemType | 'ALL';
    status: ItemStatus | 'ALL';
  }) => void;
}

const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'VEHICLE', label: 'Vehículos' },
  { value: 'PROPERTY', label: 'Propiedades' },
  { value: 'BOAT', label: 'Embarcaciones' },
  { value: 'EXPERIENCE', label: 'Experiencias' },
];

const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'RENTED', label: 'Alquilado' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'OUT_OF_SERVICE', label: 'Fuera de servicio' },
];

export function ItemFilters({ filters, onFilterChange }: ItemFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Buscar por nombre..."
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="pl-10"
          />
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select
          value={filters.type}
          onValueChange={(value) =>
            onFilterChange({ ...filters, type: value as ItemType | 'ALL' })
          }
        >
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              status: value as ItemStatus | 'ALL',
            })
          }
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
