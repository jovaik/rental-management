import { NextRequest, NextResponse } from 'next/server';

// Este endpoint ya no se usa - usamos HTML directo
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ 
    message: 'Este endpoint ha sido reemplazado por /api/inspections/html'
  });
}
