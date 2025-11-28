
import { NextResponse } from 'next/server';

/**
 * ENDPOINT DESACTIVADO - No enviar emails de prueba durante el build
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Endpoint desactivado para evitar emails de prueba' 
  });
}

export const dynamic = 'force-dynamic';
