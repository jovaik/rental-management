
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function GSControlSettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const syncHistoricalData = async (type: 'payments' | 'expenses' | 'all') => {
    try {
      setSyncing(true);
      setResults(null);

      const response = await fetch('/api/gscontrol/sync-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        throw new Error(data.error || 'Error en la sincronización');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setResults({
        success: 0,
        errors: 1,
        skipped: 0,
        details: [{
          type: 'error',
          message: error.message
        }]
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integración GSControl</h1>
          <p className="text-muted-foreground mt-2">
            Sincronización de datos económicos con ALQUILOSCOOTER API
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota:</strong> La sincronización histórica procesará todos los registros existentes
          que aún no han sido sincronizados con GSControl. Los registros ya sincronizados serán omitidos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Pagos de Reservas
            </CardTitle>
            <CardDescription>
              Sincronizar todos los pagos históricos de reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => syncHistoricalData('payments')}
              disabled={syncing}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Sincronizar Pagos'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gastos de Mantenimiento
            </CardTitle>
            <CardDescription>
              Sincronizar todos los gastos históricos de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => syncHistoricalData('expenses')}
              disabled={syncing}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Sincronizar Gastos'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sincronización Completa
            </CardTitle>
            <CardDescription>
              Sincronizar todos los datos económicos históricos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => syncHistoricalData('all')}
              disabled={syncing}
              className="w-full"
              variant="default"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Sincronizar Todo'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Sincronización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Exitosos</p>
                  <p className="text-2xl font-bold text-green-600">{results.success}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Omitidos</p>
                  <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{results.errors}</p>
                </div>
              </div>
            </div>

            {results.details && results.details.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Detalles:</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {results.details.map((detail: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        detail.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : detail.status === 'skipped'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {detail.type === 'payment' ? 'Pago' : 'Gasto'}
                            </Badge>
                            {detail.bookingNumber && (
                              <span className="text-sm text-muted-foreground">
                                Reserva #{detail.bookingNumber}
                              </span>
                            )}
                            {detail.amount && (
                              <span className="text-sm font-semibold">
                                {detail.amount.toFixed(2)}€
                              </span>
                            )}
                          </div>
                          {detail.message && (
                            <p className="text-sm mt-1 text-muted-foreground">
                              {detail.message}
                            </p>
                          )}
                          {detail.gscontrolId && (
                            <p className="text-xs mt-1 text-muted-foreground">
                              GSControl ID: {detail.gscontrolId}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            detail.status === 'success'
                              ? 'default'
                              : detail.status === 'skipped'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {detail.status === 'success'
                            ? 'Exitoso'
                            : detail.status === 'skipped'
                            ? 'Omitido'
                            : 'Error'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
