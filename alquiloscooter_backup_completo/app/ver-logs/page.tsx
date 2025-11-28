
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function VerLogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-logs');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    setLoading(false);
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/debug-logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Auto-refresh cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">📋 Logs de Inspección PDF</h1>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? '🔄 Cargando...' : '🔄 Refrescar'}
          </Button>
          <Button onClick={clearLogs} variant="destructive">
            🗑️ Borrar Logs
          </Button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
          {logs.length === 0 ? (
            <div className="text-yellow-400">
              ⚠️ No hay logs aún. <br />
              <br />
              <strong>INSTRUCCIONES:</strong><br />
              1. Ve a una inspección (ej. #51 o #63)<br />
              2. Haz clic en "Reenviar Email"<br />
              3. Vuelve aquí para ver los logs
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Total de líneas:</strong> {logs.length}</p>
          <p><strong>Actualización automática:</strong> Cada 3 segundos</p>
        </div>
      </Card>
    </div>
  );
}
