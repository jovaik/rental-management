
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import { getBookingFilePath } from '@/lib/booking-number';

export const dynamic = 'force-dynamic';

// GET /api/inspections/[id]/damages - Obtener daños de una inspección
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
    const inspectionId = parseInt(paramId);

    const damages = await prisma.inspectionDamages.findMany({
      where: { inspection_id: inspectionId },
      include: {
        spare_parts: {
          include: {
            spare_part: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(damages);
  } catch (error) {
    console.error('Error obteniendo daños:', error);
    return NextResponse.json(
      { error: 'Error obteniendo daños' },
      { status: 500 }
    );
  }
}

// POST /api/inspections/[id]/damages - Añadir daño a una inspección
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const inspectionId = parseInt(paramId);

    const formData = await request.formData();
    const description = formData.get('description')?.toString();
    const severity = formData.get('severity')?.toString();
    const location = formData.get('location')?.toString();
    const photoFile = formData.get('photo') as File;
    
    // Campos de tasación
    const estimatedCost = formData.get('estimatedCost')?.toString();
    const repairStatus = formData.get('repairStatus')?.toString();
    const paymentStatus = formData.get('paymentStatus')?.toString();
    const responsibleParty = formData.get('responsibleParty')?.toString();
    const notes = formData.get('notes')?.toString();

    // Repuestos seleccionados (JSON array)
    const sparePartsJson = formData.get('spareParts')?.toString();
    let spareParts: Array<{ id: number; quantity: number; price: number }> = [];
    if (sparePartsJson) {
      try {
        spareParts = JSON.parse(sparePartsJson);
      } catch (e) {
        console.error('Error parseando spareParts:', e);
      }
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Falta descripción del daño' },
        { status: 400 }
      );
    }

    // Obtener el booking_number de la inspección
    const inspection = await prisma.vehicleInspections.findUnique({
      where: { id: inspectionId },
      include: {
        booking: {
          select: { booking_number: true }
        }
      }
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      );
    }

    const bookingNumber = inspection.booking.booking_number || `booking-${inspection.booking_id}`;

    // Subir foto del daño si existe, organizada por expediente
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const fileName = `damage-${Date.now()}-${photoFile.name}`;
      // Nueva estructura: expedientes/20251022001/danos/damage-123456-image.jpg
      const expedienteFolder = getBookingFilePath(bookingNumber, 'danos');
      const s3Key = `${expedienteFolder}${fileName}`;
      photoUrl = await uploadFile(buffer, s3Key);
    }

    // Calcular costo total de repuestos
    const totalSpareParts = spareParts.reduce((sum, sp) => sum + (sp.quantity * sp.price), 0);
    const finalEstimatedCost = estimatedCost ? parseFloat(estimatedCost) : totalSpareParts;

    // Crear daño con repuestos en una transacción
    const damage = await prisma.$transaction(async (tx: any) => {
      // Crear el daño
      const newDamage = await tx.inspectionDamages.create({
        data: {
          inspection_id: inspectionId,
          description,
          severity: severity || null,
          location: location || null,
          photo_url: photoUrl,
          estimated_cost: finalEstimatedCost || null,
          repair_status: repairStatus || 'pending',
          payment_status: paymentStatus || 'unpaid',
          responsible_party: responsibleParty || 'customer',
          notes: notes || null
        }
      });

      // Crear relaciones con repuestos
      if (spareParts.length > 0) {
        await tx.damageSpareParts.createMany({
          data: spareParts.map(sp => ({
            damage_id: newDamage.id,
            spare_part_id: sp.id,
            quantity: sp.quantity,
            unit_price: sp.price,
            total_price: sp.quantity * sp.price
          }))
        });
      }

      // Retornar daño con repuestos incluidos
      return tx.inspectionDamages.findUnique({
        where: { id: newDamage.id },
        include: {
          spare_parts: {
            include: {
              spare_part: true
            }
          }
        }
      });
    });

    return NextResponse.json(damage);
  } catch (error) {
    console.error('Error añadiendo daño:', error);
    return NextResponse.json(
      { error: 'Error añadiendo daño' },
      { status: 500 }
    );
  }
}
