
import { NextResponse } from 'next/server';

// Este endpoint ha sido removido
export async function POST() {
  return NextResponse.json({ message: 'Endpoint removed' }, { status: 410 });
}
