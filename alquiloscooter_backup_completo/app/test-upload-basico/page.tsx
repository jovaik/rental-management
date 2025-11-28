
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function TestUploadBasico() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      console.log('📄 Archivo seleccionado:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Selecciona un archivo primero');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      console.log('📤 Subiendo archivo:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('🌐 Enviando petición a /api/gastos/test-upload-simple...');
      
      const response = await fetch('/api/gastos/test-upload-simple', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Respuesta recibida:', response.status, response.statusText);

      const data = await response.json();
      console.log('📊 Datos:', data);

      setResult(data);

    } catch (error: any) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        error: error.message || 'Error desconocido'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test de Subida Básico</CardTitle>
          <CardDescription>
            Prueba de subida de archivos SIN OCR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input de archivo */}
          <div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100"
            />
          </div>

          {/* Info del archivo seleccionado */}
          {file && (
            <div className="p-3 bg-blue-50 rounded-md text-sm">
              <p><strong>Archivo:</strong> {file.name}</p>
              <p><strong>Tamaño:</strong> {Math.round(file.size / 1024)} KB</p>
              <p><strong>Tipo:</strong> {file.type}</p>
            </div>
          )}

          {/* Botón de subida */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivo
              </>
            )}
          </Button>

          {/* Resultado */}
          {result && (
            <div className={`p-4 rounded-md ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? '✅ Éxito' : '❌ Error'}
                  </p>
                  
                  {result.success && result.fileInfo && (
                    <div className="mt-2 text-sm text-green-800">
                      <p><strong>Nombre:</strong> {result.fileInfo.name}</p>
                      <p><strong>Tamaño:</strong> {result.fileInfo.sizeKB} KB</p>
                      <p><strong>Tipo:</strong> {result.fileInfo.type}</p>
                      <p><strong>Bytes leídos:</strong> {result.fileInfo.bytesRead}</p>
                    </div>
                  )}
                  
                  {result.error && (
                    <p className="mt-2 text-sm text-red-800">
                      <strong>Error:</strong> {result.error}
                    </p>
                  )}

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Ver respuesta completa
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-sm text-gray-600 space-y-2 mt-4 p-3 bg-gray-50 rounded-md">
            <p><strong>📋 Instrucciones:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Selecciona un archivo (imagen o PDF)</li>
              <li>Haz clic en "Subir Archivo"</li>
              <li>Verifica si se sube correctamente</li>
            </ol>
            <p className="mt-2 text-xs text-gray-500">
              ⚠️ Este test NO hace OCR, solo verifica que el archivo llegue al servidor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
