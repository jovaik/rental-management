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

    const cierres = await prisma.carRentalCierresCaja.findMany({
      orderBy: {
        fecha_inicio: 'desc'
      }
    })

    return NextResponse.json(cierres);

  } catch (error) {
    console.error('Cierres de caja API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo_periodo, fecha_inicio, fecha_fin, observaciones } = body;

    const startDate = new Date(fecha_inicio);
    const endDate = new Date(fecha_fin);

    // Calcular totales de ingresos (facturas emitidas)
    const ingresos = await prisma.carRentalFacturas.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        },
        estado: 'PAGADA'
      }
    });

    const ingresosEfectivo = ingresos
      .filter(f => f.metodo_pago === 'EFECTIVO')
      .reduce((sum, f) => sum + parseFloat(f.total.toString()), 0);

    const ingresosTPVSumup = ingresos
      .filter(f => f.metodo_pago === 'TPV_SUMUP')
      .reduce((sum, f) => sum + parseFloat(f.total.toString()), 0);

    const ingresosTPVUnicaja = ingresos
      .filter(f => f.metodo_pago === 'TPV_UNICAJA')
      .reduce((sum, f) => sum + parseFloat(f.total.toString()), 0);

    const totalIngresos = ingresosEfectivo + ingresosTPVSumup + ingresosTPVUnicaja;

    // Calcular totales de gastos
    const gastos = await prisma.carRentalGastos.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const gastosEfectivo = gastos
      .filter(g => g.metodo_pago === 'EFECTIVO')
      .reduce((sum, g) => sum + parseFloat(g.total.toString()), 0);

    const gastosTPVSumup = gastos
      .filter(g => g.metodo_pago === 'TPV_SUMUP')
      .reduce((sum, g) => sum + parseFloat(g.total.toString()), 0);

    const gastosTPVUnicaja = gastos
      .filter(g => g.metodo_pago === 'TPV_UNICAJA')
      .reduce((sum, g) => sum + parseFloat(g.total.toString()), 0);

    const totalGastos = gastosEfectivo + gastosTPVSumup + gastosTPVUnicaja;
    const balanceNeto = totalIngresos - totalGastos;
    const efectivoCaja = ingresosEfectivo - gastosEfectivo;

    const cierre = await prisma.carRentalCierresCaja.create({
      data: {
        tipo_periodo: tipo_periodo || 'semanal',
        fecha_inicio: startDate,
        fecha_fin: endDate,
        ingresos_efectivo: ingresosEfectivo,
        ingresos_tpv_sumup: ingresosTPVSumup,
        ingresos_tpv_unicaja: ingresosTPVUnicaja,
        total_ingresos: totalIngresos,
        gastos_efectivo: gastosEfectivo,
        gastos_tpv_sumup: gastosTPVSumup,
        gastos_tpv_unicaja: gastosTPVUnicaja,
        total_gastos: totalGastos,
        balance_neto: balanceNeto,
        efectivo_caja: efectivoCaja,
        observaciones: observaciones || null,
        usuario_id: parseInt(session.user.id)
      }
    });

    return NextResponse.json(cierre);

  } catch (error: any) {
    console.error('Cierre de caja creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al crear el cierre de caja' },
      { status: 500 }
    );
  }
}
