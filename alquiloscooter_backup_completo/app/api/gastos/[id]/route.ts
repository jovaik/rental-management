
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateGSControlTransaction, deleteGSControlTransaction } from '@/lib/gscontrol-connector';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gastoId = parseInt(params.id);

    const gasto = await prisma.carRentalGastos.findUnique({
      where: { id: gastoId },
      include: {
        maintenance: {
          include: {
            car: {
              select: {
                id: true,
                registration_number: true,
                make: true,
                model: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      }
    });

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(gasto);

  } catch (error) {
    console.error('Gasto GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gastoId = parseInt(params.id);
    
    // ✅ SOPORTE PARA FormData Y JSON
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    
    if (contentType.includes('multipart/form-data')) {
      // Si es FormData, convertir a objeto
      const formData = await request.formData();
      body = {};
      formData.forEach((value, key) => {
        if (key !== 'file') { // Ignorar el archivo en esta conversión
          body[key] = value;
        }
      });
    } else {
      // Si es JSON, parsear normalmente
      body = await request.json();
    }
    
    // No permitir editar gastos generados automáticamente desde mantenimiento
    const existing = await prisma.carRentalGastos.findUnique({
      where: { id: gastoId }
    });
    
    if (existing?.maintenance_id) {
      return NextResponse.json(
        { error: 'No se pueden editar gastos generados automáticamente desde mantenimiento' },
        { status: 400 }
      );
    }
    
    // Preparar datos de actualización
    let gastoData: any = {
      fecha: body.fecha ? new Date(body.fecha) : undefined,
      tipo_documento: body.tipo_documento,
      categoria: body.categoria,
      descripcion: body.descripcion,
      total: parseFloat(body.total),
      metodo_pago: body.metodo_pago,
      vehicle_id: body.vehicle_id ? parseInt(body.vehicle_id) : null
    };
    
    if (body.tipo_documento === 'FACTURA') {
      const baseImponible = parseFloat(body.base_imponible);
      const ivaPorcentaje = parseFloat(body.iva_porcentaje || 21);
      const ivaImporte = baseImponible * (ivaPorcentaje / 100);
      
      gastoData = {
        ...gastoData,
        proveedor: body.proveedor,
        proveedor_cif: body.proveedor_cif || null,
        numero_factura: body.numero_factura,
        base_imponible: baseImponible,
        iva_porcentaje: ivaPorcentaje,
        iva_importe: ivaImporte
      };
    }

    const gasto = await prisma.carRentalGastos.update({
      where: { id: gastoId },
      data: gastoData,
      include: {
        vehicle: {
          select: {
            id: true,
            registration_number: true,
            make: true,
            model: true
          }
        }
      }
    });

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL (UPDATE)
    // ⚠️  ACTUALIZADO: Incluye costCategory según PDF
    if (existing?.gscontrol_id) {
      try {
        updateGSControlTransaction(existing.gscontrol_id, {
          type: 'expense',
          amount: body.total !== undefined ? parseFloat(body.total) : undefined,
          description: body.descripcion ? `${gasto.categoria} - ${body.descripcion}` : undefined,
          date: body.fecha ? new Date(body.fecha) : undefined,
          category: body.categoria, // Se mapeará automáticamente a costCategory
          documentType: gasto.tipo_documento === 'FACTURA' ? 'FACTURA' : 'TICKET',
          invoiceNumber: gasto.numero_factura || undefined,
          ivaRate: gasto.iva_porcentaje ? Number(gasto.iva_porcentaje) : 21,
          paymentMethod: body.metodo_pago
        });
        console.log(`✅ Gasto ${gastoId} actualizado en GSControl (tipo: ${gasto.tipo_documento}, categoría: ${gasto.categoria})`);
      } catch (gsError) {
        console.error('❌ Error actualizando en GSControl:', gsError);
      }
    }

    return NextResponse.json(gasto);

  } catch (error: any) {
    console.error('Gasto update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al actualizar el gasto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gastoId = parseInt(params.id);
    
    // No permitir eliminar gastos generados automáticamente desde mantenimiento
    const existing = await prisma.carRentalGastos.findUnique({
      where: { id: gastoId }
    });
    
    if (existing?.maintenance_id) {
      return NextResponse.json(
        { error: 'No se pueden eliminar gastos generados automáticamente. Elimine el mantenimiento asociado.' },
        { status: 400 }
      );
    }

    await prisma.carRentalGastos.delete({
      where: { id: gastoId }
    });

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL (DELETE)
    if (existing?.gscontrol_id) {
      try {
        deleteGSControlTransaction(existing.gscontrol_id);
        console.log(`✅ Gasto ${gastoId} eliminado de GSControl`);
      } catch (gsError) {
        console.error('❌ Error eliminando de GSControl:', gsError);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Gasto delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al eliminar el gasto' },
      { status: 500 }
    );
  }
}
