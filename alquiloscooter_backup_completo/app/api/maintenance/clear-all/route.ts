
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all maintenance expenses first
    await prisma.carRentalMaintenanceExpenses.deleteMany();

    // Delete all maintenance records
    await prisma.carRentalVehicleMaintenance.deleteMany();

    return NextResponse.json({ success: true, message: 'All maintenance records cleared' });

  } catch (error) {
    console.error('Clear maintenance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
