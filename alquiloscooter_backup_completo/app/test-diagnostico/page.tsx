
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'OK' | 'ERROR';
  message: string;
  [key: string]: any;
}

interface DiagnosticResult {
  timestamp: string;
  checks: DiagnosticCheck[];
  summary: {
    total: number;
    ok: number;
    errors: number;
    overallStatus: 'HEALTHY' | 'UNHEALTHY';
  };
}

export default function TestDiagnosticoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-ocr-flow');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              🔧 Diagnóstico de IA y OCR
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Este test verifica que todos los componentes estén funcionando correctamente
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Botón de diagnóstico */}
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Ejecutando diagnóstico...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Ejecutar Diagnóstico
                </>
              )}
            </Button>

            {/* Error general */}
            {error && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Error al ejecutar diagnóstico</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumen */}
            {result && (
              <>
                <Card className={`border-2 ${
                  result.summary.overallStatus === 'HEALTHY' 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-red-300 bg-red-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">
                          Estado General: {result.summary.overallStatus}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.summary.ok} de {result.summary.total} checks pasaron
                        </p>
                      </div>
                      {result.summary.overallStatus === 'HEALTHY' ? (
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      ) : (
                        <AlertCircle className="w-12 h-12 text-red-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Detalles de cada check */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Detalles:</h3>
                  {result.checks.map((check, index) => (
                    <Card 
                      key={index} 
                      className={`${
                        check.status === 'OK' 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          {check.status === 'OK' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{check.name}</h4>
                              <Badge variant={check.status === 'OK' ? 'default' : 'destructive'}>
                                {check.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{check.message}</p>
                            
                            {/* Información adicional */}
                            {Object.entries(check).map(([key, value]) => {
                              if (['name', 'status', 'message'].includes(key)) return null;
                              return (
                                <div key={key} className="mt-2 text-xs">
                                  <span className="font-mono font-semibold">{key}:</span>{' '}
                                  <span className="font-mono text-gray-600">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Timestamp */}
                <p className="text-xs text-gray-500 text-center">
                  Ejecutado: {new Date(result.timestamp).toLocaleString('es-ES')}
                </p>
              </>
            )}

            {/* Instrucciones */}
            {!result && !loading && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Presiona "Ejecutar Diagnóstico"</li>
                    <li>Espera 5-10 segundos</li>
                    <li>Toma screenshot de los resultados</li>
                    <li>Envíame el screenshot</li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
