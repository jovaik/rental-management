
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {
      user_id: parseInt(session.user?.id || '0')
    };

    if (unreadOnly) {
      whereClause.is_read = 'N';
    }

    const notifications = await prisma.carRentalNotifications.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return NextResponse.json(notifications);

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAsRead } = body;

    const updatedNotifications = await prisma.carRentalNotifications.updateMany({
      where: {
        id: { in: notificationIds },
        user_id: parseInt(session.user?.id || '0')
      },
      data: {
        is_read: markAsRead ? 'Y' : 'N'
      }
    });

    return NextResponse.json({ success: true, updated: updatedNotifications.count });

  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
