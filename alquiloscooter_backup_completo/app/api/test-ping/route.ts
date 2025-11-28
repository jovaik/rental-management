
import { NextRequest, NextResponse } from 'next/server';

// ✅ Test ULTRA simple - Solo responde "pong"
export async function GET(request: NextRequest) {
  console.log('🏓 [PING] GET request recibido');
  return NextResponse.json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🏓 [PING] POST request recibido');
  
  try {
    // Intentar leer body JSON
    const body = await request.json();
    console.log('📦 [PING] Body recibido:', body);
    
    return NextResponse.json({
      success: true,
      message: 'POST recibido correctamente',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [PING] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
