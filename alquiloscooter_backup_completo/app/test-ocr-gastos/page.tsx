
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';

export default function TestOCRGastosPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 Archivo seleccionado:', file.name, file.type);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Enviando a /api/gastos/test-ocr-debug...');

      const response = await fetch('/api/gastos/test-ocr-debug', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      console.log('📊 Respuesta:', data);

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2));
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-500" />
            Test de OCR para Gastos - Debugging
          </CardTitle>
          <CardDescription>
            Sube un ticket o factura para ver exactamente qué datos extrae la IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input de archivo */}
          <div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="test-file-input"
              disabled={loading}
            />
            <label htmlFor="test-file-input">
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                disabled={loading}
                asChild
              >
                <span>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Ticket/Factura
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>

          {/* Resultado exitoso */}
          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Datos Extraídos por la IA:</h3>
                <pre className="text-xs bg-white p-3 rounded border border-green-300 overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📝 Respuesta Completa de la IA:</h3>
                <pre className="text-xs bg-white p-3 rounded border border-blue-300 overflow-auto max-h-96">
                  {result.rawContent}
                </pre>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">🔍 Info de Debug:</h3>
                <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-auto">
                  {JSON.stringify(result.debug, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">❌ Error:</h3>
              <pre className="text-xs bg-white p-3 rounded border border-red-300 overflow-auto max-h-96">
                {error}
              </pre>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 Cómo usar:</h3>
            <ol className="text-sm text-yellow-900 space-y-1 list-decimal list-inside">
              <li>Haz clic en "Seleccionar Ticket/Factura"</li>
              <li>Elige un documento (foto o PDF)</li>
              <li>Espera a que la IA procese el documento</li>
              <li>Verás los datos extraídos en formato JSON</li>
              <li>Si falta el proveedor u otros datos, verás exactamente qué devuelve la IA</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
