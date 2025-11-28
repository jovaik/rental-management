
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Fuel,
  Gauge,
  FileText,
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowLeft,
  ArrowRight,
  Wrench
} from 'lucide-react';
import Image from 'next/image';
import { SparePartsSelector } from './SparePartsSelector';

interface VehicleInspectionProps {
  bookingId: number;
  inspectionType: 'delivery' | 'return';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

interface PhotoPreview {
  file: File | null;
  preview: string | null;
}

interface SelectedSparePart {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Damage {
  description: string;
  severity: string;
  location: string;
  photo: File | null;
  photoPreview: string | null;
  estimatedCost: string;
  repairStatus: string;
  paymentStatus: string;
  responsibleParty: string;
  notes: string;
  spareParts: SelectedSparePart[];
}

interface Extra {
  extraType: string;
  description: string;
  quantity: number;
  size?: string;
  identifier?: string;
}

export function VehicleInspection({
  bookingId,
  inspectionType,
  open,
  onOpenChange,
  onCompleted
}: VehicleInspectionProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Fotos principales
  const [frontPhoto, setFrontPhoto] = useState<PhotoPreview>({ file: null, preview: null });
  const [leftPhoto, setLeftPhoto] = useState<PhotoPreview>({ file: null, preview: null });
  const [rearPhoto, setRearPhoto] = useState<PhotoPreview>({ file: null, preview: null });
  const [rightPhoto, setRightPhoto] = useState<PhotoPreview>({ file: null, preview: null });
  const [odometerPhoto, setOdometerPhoto] = useState<PhotoPreview>({ file: null, preview: null });

  // Datos del vehículo
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [generalCondition, setGeneralCondition] = useState('');
  const [notes, setNotes] = useState('');

  // Daños y extras
  const [damages, setDamages] = useState<Damage[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);

  // Vehículo y repuestos
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [sparePartsSelectorOpen, setSparePartsSelectorOpen] = useState(false);
  const [selectedDamageIndex, setSelectedDamageIndex] = useState<number | null>(null);
  
  // Múltiples vehículos - NUEVO: Soporta inspección simultánea de todos los vehículos
  const [allVehicles, setAllVehicles] = useState<Array<{ id: number; registration_number: string; make: string; model: string }>>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0); // Índice del vehículo actual
  const [vehicleInspections, setVehicleInspections] = useState<Map<number, any>>(new Map()); // Datos por vehículo
  
  // Cliente
  const [customerData, setCustomerData] = useState<any>(null);
  const [customerIncomplete, setCustomerIncomplete] = useState(false);

  // Referencias para inputs de archivo
  const frontInputRef = useRef<HTMLInputElement>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rearInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const odometerInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<PhotoPreview>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Mostrar preview inmediato usando Object URL (más rápido)
        const previewUrl = URL.createObjectURL(file);
        setter({ file, preview: previewUrl });

        // Comprimir imagen en segundo plano
        const compressedFile = await compressImage(file);
        
        // Actualizar con imagen comprimida
        const compressedPreview = URL.createObjectURL(compressedFile);
        setter({ file: compressedFile, preview: compressedPreview });
        
        // Liberar el preview anterior
        URL.revokeObjectURL(previewUrl);
        
