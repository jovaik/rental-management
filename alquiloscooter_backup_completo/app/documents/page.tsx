
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Download, Search, Filter, Eye, Trash2, Plus, Car, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Document {
  id: number;
  name: string;
  type: string;
  category: string;
  upload_date: Date;
  file_size: string;
  vehicle?: {
    registration_number: string;
    make: string;
    model: string;
  };
  description?: string;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Cargar documentos del localStorage si existen
    const savedDocuments = localStorage.getItem('documents');
    if (savedDocuments) {
      const parsed = JSON.parse(savedDocuments);
      const withDates = parsed.map((d: any) => ({
        ...d,
        upload_date: new Date(d.upload_date)
      }));
      setDocuments(withDates);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      loadDocuments();
    }
  }, [mounted]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleUploadClick = () => {
    // Crear modal de subida simulado
    const fileName = prompt('Nombre del documento (ej: Seguro_Toyota_2024.pdf):');
    if (!fileName) return;
    
    const category = prompt('Categoría (Seguros/ITV/Manuales/Contratos):') || 'Otros';
    const vehicleId = prompt('ID del vehículo (opcional, 1-5):');
    
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const vehicle = vehicleId ? vehicles.find((v: any) => v.id == vehicleId) : null;
    
    const newDocument: Document = {
      id: Date.now(),
      name: fileName,
      type: fileName.split('.').pop()?.toUpperCase() || 'PDF',
      category: category,
      upload_date: new Date(),
      file_size: `${Math.floor(Math.random() * 500) + 100} KB`,
      vehicle: vehicle ? {
        registration_number: vehicle.registration_number,
        make: vehicle.make,
        model: vehicle.model
      } : undefined,
      description: 'Documento subido por el usuario'
    };
    
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    localStorage.setItem('documents', JSON.stringify(updatedDocuments));
  };

  const handleViewClick = (documentId: number) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      alert(`Visualizando documento: ${doc.name}\n\nTipo: ${doc.type}\nCategoría: ${doc.category}\nFecha: ${formatDate(doc.upload_date)}\nTamaño: ${doc.file_size}\n\nEn una implementación real, aquí se abriría el visor de documentos.`);
    }
  };

  const handleDownloadClick = (documentId: number) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      // Simular descarga
      const content = `Documento: ${doc.name}\nCategoría: ${doc.category}\nFecha de subida: ${formatDate(doc.upload_date)}\n\n[En una implementación real, aquí estaría el contenido del archivo]`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name.replace(/\.[^/.]+$/, '') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteClick = (documentId: number) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc && confirm(`¿Está seguro de que desea eliminar "${doc.name}"?`)) {
      const updatedDocuments = documents.filter(d => d.id !== documentId);
      setDocuments(updatedDocuments);
      localStorage.setItem('documents', JSON.stringify(updatedDocuments));
    }
  };

  const loadDocuments = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      
      // Simular delay de API para testing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar si hay documentos guardados
      const savedDocuments = localStorage.getItem('documents');
      if (savedDocuments) {
        const parsed = JSON.parse(savedDocuments);
        const withDates = parsed.map((d: any) => ({
          ...d,
          upload_date: new Date(d.upload_date)
        }));
        setDocuments(withDates);
      } else {
        // No hay documentos, inicializar vacío
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'seguros': return 'bg-blue-100 text-blue-800';
      case 'itv': return 'bg-green-100 text-green-800';
      case 'manuales': return 'bg-orange-100 text-orange-800';
      case 'contratos': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // No renderizar hasta que esté montado para evitar errores de hidración
  if (!mounted || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h1>
          <p className="text-gray-600 mt-1">
            Administra seguros, ITV, manuales y contratos de vehículos
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleUploadClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          Subir Documento
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, categoría o matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="Seguros">Seguros</SelectItem>
                <SelectItem value="ITV">ITV</SelectItem>
                <SelectItem value="Manuales">Manuales</SelectItem>
                <SelectItem value="Contratos">Contratos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron documentos
              </h3>
              <p className="text-gray-500">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Sube tu primer documento para comenzar'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      <Badge className={getCategoryColor(doc.category)} variant="secondary">
                        {doc.category}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Tipo:</span> {doc.type}
                      </div>
                      <div>
                        <span className="font-medium">Tamaño:</span> {doc.file_size}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {formatDate(doc.upload_date)}
                      </div>
                    </div>

                    {doc.vehicle && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Car className="h-4 w-4" />
                        <span>
                          {doc.vehicle.registration_number} - {doc.vehicle.make} {doc.vehicle.model}
                        </span>
                      </div>
                    )}

                    {doc.description && (
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewClick(doc.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadClick(doc.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteClick(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {documents.filter(d => d.category === 'Seguros').length}
              </div>
              <div className="text-sm text-gray-600">Seguros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.category === 'ITV').length}
              </div>
              <div className="text-sm text-gray-600">ITV</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {documents.filter(d => d.category === 'Manuales').length}
              </div>
              <div className="text-sm text-gray-600">Manuales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {documents.filter(d => d.category === 'Contratos').length}
              </div>
              <div className="text-sm text-gray-600">Contratos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
