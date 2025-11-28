
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function TestConexion() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, success: boolean, message: string, details?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Ping GET (sin body)
    try {
      console.log('🧪 Test 1: GET /api/test-ping');
      const start1 = Date.now();
      const res1 = await fetch('/api/test-ping', {
        method: 'GET'
      });
      const time1 = Date.now() - start1;
      const data1 = await res1.json();
      
      addResult(
        'GET /api/test-ping', 
        res1.ok, 
        `${res1.status} en ${time1}ms`,
        data1
      );
    } catch (error: any) {
      addResult('GET /api/test-ping', false, `❌ ${error.message}`);
    }

    // Test 2: Ping POST con JSON pequeño
    try {
      console.log('🧪 Test 2: POST /api/test-ping (JSON)');
      const start2 = Date.now();
      const res2 = await fetch('/api/test-ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'hello', numero: 123 })
      });
      const time2 = Date.now() - start2;
      const data2 = await res2.json();
      
      addResult(
        'POST /api/test-ping (JSON)', 
        res2.ok, 
        `${res2.status} en ${time2}ms`,
        data2
      );
    } catch (error: any) {
      addResult('POST /api/test-ping (JSON)', false, `❌ ${error.message}`);
    }

    // Test 3: POST con JSON más grande
    try {
      console.log('🧪 Test 3: POST con JSON 10KB');
      const largeData = { 
        test: 'large',
        data: 'x'.repeat(10000) // 10KB de datos
      };
      const start3 = Date.now();
      const res3 = await fetch('/api/test-ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(largeData)
      });
      const time3 = Date.now() - start3;
      const data3 = await res3.json();
      
      addResult(
        'POST /api/test-ping (10KB)', 
        res3.ok, 
        `${res3.status} en ${time3}ms`,
        { ...data3, receivedData: { ...data3.receivedData, data: '[TRUNCADO]' } }
      );
    } catch (error: any) {
      addResult('POST /api/test-ping (10KB)', false, `❌ ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-6 w-6" />
            🔍 Test de Conexión al Servidor
          </CardTitle>
          <CardDescription>
            Diagnóstico de conectividad móvil/escritorio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botón de test */}
          <Button
            onClick={runTests}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Ejecutando tests...
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-5 w-5" />
                Ejecutar Tests de Conexión
              </>
            )}
          </Button>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold text-lg">📊 Resultados:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.success
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.test}
                      </p>
                      <p className={`text-sm mt-1 ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.timestamp}
                      </p>
                      
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            Ver detalles técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40 border">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-sm text-gray-600 space-y-2 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p><strong>🎯 ¿Qué hace este test?</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>Test 1:</strong> Petición GET simple (sin datos)</li>
              <li><strong>Test 2:</strong> Petición POST con JSON pequeño</li>
              <li><strong>Test 3:</strong> Petición POST con JSON 10KB</li>
            </ol>
            <p className="mt-3 text-xs text-blue-700">
              ⚠️ Si algún test falla con "Failed to fetch", indica un problema de red/conectividad,
              NO del OCR ni de imágenes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