        toast.success('Foto cargada y optimizada', { duration: 1500 });
      } catch (error) {
        console.error('Error procesando imagen:', error);
        toast.error('Error procesando la imagen');
      }
    }
  };

  const removePhoto = (setter: React.Dispatch<React.SetStateAction<PhotoPreview>>) => {
    setter((prev) => {
      // Liberar Object URL si existe
      if (prev.preview && prev.preview.startsWith('blob:')) {
        URL.revokeObjectURL(prev.preview);
      }
      return { file: null, preview: null };
    });
  };

  // Limpiar Object URLs cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      // Limpiar todas las previews cuando se cierra
      [frontPhoto, leftPhoto, rearPhoto, rightPhoto, odometerPhoto].forEach(photo => {
        if (photo.preview && photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    }
  }, [open]);

  const PhotoCard = ({
    title,
    photo,
    inputRef,
    onChange,
    onRemove,
    required = false,
    aspectRatio = "landscape"
  }: {
    title: string;
    photo: PhotoPreview;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    required?: boolean;
    aspectRatio?: "portrait" | "landscape" | "square";
  }) => {
    const handleClick = () => {
      inputRef.current?.click();
    };

    // Aspect ratio CSS según el tipo de foto
    // Portrait (3:4) para frontal/trasera de motos - MÁS VERTICAL
    // Landscape (4:3) para laterales - MÁS HORIZONTAL
    // Square (1:1) para odómetro
    const aspectRatioClass = 
      aspectRatio === "portrait" ? "aspect-[3/4]" :  // Vertical para frontal/trasera
      aspectRatio === "square" ? "aspect-square" :
      "aspect-[4/3]";  // Horizontal para laterales (por defecto)

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
        {/* Input para CÁMARA (con capture) */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onChange}
          className="hidden"
          id={`file-input-${title.replace(/\s+/g, '-')}`}
        />
        {/* Input para GALERÍA (sin capture) */}
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="hidden"
          id={`file-gallery-${title.replace(/\s+/g, '-')}`}
        />
        {photo.preview ? (
          <div className="relative">
            <div className={`relative w-full ${aspectRatioClass} mb-2`}>
              <Image
                src={photo.preview}
                alt={title}
                fill
                className="object-contain rounded"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Cambiar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className={`w-full ${aspectRatioClass} flex flex-col items-center justify-center min-h-[120px]`}>
            <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="font-medium text-gray-700 mb-3">
              {title}
              {required && <span className="text-red-500"> *</span>}
            </p>
            <div className="flex gap-2 w-full px-4">
              <label
                htmlFor={`file-input-${title.replace(/\s+/g, '-')}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded cursor-pointer text-center transition-colors"
              >
                📷 Cámara
              </label>
              <label
                htmlFor={`file-gallery-${title.replace(/\s+/g, '-')}`}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded cursor-pointer text-center transition-colors"
              >
                🖼️ Galería
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Cargar información del vehículo
  useEffect(() => {
    if (open && bookingId) {
      fetchBookingInfo();
      loadExistingInspections(); // ✅ NUEVO: Cargar inspecciones existentes
    }
  }, [open, bookingId]);

  const fetchBookingInfo = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const booking = await response.json();
        
        // Cargar todos los vehículos de la reserva desde el nuevo sistema
        const vehicles: Array<{ id: number; registration_number: string; make: string; model: string }> = [];
        
        // Solo cargar vehículos del nuevo sistema multivehículo
        if (booking.vehicles && Array.isArray(booking.vehicles)) {
          booking.vehicles.forEach((v: any) => {
            if (v.car) {
              vehicles.push({
                id: v.car.id,
                registration_number: v.car.registration_number,
                make: v.car.make || '',
                model: v.car.model || ''
              });
            }
          });
        }
        
        setAllVehicles(vehicles);
        
        // Seleccionar el primer vehículo por defecto
        if (vehicles.length > 0) {
          const firstVehicle = vehicles[0];
          setSelectedVehicleId(firstVehicle.id);
          const model = `${firstVehicle.make} ${firstVehicle.model}`.trim();
          setVehicleModel(model);
          console.log('Vehicle(s) loaded:', vehicles.length, 'vehicles');
        } else {
          console.warn('No vehicle data in booking:', booking);
        }
        
        // Verificar estado del cliente - SOLO en devolución
        if (inspectionType === 'return' && booking.customer) {
          setCustomerData(booking.customer);
          
          // Verificar si el cliente está incompleto
          if (booking.customer.status === 'incomplete') {
            setCustomerIncomplete(true);
            toast.error('⚠️ ATENCIÓN: Este cliente tiene datos incompletos. Debe completarlos antes de devolver el depósito.', {
              duration: 8000,
              style: {
                background: '#dc2626',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }
            });
          }
        }
      } else {
        console.error('Failed to fetch booking:', response.status);
      }
    } catch (error) {
      console.error('Error fetching booking info:', error);
    }
  };

  // ✅ NUEVO: Cargar inspecciones existentes y prellenar formularios
  const loadExistingInspections = async () => {
    try {
      const response = await fetch(`/api/inspections?bookingId=${bookingId}`);
      if (response.ok) {
        const allInspections = await response.json();
        
        // Filtrar por tipo de inspección actual
        const relevantInspections = allInspections.filter(
          (i: any) => i.inspection_type === inspectionType
        );
        
        console.log(`📸 Found ${relevantInspections.length} existing ${inspectionType} inspections`);
        
        // Agrupar por vehicle_id
        const inspectionsByVehicle = new Map<number, any>();
        relevantInspections.forEach((inspection: any) => {
          const vehicleId = inspection.vehicle_id;
          if (vehicleId) {
            inspectionsByVehicle.set(vehicleId, inspection);
          }
        });
        
        // Si hay inspecciones guardadas, prellenar el Map
        if (inspectionsByVehicle.size > 0) {
          const newVehicleInspections = new Map<number, any>();
          
          for (const [vehicleId, inspection] of inspectionsByVehicle.entries()) {
            // Convertir URLs firmadas a formato PhotoPreview
            const createPhotoPreview = (url: string | null): PhotoPreview => ({
              file: null, // No tenemos el File original
              preview: url
            });
            
            newVehicleInspections.set(vehicleId, {
              frontPhoto: createPhotoPreview(inspection.front_photo),
              leftPhoto: createPhotoPreview(inspection.left_photo),
              rearPhoto: createPhotoPreview(inspection.rear_photo),
              rightPhoto: createPhotoPreview(inspection.right_photo),
              odometerPhoto: createPhotoPreview(inspection.odometer_photo),
              odometerReading: inspection.odometer_reading?.toString() || '',
              fuelLevel: inspection.fuel_level || '',
              generalCondition: inspection.general_condition || '',
              notes: inspection.notes || '',
              damages: inspection.damages || [],
              extras: inspection.extras || []
            });
          }
          
          setVehicleInspections(newVehicleInspections);
          console.log(`✅ Loaded ${newVehicleInspections.size} vehicle inspections from database`);
          
          // Si estamos en el primer vehículo y tiene inspección, cargarla
          if (allVehicles.length > 0 && newVehicleInspections.has(allVehicles[0].id)) {
            loadVehicleState(allVehicles[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing inspections:', error);
    }
  };

  const addDamage = () => {
    setDamages([
      ...damages,
      {
        description: '',
        severity: 'minor',
        location: '',
        photo: null,
        photoPreview: null,
        estimatedCost: '',
        repairStatus: 'pending',
        paymentStatus: 'unpaid',
        responsibleParty: 'customer',
        notes: '',
        spareParts: []
      }
    ]);
  };

  const removeDamage = (index: number) => {
    setDamages(damages.filter((_, i) => i !== index));
  };

  const updateDamage = (index: number, field: string, value: any) => {
    const updated = [...damages];
    (updated[index] as any)[field] = value;
    setDamages(updated);
  };

  const openSparePartsSelector = (index: number) => {
    setSelectedDamageIndex(index);
    setSparePartsSelectorOpen(true);
  };

  const handleSparePartsConfirm = (parts: SelectedSparePart[]) => {
    if (selectedDamageIndex !== null) {
      const updated = [...damages];
      updated[selectedDamageIndex].spareParts = parts;
      // Calcular costo automáticamente si no hay uno manual
      const totalSpareParts = parts.reduce((sum, p) => sum + p.total, 0);
      if (!updated[selectedDamageIndex].estimatedCost) {
        updated[selectedDamageIndex].estimatedCost = totalSpareParts.toFixed(2);
      }
      setDamages(updated);
    }
  };

  const addExtra = () => {
    setExtras([
      ...extras,
      {
        extraType: 'helmet',
        description: '',
        quantity: 1
      }
    ]);
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const updateExtra = (index: number, field: string, value: any) => {
    const updated = [...extras];
    (updated[index] as any)[field] = value;
    setExtras(updated);
  };

  const handleSubmit = async () => {
    // VALIDACIÓN CRÍTICA: Verificar si el cliente está incompleto (solo en devolución)
    if (inspectionType === 'return' && customerIncomplete) {
      toast.error(
        '❌ NO PUEDE COMPLETAR LA DEVOLUCIÓN\n\n' +
        'Este cliente tiene datos incompletos. Debe completar:\n' +
        '- DNI/NIE/Pasaporte\n' +
        '- Dirección permanente\n' +
        '- Documentos (carnet + ID)\n\n' +
        'Vaya al menú CLIENTES para completar los datos antes de devolver el depósito.',
        {
          duration: 10000,
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '15px',
            maxWidth: '500px'
          }
        }
      );
      return;
    }

    // ✅ CRÍTICO: Si hay múltiples vehículos, guardar el estado del vehículo actual PRIMERO
    if (allVehicles.length > 1) {
      // ✅ GUARDAR ESTADO ACTUAL antes de validar
      saveCurrentVehicleState();
      
      // ✅ Esperar un momento para asegurar que el estado se guardó
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que TODOS los vehículos estén completos
      const incompleteVehicles = allVehicles.filter(v => !isVehicleComplete(v.id));
      
      if (incompleteVehicles.length > 0) {
        toast.error(
          `❌ Faltan inspecciones:\n\n${incompleteVehicles.map(v => `• ${v.registration_number} (${v.make} ${v.model})`).join('\n')}\n\nDebe completar la inspección de TODOS los vehículos.`,
          {
            duration: 8000,
            style: {
              background: '#dc2626',
              color: 'white',
              fontWeight: 'bold',
              maxWidth: '400px'
            }
          }
        );
        return;
      }
    } else {
      // Validación para vehículo único (comportamiento original)
      if (!frontPhoto.file || !leftPhoto.file || !rearPhoto.file || !rightPhoto.file || !odometerPhoto.file) {
        toast.error('Debe capturar todas las fotos obligatorias');
        return;
      }

      if (!odometerReading || !fuelLevel) {
        toast.error('Debe ingresar el kilometraje y nivel de combustible');
        return;
      }
    }

    try {
      setLoading(true);

      // ✅ NUEVO: Guardar inspecciones de TODOS los vehículos
      if (allVehicles.length > 1) {
        let successCount = 0;
        
        for (const vehicle of allVehicles) {
          const vehicleState = vehicleInspections.get(vehicle.id);
          if (!vehicleState) continue;

          const formData = new FormData();
          formData.append('bookingId', bookingId.toString());
          formData.append('inspectionType', inspectionType);
          formData.append('car_id', vehicle.id.toString()); // ✅ CRÍTICO: Asignar vehículo específico
          formData.append('odometerReading', vehicleState.odometerReading);
          formData.append('fuelLevel', vehicleState.fuelLevel);
          if (vehicleState.generalCondition) formData.append('generalCondition', vehicleState.generalCondition);
          if (vehicleState.notes) formData.append('notes', vehicleState.notes);

          // Añadir fotos
          if (vehicleState.frontPhoto.file) formData.append('frontPhoto', vehicleState.frontPhoto.file);
          if (vehicleState.leftPhoto.file) formData.append('leftPhoto', vehicleState.leftPhoto.file);
          if (vehicleState.rearPhoto.file) formData.append('rearPhoto', vehicleState.rearPhoto.file);
          if (vehicleState.rightPhoto.file) formData.append('rightPhoto', vehicleState.rightPhoto.file);
          if (vehicleState.odometerPhoto.file) formData.append('odometerPhoto', vehicleState.odometerPhoto.file);

          const response = await fetch('/api/inspections', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) throw new Error(`Error creando inspección para ${vehicle.registration_number}`);

          const inspection = await response.json();

          // Guardar daños de este vehículo
          for (const damage of vehicleState.damages) {
            if (damage.description) {
              const damageFormData = new FormData();
              damageFormData.append('description', damage.description);
              damageFormData.append('severity', damage.severity);
              if (damage.location) damageFormData.append('location', damage.location);
              if (damage.photo) damageFormData.append('photo', damage.photo);
              if (damage.estimatedCost) damageFormData.append('estimatedCost', damage.estimatedCost);
              if (damage.repairStatus) damageFormData.append('repairStatus', damage.repairStatus);
              if (damage.paymentStatus) damageFormData.append('paymentStatus', damage.paymentStatus);
              if (damage.responsibleParty) damageFormData.append('responsibleParty', damage.responsibleParty);
              if (damage.notes) damageFormData.append('notes', damage.notes);

              if (damage.spareParts.length > 0) {
                damageFormData.append('spareParts', JSON.stringify(
                  damage.spareParts.map((sp: SelectedSparePart) => ({
                    id: sp.id,
                    quantity: sp.quantity,
                    price: sp.price
                  }))
                ));
              }

              await fetch(`/api/inspections/${inspection.id}/damages`, {
                method: 'POST',
                body: damageFormData
              });
            }
          }

          // Guardar extras de este vehículo
          for (const extra of vehicleState.extras) {
            if (extra.description) {
              await fetch(`/api/inspections/${inspection.id}/extras`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extra)
              });
            }
          }

          successCount++;
        }

        toast.success(`✅ ${successCount} inspecciones guardadas exitosamente`);
      } else {
        // ✅ COMPORTAMIENTO ORIGINAL para vehículo único
        const formData = new FormData();
        formData.append('bookingId', bookingId.toString());
        formData.append('inspectionType', inspectionType);
        formData.append('odometerReading', odometerReading);
        formData.append('fuelLevel', fuelLevel);
        if (generalCondition) formData.append('generalCondition', generalCondition);
        if (notes) formData.append('notes', notes);
        
        if (selectedVehicleId) {
          formData.append('car_id', selectedVehicleId.toString());
        }

        // 🔍 DIAGNÓSTICO: Verificar qué fotos se van a enviar
        console.log('📸 [Frontend] Estado de fotos ANTES de enviar:');
        console.log('  - frontPhoto.file:', frontPhoto.file ? `✅ ${frontPhoto.file.name} (${frontPhoto.file.size} bytes)` : '❌ NULL');
        console.log('  - leftPhoto.file:', leftPhoto.file ? `✅ ${leftPhoto.file.name} (${leftPhoto.file.size} bytes)` : '❌ NULL');
        console.log('  - rearPhoto.file:', rearPhoto.file ? `✅ ${rearPhoto.file.name} (${rearPhoto.file.size} bytes)` : '❌ NULL');
        console.log('  - rightPhoto.file:', rightPhoto.file ? `✅ ${rightPhoto.file.name} (${rightPhoto.file.size} bytes)` : '❌ NULL');
        console.log('  - odometerPhoto.file:', odometerPhoto.file ? `✅ ${odometerPhoto.file.name} (${odometerPhoto.file.size} bytes)` : '❌ NULL');

        // ⚠️ VALIDACIÓN CRÍTICA: Verificar que NO sean solo previews sin archivos
        let photosAdded = 0;
        
        if (frontPhoto.file) {
          formData.append('frontPhoto', frontPhoto.file);
          photosAdded++;
          console.log('✅ frontPhoto agregado al FormData');
        } else if (frontPhoto.preview) {
          console.error('❌ ERROR: frontPhoto tiene preview pero NO tiene archivo File');
        }
        
        if (leftPhoto.file) {
          formData.append('leftPhoto', leftPhoto.file);
          photosAdded++;
          console.log('✅ leftPhoto agregado al FormData');
        } else if (leftPhoto.preview) {
          console.error('❌ ERROR: leftPhoto tiene preview pero NO tiene archivo File');
        }
        
        if (rearPhoto.file) {
          formData.append('rearPhoto', rearPhoto.file);
          photosAdded++;
          console.log('✅ rearPhoto agregado al FormData');
        } else if (rearPhoto.preview) {
          console.error('❌ ERROR: rearPhoto tiene preview pero NO tiene archivo File');
        }
        
        if (rightPhoto.file) {
          formData.append('rightPhoto', rightPhoto.file);
          photosAdded++;
          console.log('✅ rightPhoto agregado al FormData');
        } else if (rightPhoto.preview) {
          console.error('❌ ERROR: rightPhoto tiene preview pero NO tiene archivo File');
        }
        
        if (odometerPhoto.file) {
          formData.append('odometerPhoto', odometerPhoto.file);
          photosAdded++;
          console.log('✅ odometerPhoto agregado al FormData');
        } else if (odometerPhoto.preview) {
          console.error('❌ ERROR: odometerPhoto tiene preview pero NO tiene archivo File');
        }
        
        console.log(`📊 [Frontend] Total de fotos agregadas al FormData: ${photosAdded}/5`);
        
        if (photosAdded === 0) {
          console.error('❌ ERROR CRÍTICO: NO se agregaron fotos al FormData');
          toast.error('Error: No se detectaron las fotos. Por favor, intente capturarlas nuevamente.');
          setLoading(false);
          return;
        }

        console.log('🚀 [Frontend] Enviando FormData a /api/inspections...');
        const response = await fetch('/api/inspections', {
          method: 'POST',
          body: formData
        });
        console.log(`📥 [Frontend] Respuesta recibida: ${response.status} ${response.statusText}`);

        if (!response.ok) throw new Error('Error creando inspección');

        const inspection = await response.json();

        // Guardar daños
        for (const damage of damages) {
          if (damage.description) {
            const damageFormData = new FormData();
            damageFormData.append('description', damage.description);
            damageFormData.append('severity', damage.severity);
            if (damage.location) damageFormData.append('location', damage.location);
            if (damage.photo) damageFormData.append('photo', damage.photo);
            if (damage.estimatedCost) damageFormData.append('estimatedCost', damage.estimatedCost);
            if (damage.repairStatus) damageFormData.append('repairStatus', damage.repairStatus);
            if (damage.paymentStatus) damageFormData.append('paymentStatus', damage.paymentStatus);
            if (damage.responsibleParty) damageFormData.append('responsibleParty', damage.responsibleParty);
            if (damage.notes) damageFormData.append('notes', damage.notes);

            if (damage.spareParts.length > 0) {
              damageFormData.append('spareParts', JSON.stringify(
                damage.spareParts.map((sp: SelectedSparePart) => ({
                  id: sp.id,
                  quantity: sp.quantity,
                  price: sp.price
                }))
              ));
            }

            await fetch(`/api/inspections/${inspection.id}/damages`, {
              method: 'POST',
              body: damageFormData
            });
          }
        }

        // Guardar extras
        for (const extra of extras) {
          if (extra.description) {
            await fetch(`/api/inspections/${inspection.id}/extras`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(extra)
            });
          }
        }

        toast.success('Inspección guardada exitosamente');
      }

      onCompleted?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error guardando inspección');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFrontPhoto({ file: null, preview: null });
    setLeftPhoto({ file: null, preview: null });
    setRearPhoto({ file: null, preview: null });
    setRightPhoto({ file: null, preview: null });
    setOdometerPhoto({ file: null, preview: null });
    setOdometerReading('');
    setFuelLevel('');
    setGeneralCondition('');
    setNotes('');
    setDamages([]);
    setExtras([]);
    setVehicleModel('');
    setVehicleInspections(new Map());
    setCurrentVehicleIndex(0);
  };

  // ✅ NUEVO: Guardar el estado actual del vehículo antes de cambiar
  const saveCurrentVehicleState = () => {
    if (!selectedVehicleId) return;
    
    const currentState = {
      frontPhoto,
      leftPhoto,
      rearPhoto,
      rightPhoto,
      odometerPhoto,
      odometerReading,
      fuelLevel,
      generalCondition,
      notes,
      damages,
      extras
    };
    
    setVehicleInspections(prev => new Map(prev).set(selectedVehicleId, currentState));
  };

  // ✅ NUEVO: Cargar el estado guardado de un vehículo
  const loadVehicleState = (vehicleId: number) => {
    const savedState = vehicleInspections.get(vehicleId);
    
    if (savedState) {
      setFrontPhoto(savedState.frontPhoto);
      setLeftPhoto(savedState.leftPhoto);
      setRearPhoto(savedState.rearPhoto);
      setRightPhoto(savedState.rightPhoto);
      setOdometerPhoto(savedState.odometerPhoto);
      setOdometerReading(savedState.odometerReading);
      setFuelLevel(savedState.fuelLevel);
      setGeneralCondition(savedState.generalCondition);
      setNotes(savedState.notes);
      setDamages(savedState.damages);
      setExtras(savedState.extras);
    } else {
      // Limpiar formulario para nuevo vehículo
      setFrontPhoto({ file: null, preview: null });
      setLeftPhoto({ file: null, preview: null });
      setRearPhoto({ file: null, preview: null });
      setRightPhoto({ file: null, preview: null });
      setOdometerPhoto({ file: null, preview: null });
      setOdometerReading('');
      setFuelLevel('');
      setGeneralCondition('');
      setNotes('');
      setDamages([]);
      setExtras([]);
    }
  };

  // ✅ NUEVO: Navegar al siguiente vehículo
  const goToNextVehicle = () => {
    if (currentVehicleIndex < allVehicles.length - 1) {
      saveCurrentVehicleState();
      const nextIndex = currentVehicleIndex + 1;
      const nextVehicle = allVehicles[nextIndex];
      
      setCurrentVehicleIndex(nextIndex);
      setSelectedVehicleId(nextVehicle.id);
      setVehicleModel(`${nextVehicle.make} ${nextVehicle.model}`.trim());
      loadVehicleState(nextVehicle.id);
      setStep(1); // Volver al paso 1 para el nuevo vehículo
    }
  };

  // ✅ NUEVO: Navegar al vehículo anterior
  const goToPreviousVehicle = () => {
    if (currentVehicleIndex > 0) {
      saveCurrentVehicleState();
      const prevIndex = currentVehicleIndex - 1;
      const prevVehicle = allVehicles[prevIndex];
      
      setCurrentVehicleIndex(prevIndex);
      setSelectedVehicleId(prevVehicle.id);
      setVehicleModel(`${prevVehicle.make} ${prevVehicle.model}`.trim());
      loadVehicleState(prevVehicle.id);
      setStep(1);
    }
  };

  // ✅ NUEVO: Verificar si un vehículo tiene datos completos
  const isVehicleComplete = (vehicleId: number): boolean => {
    const state = vehicleInspections.get(vehicleId);
    if (!state) return false;
    
    return !!(
      state.frontPhoto.file &&
      state.leftPhoto.file &&
      state.rearPhoto.file &&
      state.rightPhoto.file &&
      state.odometerPhoto.file &&
      state.odometerReading &&
      state.fuelLevel
    );
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && !loading) {
      // Solo preguntar si hay datos en el formulario
      const hasData = frontPhoto.preview || leftPhoto.preview || rearPhoto.preview || 
                     rightPhoto.preview || odometerPhoto.preview || odometerReading || 
                     fuelLevel || damages.length > 0 || extras.length > 0;
      
      if (hasData) {
        const confirmClose = window.confirm(
          '¿Estás seguro de que quieres cerrar? Se perderán todos los datos no guardados.'
        );
        if (!confirmClose) {
          return;
        }
        resetForm();
      }
      onOpenChange(false);
    } else {
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-2xl">
            {inspectionType === 'delivery' ? '🚗 Entrega del Vehículo' : '🔄 Recepción del Vehículo'}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {inspectionType === 'delivery'
              ? 'Documente el estado del vehículo antes de la entrega al cliente'
              : 'Verifique el estado del vehículo al finalizar el alquiler'}
          </p>
        </DialogHeader>

        {/* ✅ NUEVO: Navegación entre vehículos - Mostrar solo si hay múltiples vehículos */}
        {allVehicles.length > 1 && (
          <div className="mx-4 sm:mx-6 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {currentVehicleIndex + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-900">
                    Vehículo {currentVehicleIndex + 1} de {allVehicles.length}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {allVehicles[currentVehicleIndex]?.registration_number || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {allVehicles[currentVehicleIndex]?.make} {allVehicles[currentVehicleIndex]?.model}
                  </div>
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousVehicle}
                  disabled={currentVehicleIndex === 0}
                  className="bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToNextVehicle}
                  disabled={currentVehicleIndex === allVehicles.length - 1}
                  className="bg-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Indicadores de progreso de inspección */}
            <div className="flex gap-2 flex-wrap">
              {allVehicles.map((vehicle, index) => {
                const isComplete = isVehicleComplete(vehicle.id);
                const isCurrent = index === currentVehicleIndex;
                
                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => {
                      saveCurrentVehicleState();
                      setCurrentVehicleIndex(index);
                      setSelectedVehicleId(vehicle.id);
                      setVehicleModel(`${vehicle.make} ${vehicle.model}`.trim());
                      loadVehicleState(vehicle.id);
                      setStep(1);
                    }}
                    className={`
                      px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                      ${isCurrent ? 'bg-blue-600 text-white shadow-md' : 
                        isComplete ? 'bg-green-500 text-white' : 
                        'bg-white text-gray-600 border border-gray-300'}
                    `}
                  >
                    {isComplete && <CheckCircle className="h-3 w-3 inline mr-1" />}
                    {vehicle.registration_number}
                  </button>
                );
              })}
            </div>

            {/* Mensaje de ayuda */}
            <div className="mt-3 text-xs text-blue-700 bg-white/50 rounded px-3 py-2">
              <strong>💡 Consejo:</strong> Complete la inspección de cada vehículo. Los botones se pondrán verdes ✓ cuando estén listos.
            </div>
          </div>
        )}

        {/* Alerta de cliente incompleto - SOLO en devolución */}
        {inspectionType === 'return' && customerIncomplete && customerData && (
          <div className="mx-4 sm:mx-6 mt-4 bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800 mb-2">
                  ⚠️ CLIENTE CON DATOS INCOMPLETOS
                </h3>
                <p className="text-sm text-red-700 mb-2">
                  <strong>{customerData.first_name} {customerData.last_name}</strong> fue creado desde una reserva rápida. 
                  NO puede completar la devolución ni devolver el depósito hasta completar:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1 ml-2">
                  {!customerData.dni_nie && <li><strong>DNI/NIE/Pasaporte</strong></li>}
                  {!customerData.street_address && <li><strong>Dirección permanente completa</strong></li>}
                  {!customerData.driver_license_front && <li><strong>Carnet de conducir (ambas caras)</strong></li>}
                  {!customerData.id_document_front && <li><strong>Documento de identidad (ambas caras)</strong></li>}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => window.open('/customers', '_blank')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Ir a completar datos del cliente →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[calc(90vh-200px)] px-4 sm:px-6">
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6 pb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Fotos del Vehículo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Frontal - VERTICAL (portrait 3:4) - 1 columna */}
                  <PhotoCard
                    title="Vista Frontal"
                    photo={frontPhoto}
                    inputRef={frontInputRef}
                    onChange={(e) => handlePhotoUpload(e, setFrontPhoto)}
                    onRemove={() => removePhoto(setFrontPhoto)}
                    aspectRatio="portrait"
                    required
                  />
                  
                  {/* Laterales - HORIZONTAL (landscape 4:3) - 1 columna cada uno */}
                  <PhotoCard
                    title="Lateral Izquierdo"
                    photo={leftPhoto}
                    inputRef={leftInputRef}
                    onChange={(e) => handlePhotoUpload(e, setLeftPhoto)}
                    onRemove={() => removePhoto(setLeftPhoto)}
                    aspectRatio="landscape"
                    required
                  />
                  <PhotoCard
                    title="Lateral Derecho"
                    photo={rightPhoto}
                    inputRef={rightInputRef}
                    onChange={(e) => handlePhotoUpload(e, setRightPhoto)}
                    onRemove={() => removePhoto(setRightPhoto)}
                    aspectRatio="landscape"
                    required
                  />
                  
                  {/* Trasera - VERTICAL (portrait 3:4) - 1 columna */}
                  <PhotoCard
                    title="Vista Trasera"
                    photo={rearPhoto}
                    inputRef={rearInputRef}
                    onChange={(e) => handlePhotoUpload(e, setRearPhoto)}
                    onRemove={() => removePhoto(setRearPhoto)}
                    aspectRatio="portrait"
                    required
                  />
                  
                  {/* Cuentakilómetros - CUADRADO (square 1:1) - 2 columnas en móvil, 1 en desktop */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <PhotoCard
                      title="Cuentakilómetros"
                      photo={odometerPhoto}
                      inputRef={odometerInputRef}
                      onChange={(e) => handlePhotoUpload(e, setOdometerPhoto)}
                      onRemove={() => removePhoto(setOdometerPhoto)}
                      aspectRatio="square"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="odometer" className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4" />
                    Kilometraje *
                  </Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    placeholder="Ej: 45000"
                    className="text-sm h-9"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fuel" className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4" />
                    Nivel de Combustible *
                  </Label>
                  <Select value={fuelLevel} onValueChange={setFuelLevel}>
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="Seleccione nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">Vacío</SelectItem>
                      <SelectItem value="quarter">1/4</SelectItem>
                      <SelectItem value="half">1/2</SelectItem>
                      <SelectItem value="three_quarters">3/4</SelectItem>
                      <SelectItem value="full">Lleno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="condition" className="text-sm">Estado General</Label>
                <Textarea
                  id="condition"
                  value={generalCondition}
                  onChange={(e) => setGeneralCondition(e.target.value)}
                  placeholder="Describa el estado general del vehículo..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cualquier observación adicional..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6 pb-6">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    Daños Existentes
                  </h3>
                  <Button type="button" onClick={addDamage} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Añadir Daño
                  </Button>
                </div>

                {damages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-gray-600">No hay daños registrados</p>
                    <p className="text-sm text-gray-500">El vehículo está en perfecto estado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {damages.map((damage, index) => (
                      <div key={index} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline" className="text-xs sm:text-sm">Daño #{index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDamage(index)}
                            className="text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <Label className="text-sm">Descripción *</Label>
                            <Textarea
                              value={damage.description}
                              onChange={(e) => updateDamage(index, 'description', e.target.value)}
                              placeholder="Describa el daño..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Severidad</Label>
                            <Select
                              value={damage.severity}
                              onValueChange={(value) => updateDamage(index, 'severity', value)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minor">Leve</SelectItem>
                                <SelectItem value="moderate">Moderado</SelectItem>
                                <SelectItem value="severe">Severo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Ubicación</Label>
                            <Select
                              value={damage.location}
                              onValueChange={(value) => updateDamage(index, 'location', value)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue placeholder="Seleccione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="front">Frontal</SelectItem>
                                <SelectItem value="rear">Trasera</SelectItem>
                                <SelectItem value="left">Lateral Izq.</SelectItem>
                                <SelectItem value="right">Lateral Der.</SelectItem>
                                <SelectItem value="roof">Techo</SelectItem>
                                <SelectItem value="interior">Interior</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="sm:col-span-2 mt-3">
                            <Label className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                              💰 Tasación del Daño
                            </Label>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Coste Estimado (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={damage.estimatedCost}
                              onChange={(e) => updateDamage(index, 'estimatedCost', e.target.value)}
                              placeholder="Ej: 150.00"
                              className="text-sm h-9"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Estado Reparación</Label>
                            <Select
                              value={damage.repairStatus}
                              onValueChange={(value) => updateDamage(index, 'repairStatus', value)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="in_progress">En Proceso</SelectItem>
                                <SelectItem value="completed">Completado</SelectItem>
                                <SelectItem value="waived">Exonerado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Estado de Pago</Label>
                            <Select
                              value={damage.paymentStatus}
                              onValueChange={(value) => updateDamage(index, 'paymentStatus', value)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unpaid">No Pagado</SelectItem>
                                <SelectItem value="paid">Pagado</SelectItem>
                                <SelectItem value="disputed">En Disputa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Responsable del Pago</Label>
                            <Select
                              value={damage.responsibleParty}
                              onValueChange={(value) => updateDamage(index, 'responsibleParty', value)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Cliente</SelectItem>
                                <SelectItem value="company">Empresa</SelectItem>
                                <SelectItem value="insurance">Seguro</SelectItem>
                                <SelectItem value="shared">Compartido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="sm:col-span-2">
                            <Label className="text-sm font-semibold text-green-700 flex items-center gap-1">
                              <Wrench className="h-4 w-4" />
                              Repuestos Utilizados
                            </Label>
                            {!vehicleModel ? (
                              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                ⚠️ Cargando información del vehículo...
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openSparePartsSelector(index)}
                                className="w-full mt-2"
                              >
                                <Wrench className="h-4 w-4 mr-2" />
                                {damage.spareParts.length === 0 
                                  ? `Seleccionar Repuestos del Catálogo (${vehicleModel})` 
                                  : `${damage.spareParts.length} repuesto(s) seleccionado(s)`
                                }
                              </Button>
                            )}
                            {damage.spareParts.length > 0 && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <div className="space-y-1 text-xs">
                                  {damage.spareParts.map((part, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{part.name} x{part.quantity}</span>
                                      <span className="font-semibold">€{part.total.toFixed(2)}</span>
                                    </div>
                                  ))}
                                  <div className="pt-1 border-t border-green-300 flex justify-between font-semibold text-green-700">
                                    <span>Total Repuestos:</span>
                                    <span>€{damage.spareParts.reduce((sum, p) => sum + p.total, 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="sm:col-span-2">
                            <Label className="text-sm">Notas de Tasación</Label>
                            <Textarea
                              value={damage.notes}
                              onChange={(e) => updateDamage(index, 'notes', e.target.value)}
                              placeholder="Notas adicionales sobre la tasación..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <Label className="text-sm">Foto del Daño</Label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    // Preview inmediato
                                    const previewUrl = URL.createObjectURL(file);
                                    updateDamage(index, 'photoPreview', previewUrl);
                                    
                                    // Comprimir en segundo plano
                                    const compressedFile = await compressImage(file);
                                    updateDamage(index, 'photo', compressedFile);
                                    
                                    // Actualizar preview con imagen comprimida
                                    const compressedPreview = URL.createObjectURL(compressedFile);
                                    updateDamage(index, 'photoPreview', compressedPreview);
                                    
                                    // Liberar preview anterior
                                    URL.revokeObjectURL(previewUrl);
                                  } catch (error) {
                                    console.error('Error procesando imagen de daño:', error);
                                    toast.error('Error procesando la imagen');
                                  }
                                }
                              }}
                              className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {damage.photoPreview && (
                              <div className="relative w-full h-32 sm:w-40 sm:h-40 mt-2">
                                <Image
                                  src={damage.photoPreview}
                                  alt={`Daño ${index + 1}`}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 sm:space-y-6 pb-6">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Extras del Vehículo
                  </h3>
                  <Button type="button" onClick={addExtra} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Añadir Extra
                  </Button>
                </div>

                {extras.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">No hay extras registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extras.map((extra, index) => (
                      <div key={index} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline" className="text-xs sm:text-sm">Extra #{index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExtra(index)}
                            className="text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-sm">Tipo de Extra *</Label>
                            <Select
                              value={extra.extraType}
                              onValueChange={(value) => updateExtra(index, 'extraType', value)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="helmet">Casco</SelectItem>
                                <SelectItem value="phone_mount">Soporte Móvil</SelectItem>
                                <SelectItem value="gps">GPS</SelectItem>
                                <SelectItem value="child_seat">Silla Infantil</SelectItem>
                                <SelectItem value="chain">Cadenas</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              value={extra.quantity}
                              onChange={(e) => updateExtra(index, 'quantity', parseInt(e.target.value))}
                              className="text-sm h-9"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Talla/Tamaño</Label>
                            <Input
                              value={extra.size || ''}
                              onChange={(e) => updateExtra(index, 'size', e.target.value)}
                              placeholder="Ej: L, XL"
                              className="text-sm h-9"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Identificador</Label>
                            <Input
                              value={extra.identifier || ''}
                              onChange={(e) => updateExtra(index, 'identifier', e.target.value)}
                              placeholder="Ej: Casco #5"
                              className="text-sm h-9"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <Label className="text-sm">Descripción *</Label>
                            <Input
                              value={extra.description}
                              onChange={(e) => updateExtra(index, 'description', e.target.value)}
                              placeholder="Describa el extra..."
                              className="text-sm h-9"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
            
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    step === 1 &&
                    (!frontPhoto.file ||
                      !leftPhoto.file ||
                      !rearPhoto.file ||
                      !rightPhoto.file ||
                      !odometerPhoto.file ||
                      !odometerReading ||
                      !fuelLevel)
                  }
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <>
                  {/* ✅ NUEVO: Si hay múltiples vehículos y NO es el último, mostrar "Completar y Siguiente" */}
                  {allVehicles.length > 1 && currentVehicleIndex < allVehicles.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        // Guardar estado actual y marcar como completo
                        saveCurrentVehicleState();
                        toast.success(`✅ Vehículo ${allVehicles[currentVehicleIndex].registration_number} completado`);
                        // Saltar al siguiente vehículo
                        goToNextVehicle();
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={
                        !frontPhoto.file ||
                        !leftPhoto.file ||
                        !rearPhoto.file ||
                        !rightPhoto.file ||
                        !odometerPhoto.file ||
                        !odometerReading ||
                        !fuelLevel
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completar y Siguiente Vehículo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    /* Botón de guardado final (vehículo único o último vehículo) */
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          {allVehicles.length > 1 ? 'Guardando todas las inspecciones...' : 'Guardando...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {allVehicles.length > 1 ? `Finalizar y Guardar Todo (${allVehicles.length} vehículos)` : 'Guardar Inspección'}
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Selector de Repuestos */}
      {vehicleModel && selectedDamageIndex !== null && (
        <SparePartsSelector
          vehicleModel={vehicleModel}
          open={sparePartsSelectorOpen}
          onOpenChange={setSparePartsSelectorOpen}
          onConfirm={handleSparePartsConfirm}
          initialSelected={damages[selectedDamageIndex]?.spareParts || []}
        />
      )}
    </Dialog>
  );
}
