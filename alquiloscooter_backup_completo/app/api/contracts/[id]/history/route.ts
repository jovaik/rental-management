
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContractHistory } from '@/lib/contract-regeneration';

export const dynamic = 'force-dynamic';

// GET /api/contracts/[id]/history - Obtener historial de versiones de un contrato
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const contractId = parseInt(paramId);

    const history = await getContractHistory(contractId);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error obteniendo historial del contrato:', error);
    return NextResponse.json(
      { error: 'Error obteniendo historial del contrato' },
      { status: 500 }
    );
  }
}
