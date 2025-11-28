
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceId = parseInt(params.id);
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.payment_method) {
      return NextResponse.json({ error: 'El método de pago es obligatorio' }, { status: 400 });
    }
    
    if (!body.tipo_documento) {
      return NextResponse.json({ error: 'El tipo de documento es obligatorio' }, { status: 400 });
    }
    
    // Obtener el mantenimiento con gastos
    const maintenance = await prisma.carRentalVehicleMaintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        car: true,
        workshop: true,
        expenses: true
      }
    });
    
    if (!maintenance) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }
    
    // Verificar si ya está pagado
    if (maintenance.is_paid) {
      return NextResponse.json({ error: 'Este mantenimiento ya está marcado como pagado' }, { status: 400 });
    }
    
    // Calcular el total del mantenimiento (suma de expenses)
    const totalMantenimiento = maintenance.expenses.reduce((sum, exp) => {
      return sum + parseFloat(exp.total_price.toString());
    }, 0);
    
    if (totalMantenimiento <= 0) {
      return NextResponse.json({ error: 'El mantenimiento debe tener al menos un gasto registrado' }, { status: 400 });
    }
    
    // Preparar datos del gasto
    let gastoData: any = {
      fecha: new Date(),
      tipo_documento: body.tipo_documento,
      categoria: 'Mantenimiento',
      descripcion: `${maintenance.title} - ${maintenance.car.registration_number}`,
      total: totalMantenimiento,
      metodo_pago: body.payment_method,
      maintenance_id: maintenanceId,
      vehicle_id: maintenance.car_id
    };
    
    // Si es FACTURA, añadir campos fiscales
    if (body.tipo_documento === 'FACTURA') {
      if (!body.numero_factura) {
        return NextResponse.json({ error: 'El número de factura es obligatorio' }, { status: 400 });
      }
      
      const baseImponible = totalMantenimiento / 1.21; // Asumiendo IVA 21%
      const ivaPorcentaje = 21;
      const ivaImporte = totalMantenimiento - baseImponible;
      
      gastoData = {
        ...gastoData,
        proveedor: maintenance.workshop?.name || body.proveedor || 'Taller',
        proveedor_cif: body.proveedor_cif || null,
        numero_factura: body.numero_factura,
        base_imponible: baseImponible,
        iva_porcentaje: ivaPorcentaje,
        iva_importe: ivaImporte
      };
    }
    
    // Usar transacción para actualizar mantenimiento y crear gasto
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar mantenimiento como pagado
      const updatedMaintenance = await tx.carRentalVehicleMaintenance.update({
        where: { id: maintenanceId },
        data: {
          is_paid: true,
          paid_date: new Date(),
          payment_method: body.payment_method,
          tipo_documento: body.tipo_documento,
          numero_factura: body.tipo_documento === 'FACTURA' ? body.numero_factura : null
        }
      });
      
      // Crear gasto automáticamente
      const gasto = await tx.carRentalGastos.create({
        data: gastoData
      });
      
      return { maintenance: updatedMaintenance, gasto };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Marcar mantenimiento pagado error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al marcar el mantenimiento como pagado' },
      { status: 500 }
    );
  }
}
