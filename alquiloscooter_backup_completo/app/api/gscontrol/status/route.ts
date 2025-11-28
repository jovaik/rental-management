
/**
 * API para verificar el estado de la integración con GSControl
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isGSControlEnabled } from '@/lib/gscontrol-connector';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo SUPERADMIN puede ver el estado de integración
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enabled = isGSControlEnabled();
    const hasApiKey = !!(process.env.GSCONTROL_API_KEY);
    const endpoint = process.env.GSCONTROL_ENDPOINT || 'https://gscontrol.abacusai.app/api/integrations/sync';

    return NextResponse.json({
      enabled,
      configured: hasApiKey,
      endpoint,
      status: enabled && hasApiKey ? 'active' : 'inactive',
      message: enabled && hasApiKey 
        ? 'Sincronización activa con GSControl'
        : !hasApiKey
        ? 'API Key no configurada'
        : 'Sincronización deshabilitada'
    });

  } catch (error) {
    console.error('Error checking GSControl status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
