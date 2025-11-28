
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Building2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: number;
  name: string;
  partsCount: number;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export default function SuppliersPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Error al obtener proveedores');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setIsNewSupplier(true);
    setSelectedSupplier(null);
    setNewSupplierName('');
    setIsEditDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setIsNewSupplier(false);
    setSelectedSupplier(supplier);
    setNewSupplierName(supplier.name);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!newSupplierName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del proveedor es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: isNewSupplier ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSupplier?.id,
          newName: newSupplierName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast({
        title: 'Éxito',
        description: isNewSupplier 
          ? 'Proveedor creado exitosamente. Ahora puedes asignarlo a repuestos.'
          : `Proveedor actualizado exitosamente.`,
      });

      setIsEditDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el proveedor',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await fetch('/api/suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSupplier.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      const result = await response.json();

      toast({
        title: 'Éxito',
        description: `Proveedor eliminado. ${result.partsCount} repuestos quedan sin proveedor asignado.`,
      });

      setIsDeleteDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el proveedor',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Proveedores de Repuestos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los proveedores y asígnalos a repuestos en el catálogo
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Proveedores registrados y cantidad de repuestos asignados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando proveedores...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No hay proveedores registrados
              </p>
              <Button onClick={handleNew} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Proveedor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Repuestos Asignados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {supplier.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.partsCount} repuesto{supplier.partsCount !== 1 ? 's' : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(supplier)}
                            title="Editar proveedor"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(supplier)}
                            title="Eliminar proveedor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar proveedor */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNewSupplier ? 'Nuevo Proveedor' : 'Editar Proveedor'}
            </DialogTitle>
            <DialogDescription>
              {isNewSupplier
                ? 'Crea un nuevo proveedor para asignar a repuestos'
                : `Renombrar proveedor. Los ${selectedSupplier?.partsCount || 0} repuestos asignados se actualizarán automáticamente.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">
                Nombre del Proveedor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="supplier-name"
                placeholder="Ej: HNOS NAVARRO"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveSupplier();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSupplier}>
              {isNewSupplier ? 'Crear' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el proveedor <strong>{selectedSupplier?.name}</strong>.
              {selectedSupplier && selectedSupplier.partsCount > 0 ? (
                <>
                  <br /><br />
                  Los <strong>{selectedSupplier.partsCount} repuestos</strong> asignados a este proveedor 
                  quedarán sin proveedor (se puede asignar otro después).
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
