

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { detectLanguageFromCountry } from '@/lib/language-detector';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const customer = await prisma.carRentalCustomers.findUnique({
      where: { id: parseInt(paramId) },
      include: {
        bookings: {
          include: {
            car: true
          },
          orderBy: { pickup_date: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(customer);

  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const customerId = parseInt((await params).id);

    console.log('📥 Datos recibidos en API PUT:', body);
    console.log('📥 Customer ID:', customerId);

    // Check if customer exists
    const existingCustomer = await prisma.carRentalCustomers.findUnique({
      where: { id: customerId }
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Check for duplicate DNI/NIE if changed
    if (body.dni_nie && body.dni_nie !== existingCustomer.dni_nie) {
      const duplicateDni = await prisma.carRentalCustomers.findUnique({
        where: { dni_nie: body.dni_nie }
      });

      if (duplicateDni) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este DNI/NIE/Pasaporte' },
          { status: 409 }
        );
      }
    }

    // Check for duplicate email if changed
    if (body.email && body.email !== existingCustomer.email) {
      const duplicateEmail = await prisma.carRentalCustomers.findUnique({
        where: { email: body.email }
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este email' },
          { status: 409 }
        );
      }
    }

    // Determinar el nuevo status basándose en si los datos están completos
    const updatedDriverLicenseFront = body.driver_license_front || existingCustomer.driver_license_front;
    const updatedDriverLicenseBack = body.driver_license_back || existingCustomer.driver_license_back;
    const updatedIdDocumentFront = body.id_document_front || existingCustomer.id_document_front;
    const updatedIdDocumentBack = body.id_document_back || existingCustomer.id_document_back;
    const updatedEmail = body.email !== undefined ? body.email : existingCustomer.email;
    
    // Si el cliente está marcado como "incomplete", verificar si ahora está completo
    let newStatus = body.status || existingCustomer.status;
    if (existingCustomer.status === 'incomplete' && !body.status) {
      // Auto-actualizar a "active" si se completaron todos los campos OBLIGATORIOS PARA DEVOLUCIÓN DE DEPÓSITO:
      // 1. Nombre (obligatorio)
      // 2. Apellidos (obligatorio)
      // 3. Email (obligatorio)
      // 4. Teléfono (obligatorio)
      // 5. Carnet de conducir - foto frontal (obligatorio)
      // 6. Pasaporte o DNI/NIE - foto frontal (obligatorio)
      // NOTA: La dirección NO es obligatoria (ya está en el documento)
      const updatedFirstName = body.first_name !== undefined ? body.first_name : existingCustomer.first_name;
      const updatedLastName = body.last_name !== undefined ? body.last_name : existingCustomer.last_name;
      const updatedPhone = body.phone !== undefined ? body.phone : existingCustomer.phone;
      
      const isComplete = updatedFirstName && 
                        updatedLastName &&
                        updatedEmail &&
                        updatedPhone &&
                        updatedDriverLicenseFront &&
                        updatedIdDocumentFront;
      
      if (isComplete) {
        newStatus = 'active';
        console.log('✅ Cliente actualizado de "incomplete" a "active" - TODOS los campos obligatorios completos');
      } else {
        console.log('⚠️ Cliente sigue "incomplete" - faltan campos obligatorios para devolución de depósito');
        console.log('  Nombre:', !!updatedFirstName);
        console.log('  Apellidos:', !!updatedLastName);
        console.log('  Email:', !!updatedEmail);
        console.log('  Teléfono:', !!updatedPhone);
        console.log('  Carnet de conducir (foto):', !!updatedDriverLicenseFront);
        console.log('  Pasaporte o DNI/NIE (foto):', !!updatedIdDocumentFront);
      }
    }

    // Detectar idioma automáticamente si cambió el país y no se especificó idioma manualmente
    const updatedCountry = body.country !== undefined ? body.country : existingCustomer.country;
    let updatedLanguage = body.preferred_language !== undefined ? body.preferred_language : existingCustomer.preferred_language;
    
    // Si cambió el país pero no se especificó idioma, auto-detectar
    if (body.country !== undefined && body.preferred_language === undefined) {
      const autoDetectedLanguage = detectLanguageFromCountry(updatedCountry, 'es');
      updatedLanguage = autoDetectedLanguage;
    }
    
    // Preparar los datos de actualización - solo incluir campos que vienen en el body
    // o mantener los existentes si no se envían
    const updateData: any = {
      first_name: body.first_name !== undefined ? body.first_name : existingCustomer.first_name,
      last_name: body.last_name !== undefined ? body.last_name : existingCustomer.last_name,
      email: body.email !== undefined ? (body.email || null) : existingCustomer.email,
      phone: body.phone !== undefined ? body.phone : existingCustomer.phone,
      street_address: body.street_address !== undefined ? (body.street_address || null) : existingCustomer.street_address,
      address_details: body.address_details !== undefined ? (body.address_details || null) : existingCustomer.address_details,
      postal_code: body.postal_code !== undefined ? (body.postal_code || null) : existingCustomer.postal_code,
      city: body.city !== undefined ? (body.city || null) : existingCustomer.city,
      state: body.state !== undefined ? (body.state || null) : existingCustomer.state,
      country: updatedCountry,
      dni_nie: body.dni_nie !== undefined ? (body.dni_nie || null) : existingCustomer.dni_nie,
      driver_license: body.driver_license !== undefined ? (body.driver_license || null) : existingCustomer.driver_license,
      license_expiry: body.license_expiry !== undefined ? (body.license_expiry && body.license_expiry !== '' ? new Date(body.license_expiry) : null) : existingCustomer.license_expiry,
      date_of_birth: body.date_of_birth !== undefined ? (body.date_of_birth && body.date_of_birth !== '' ? new Date(body.date_of_birth) : null) : existingCustomer.date_of_birth,
      customer_type: body.customer_type !== undefined ? body.customer_type : existingCustomer.customer_type,
      company_name: body.company_name !== undefined ? (body.company_name || null) : existingCustomer.company_name,
      tax_id: body.tax_id !== undefined ? (body.tax_id || null) : existingCustomer.tax_id,
      preferred_language: updatedLanguage,
      notes: body.notes !== undefined ? (body.notes || null) : existingCustomer.notes,
      driver_license_front: updatedDriverLicenseFront,
      driver_license_back: updatedDriverLicenseBack,
      id_document_front: updatedIdDocumentFront,
      id_document_back: updatedIdDocumentBack,
      status: newStatus
    };

    console.log('📤 Datos a actualizar en BD:', updateData);

    const customer = await prisma.carRentalCustomers.update({
      where: { id: customerId },
      data: updateData
    });

    console.log('✅ Cliente actualizado:', customer);

    return NextResponse.json(customer);

  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = parseInt((await params).id);

    // Check if customer has active bookings
    const activeBookings = await prisma.carRentalBookings.findMany({
      where: {
        customer_id: customerId,
        status: { in: ['confirmed', 'pending'] }
      }
    });

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con reservas activas' },
        { status: 400 }
      );
    }

    // Soft delete - change status to inactive
    await prisma.carRentalCustomers.update({
      where: { id: customerId },
      data: { status: 'inactive' }
    });

    return NextResponse.json({ message: 'Cliente desactivado exitosamente' });

  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

