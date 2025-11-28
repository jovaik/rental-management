
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateInspectionPDF } from '@/lib/inspections/inspection-pdf';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const vehicleIdParam = searchParams.get('vehicleId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requerido' }, { status: 400 });
    }

    // Obtener reserva con vehículos
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        vehicles: {
          include: {
            car: true
          }
        }
      }
    });

    if (!booking || !booking.vehicles || booking.vehicles.length === 0) {
      return NextResponse.json({ error: 'Reserva o vehículo no encontrado' }, { status: 404 });
    }

    // Si se proporciona vehicleId, buscar ese vehículo específico
    // De lo contrario, usar el primer vehículo
    let vehicle;
    if (vehicleIdParam) {
      const vehicleId = parseInt(vehicleIdParam);
      const bookingVehicle = booking.vehicles.find(v => v.car_id === vehicleId);
      vehicle = bookingVehicle?.car;
    } else {
      vehicle = booking.vehicles[0].car;
    }
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Obtener inspección de entrega
    const deliveryInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vehicle.id,
        inspection_type: 'delivery'
      },
      include: {
        inspector: true
      }
    });

    // Obtener inspección de devolución
    const returnInspection = await prisma.vehicleInspections.findFirst({
      where: {
        booking_id: booking.id,
        vehicle_id: vehicle.id,
        inspection_type: 'return'
      },
      include: {
        inspector: true
      }
    });

    // Obtener configuración de empresa
    const companyConfig = await prisma.companyConfig.findFirst({ where: { active: true } });
    const companyName = companyConfig?.company_name || 'Alquiloscooter';

    // Generar PDF
    const pdfBuffer = await generateInspectionPDF({
      bookingNumber: booking.booking_number || '',
      vehicle: {
        registration_number: vehicle.registration_number || '',
        make: vehicle.make || '',
        model: vehicle.model || ''
      },
      deliveryInspection: deliveryInspection && deliveryInspection.inspector ? {
        id: deliveryInspection.id,
        inspection_type: deliveryInspection.inspection_type || 'delivery',
        inspection_date: deliveryInspection.inspection_date.toISOString(),
        odometer_reading: deliveryInspection.odometer_reading || 0,
        fuel_level: deliveryInspection.fuel_level || 'empty',
        front_photo: deliveryInspection.front_photo,
        left_photo: deliveryInspection.left_photo,
        rear_photo: deliveryInspection.rear_photo,
        right_photo: deliveryInspection.right_photo,
        odometer_photo: deliveryInspection.odometer_photo,
        general_condition: deliveryInspection.general_condition,
        notes: deliveryInspection.notes,
        inspector: {
          firstname: deliveryInspection.inspector.firstname,
          lastname: deliveryInspection.inspector.lastname
        }
      } : null,
      returnInspection: returnInspection && returnInspection.inspector ? {
        id: returnInspection.id,
        inspection_type: returnInspection.inspection_type || 'return',
        inspection_date: returnInspection.inspection_date.toISOString(),
        odometer_reading: returnInspection.odometer_reading || 0,
        fuel_level: returnInspection.fuel_level || 'empty',
        front_photo: returnInspection.front_photo,
        left_photo: returnInspection.left_photo,
        rear_photo: returnInspection.rear_photo,
        right_photo: returnInspection.right_photo,
        odometer_photo: returnInspection.odometer_photo,
        general_condition: returnInspection.general_condition,
        notes: returnInspection.notes,
        inspector: {
          firstname: returnInspection.inspector.firstname,
          lastname: returnInspection.inspector.lastname
        }
      } : null,
      companyName
    });

    // Devolver PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Inspeccion_${booking.booking_number}_${vehicle.registration_number}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('❌ [API /generate-pdf] ========== ERROR CAPTURADO ==========');
    console.error('❌ [API /generate-pdf] Tipo:', error.constructor?.name || 'Unknown');
    console.error('❌ [API /generate-pdf] Mensaje:', error.message);
    console.error('❌ [API /generate-pdf] Stack:', error.stack);
    console.error('❌ [API /generate-pdf] Code:', error.code || 'N/A');
    console.error('❌ [API /generate-pdf] Errno:', error.errno || 'N/A');
    console.error('❌ [API /generate-pdf] ==========================================');
    
    return NextResponse.json({ 
      error: 'Error generando PDF de inspección',
      message: error.message,
      name: error.name || 'Error',
      code: error.code || null,
      stack: error.stack || null
    }, { status: 500 });
  }
}
