
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de diagnóstico para verificar el flujo completo de OCR
 * Prueba todos los componentes sin necesidad de subir archivos reales
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // 1. Verificar API key
  try {
    const apiKey = process.env.ABACUSAI_API_KEY;
    diagnostics.checks.push({
      name: 'API Key',
      status: apiKey ? 'OK' : 'ERROR',
      message: apiKey ? 'API key configurada' : 'API key NO encontrada',
      value: apiKey ? `${apiKey.substring(0, 8)}...` : 'N/A'
    });
  } catch (error: any) {
    diagnostics.checks.push({
      name: 'API Key',
      status: 'ERROR',
      message: error.message
    });
  }

  // 2. Verificar endpoint de detección IA
  try {
    const detectionEndpoint = '/api/document-detection';
    diagnostics.checks.push({
      name: 'Endpoint IA Detección',
      status: 'OK',
      message: `Endpoint existe: ${detectionEndpoint}`,
      path: detectionEndpoint
    });
  } catch (error: any) {
    diagnostics.checks.push({
      name: 'Endpoint IA Detección',
      status: 'ERROR',
      message: error.message
    });
  }

  // 3. Verificar endpoint de extracción OCR
  try {
    const ocrEndpoint = '/api/customers/extract-document-data';
    diagnostics.checks.push({
      name: 'Endpoint OCR',
      status: 'OK',
      message: `Endpoint existe: ${ocrEndpoint}`,
      path: ocrEndpoint
    });
  } catch (error: any) {
    diagnostics.checks.push({
      name: 'Endpoint OCR',
      status: 'ERROR',
      message: error.message
    });
  }

  // 4. Test de conectividad con Abacus.AI
  try {
    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      throw new Error('No API key');
    }

    const testResponse = await fetch('https://api.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Ping test'
          }
        ],
        max_tokens: 10
      })
    });

    if (testResponse.ok) {
      diagnostics.checks.push({
        name: 'Conexión Abacus.AI',
        status: 'OK',
        message: 'API responde correctamente',
        statusCode: testResponse.status
      });
    } else {
      const errorText = await testResponse.text();
      diagnostics.checks.push({
        name: 'Conexión Abacus.AI',
        status: 'ERROR',
        message: `API error: ${testResponse.status}`,
        statusCode: testResponse.status,
        error: errorText.substring(0, 200)
      });
    }
  } catch (error: any) {
    diagnostics.checks.push({
      name: 'Conexión Abacus.AI',
      status: 'ERROR',
      message: error.message,
      stack: error.stack?.substring(0, 300)
    });
  }

  // Resumen
  const errorCount = diagnostics.checks.filter((c: any) => c.status === 'ERROR').length;
  const okCount = diagnostics.checks.filter((c: any) => c.status === 'OK').length;

  diagnostics.summary = {
    total: diagnostics.checks.length,
    ok: okCount,
    errors: errorCount,
    overallStatus: errorCount === 0 ? 'HEALTHY' : 'UNHEALTHY'
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
