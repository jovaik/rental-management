
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle, Upload, Trash2, Star, StarOff, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface VehicleModelPhotosManagerProps {
  make: string;
  model: string;
}

interface ModelPhoto {
  id: number;
  make: string;
  model: string;
  photo_url: string;
  photo_order: number;
  is_primary: boolean;
  created_at: string;
}

export function VehicleModelPhotosManager({ make, model }: VehicleModelPhotosManagerProps) {
  const [photos, setPhotos] = useState<ModelPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar fotos del modelo
  useEffect(() => {
    if (make && model) {
      loadPhotos();
    }
  }, [make, model]);

  const loadPhotos = async () => {
    if (!make || !model) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vehicles/model-photos?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      } else {
        console.error('Error cargando fotos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando fotos del modelo');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('make', make);
        formData.append('model', model);
        formData.append('is_primary', photos.length === 0 ? 'true' : 'false');

        const response = await fetch('/api/vehicles/model-photos', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Error subiendo foto');
        }
      }

      toast.success(`${files.length} foto(s) subida(s) correctamente`);
      await loadPhotos();
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      toast.error('Error subiendo fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('¿Eliminar esta foto? Se aplicará a TODAS las unidades de este modelo.')) {
      return;
    }

    try {
      const response = await fetch(`/api/vehicles/model-photos?id=${photoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Foto eliminada');
        await loadPhotos();
      } else {
        throw new Error('Error eliminando foto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error eliminando foto');
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    try {
      const response = await fetch('/api/vehicles/model-photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photoId, is_primary: true })
      });

      if (response.ok) {
        toast.success('Foto principal actualizada');
        await loadPhotos();
      } else {
        throw new Error('Error actualizando foto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error actualizando foto');
    }
  };

  if (!make || !model) {
    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <p className="text-sm text-yellow-800">
          Primero selecciona la marca y modelo del vehículo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          📸 Catálogo de Fotos por Modelo
        </h3>
        <p className="text-sm text-blue-800">
          Las fotos se aplican a <strong>TODAS las unidades</strong> de: <strong>{make} {model}</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Las fotos subidas aquí aparecerán automáticamente en todos los vehículos de este modelo
        </p>
      </div>

      {/* Botón de subir */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Subiendo...' : 'Subir Fotos del Modelo'}
        </Button>
      </div>

      {/* Grid de fotos */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Cargando fotos...
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-500 mb-1">No hay fotos para este modelo</p>
          <p className="text-sm text-gray-400">Sube fotos para que aparezcan en todas las unidades</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="relative group">
              <div className="aspect-video relative bg-gray-100">
                <Image
                  src={photo.photo_url}
                  alt={`${make} ${model}`}
                  fill
                  className="object-cover rounded-t-lg"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                
                {/* Badge de foto principal */}
                {photo.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Principal
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="p-2 flex items-center justify-between gap-2">
                {!photo.is_primary ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetPrimary(photo.id)}
                    className="flex-1"
                  >
                    <StarOff className="w-3 h-3 mr-1" />
                    Principal
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}
                
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Información adicional */}
      {photos.length > 0 && (
        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border">
          <p>💡 <strong>Tip:</strong> La foto marcada como "Principal" será la primera que se muestre en los widgets de reserva.</p>
        </div>
      )}
    </div>
  );
}
