

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST: Añadir conductor adicional manualmente (sin listar clientes - RGPD compliant)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const bookingId = parseInt((await params).id);
    const body = await request.json();
    const { full_name, dni_nie, driver_license, license_expiry, phone, email } = body;

    // Validación de campos obligatorios
    if (!full_name?.trim()) {
      return NextResponse.json({ message: 'El nombre completo es obligatorio' }, { status: 400 });
    }
    if (!dni_nie?.trim()) {
      return NextResponse.json({ message: 'El DNI/NIE/Pasaporte es obligatorio' }, { status: 400 });
    }
    if (!driver_license?.trim()) {
      return NextResponse.json({ message: 'El carnet de conducir es obligatorio' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ message: 'El teléfono es obligatorio' }, { status: 400 });
    }

    // Verificar que la reserva existe
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        drivers: true,
        customer: true
      }
    });

    if (!booking) {
      return NextResponse.json({ message: 'Reserva no encontrada' }, { status: 404 });
    }

    // Verificar que no existe un conductor con el mismo DNI en esta reserva
    const existingDriver = booking.drivers?.find(d => 
      d.dni_nie?.toLowerCase() === dni_nie.trim().toLowerCase()
    );
    if (existingDriver) {
      return NextResponse.json(
        { message: 'Ya existe un conductor con este DNI/NIE en esta reserva' },
        { status: 400 }
      );
    }

    // Verificar que no es el cliente titular (por DNI si está disponible)
    if (booking.customer?.dni_nie && dni_nie.trim()) {
      if (booking.customer.dni_nie.toLowerCase() === dni_nie.trim().toLowerCase()) {
        return NextResponse.json(
          { message: 'Este conductor ya es el cliente titular de la reserva' },
          { status: 400 }
        );
      }
    }

    // Validación adicional por nombre completo para evitar duplicación cuando no hay DNI
    const customerFullName = `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim().toLowerCase();
    const driverFullName = full_name.trim().toLowerCase();
    
    if (customerFullName && driverFullName && customerFullName === driverFullName) {
      return NextResponse.json(
        { message: 'Este conductor ya es el cliente titular de la reserva (mismo nombre completo)' },
        { status: 400 }
      );
    }

    // Validación adicional por teléfono
    if (booking.customer?.phone && phone.trim()) {
      const customerPhone = booking.customer.phone.replace(/\D/g, ''); // Solo dígitos
      const driverPhone = phone.trim().replace(/\D/g, '');
      
      if (customerPhone && driverPhone && customerPhone === driverPhone) {
        return NextResponse.json(
          { message: 'Este conductor ya es el cliente titular de la reserva (mismo teléfono)' },
          { status: 400 }
        );
      }
    }

    // Crear el conductor adicional
    const newDriver = await prisma.bookingDrivers.create({
      data: {
        booking_id: bookingId,
        full_name: full_name.trim(),
        dni_nie: dni_nie.trim().toUpperCase(),
        driver_license: driver_license.trim().toUpperCase(),
        license_expiry: license_expiry || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        // Los documentos se subirán después manualmente
        driver_license_front: null,
        driver_license_back: null,
        id_document_front: null,
        id_document_back: null
      }
    });

    console.log(`✅ Conductor añadido manualmente: ${full_name} (DNI: ${dni_nie}) a reserva ${bookingId}`);

    return NextResponse.json({
      message: 'Conductor añadido exitosamente',
      driver: newDriver
    });

  } catch (error: any) {
    console.error('Error añadiendo conductor manualmente:', error);
    return NextResponse.json(
      { message: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
