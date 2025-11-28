
/**
 * Endpoint de diagnóstico para GSControl
 * Verifica el estado de sincronización sin modificar datos
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isGSControlEnabled } from '@/lib/gscontrol-connector';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar configuración
    const enabled = isGSControlEnabled();
    const hasApiKey = !!(process.env.GSCONTROL_API_KEY);

    // Contar registros
    const totalPayments = await prisma.bookingPayments.count();
    const syncedPayments = await prisma.bookingPayments.count({
      where: { gscontrol_id: { not: null } }
    });

    const totalMaintenanceExpenses = await prisma.carRentalMaintenanceExpenses.count();
    const syncedMaintenanceExpenses = await prisma.carRentalMaintenanceExpenses.count({
      where: { gscontrol_id: { not: null } }
    });

    const totalGastos = await prisma.carRentalGastos.count();
    const syncedGastos = await prisma.carRentalGastos.count({
      where: { gscontrol_id: { not: null } }
    });

    // Obtener algunos registros pendientes de ejemplo
    const pendingPayments = await prisma.bookingPayments.findMany({
      where: { gscontrol_id: null },
      take: 3,
      include: {
        booking: {
          include: { customer: true }
        }
      }
    });

    const pendingMaintenanceExpenses = await prisma.carRentalMaintenanceExpenses.findMany({
      where: { gscontrol_id: null },
      take: 3,
      include: {
        maintenance: {
          include: { car: true }
        }
      }
    });

    const pendingGastos = await prisma.carRentalGastos.findMany({
      where: { gscontrol_id: null },
      take: 3,
      include: { vehicle: true }
    });

    const totalRecords = totalPayments + totalMaintenanceExpenses + totalGastos;
    const totalSynced = syncedPayments + syncedMaintenanceExpenses + syncedGastos;
    const totalPending = totalRecords - totalSynced;

    return NextResponse.json({
      configuracion: {
        enabled,
        hasApiKey,
        apiKeyPrefix: process.env.GSCONTROL_API_KEY?.substring(0, 10) + '...',
        endpoint: process.env.GSCONTROL_ENDPOINT
      },
      resumen: {
        totalRegistros: totalRecords,
        totalSincronizados: totalSynced,
        totalPendientes: totalPending,
        porcentajeSincronizado: totalRecords > 0 ? ((totalSynced / totalRecords) * 100).toFixed(1) + '%' : '0%'
      },
      pagos: {
        total: totalPayments,
        sincronizados: syncedPayments,
        pendientes: totalPayments - syncedPayments,
        ejemplosPendientes: pendingPayments.map(p => ({
          id: p.id,
          bookingNumber: p.booking?.booking_number,
          amount: Number(p.monto),
          date: p.fecha_pago,
          customer: p.booking?.customer ? `${p.booking.customer.first_name} ${p.booking.customer.last_name}` : null
        }))
      },
      gastosMantenimiento: {
        total: totalMaintenanceExpenses,
        sincronizados: syncedMaintenanceExpenses,
        pendientes: totalMaintenanceExpenses - syncedMaintenanceExpenses,
        ejemplosPendientes: pendingMaintenanceExpenses.map(e => ({
          id: e.id,
          description: e.description || e.item_name,
          amount: Number(e.total_price),
          date: e.purchase_date,
          vehicle: e.maintenance.car.registration_number
        }))
      },
      gastosGenerales: {
        total: totalGastos,
        sincronizados: syncedGastos,
        pendientes: totalGastos - syncedGastos,
        ejemplosPendientes: pendingGastos.map(g => ({
          id: g.id,
          description: g.descripcion,
          category: g.categoria,
          amount: Number(g.total),
          date: g.fecha,
          vehicle: g.vehicle?.registration_number
        }))
      },
      recomendacion: totalPending === 0 
        ? '✅ Todos los registros ya están sincronizados'
        : totalPending > 0 && !enabled
        ? '⚠️ Hay registros pendientes pero GSControl no está configurado'
        : totalPending > 0 && enabled
        ? `📊 Hay ${totalPending} registros pendientes de sincronizar. Ejecuta la sincronización histórica.`
        : '✅ No hay registros para sincronizar'
    });

  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el diagnóstico' },
      { status: 500 }
    );
  }
}
