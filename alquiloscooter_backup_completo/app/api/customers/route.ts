

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { detectLanguageFromCountry } from '@/lib/language-detector';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const whereClause: any = {
      status: { in: ['active', 'incomplete'] }  // Incluir clientes incompletos también
    };

    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { dni_nie: { contains: search, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.carRentalCustomers.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(customers);

  } catch (error) {
    console.error('Customers API error:', error);
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
    
    // Validate required fields
    if (!body.first_name || !body.last_name || !body.phone || !body.email) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, apellido, teléfono y email' },
        { status: 400 }
      );
    }

    // Check for duplicate DNI/NIE if provided
    if (body.dni_nie) {
      const existingCustomer = await prisma.carRentalCustomers.findUnique({
        where: { dni_nie: body.dni_nie }
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este DNI/NIE/Pasaporte' },
          { status: 409 }
        );
      }
    }

    // Check for duplicate email if provided
    if (body.email) {
      const existingCustomer = await prisma.carRentalCustomers.findUnique({
        where: { email: body.email }
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email' },
          { status: 409 }
        );
      }
    }

    // Detectar idioma automáticamente basándose en el país del cliente
    const country = body.country || 'España';
    const autoDetectedLanguage = detectLanguageFromCountry(country, 'es');
    
    // Si el usuario no especificó un idioma manualmente, usar el detectado automáticamente
    const finalLanguage = body.preferred_language || autoDetectedLanguage;
    
    // VALIDACIÓN DE CAMPOS OBLIGATORIOS PARA DEVOLUCIÓN DE DEPÓSITO:
    // Un cliente solo puede estar "active" si tiene TODOS los datos necesarios para devolución de depósito:
    // 1. Nombre (obligatorio)
    // 2. Apellido (obligatorio)
    // 3. Email (obligatorio)
    // 4. Teléfono (obligatorio)
    // 5. DNI/NIE/Pasaporte (obligatorio para devolución)
    // 6. Dirección permanente (obligatoria para devolución)
    // 7. Carnet de conducir - fotos (obligatorio para devolución)
    // 8. Documento de identidad - fotos (obligatorio para devolución)
    const hasAllRequiredFields = body.first_name &&
                                 body.last_name &&
                                 body.email &&
                                 body.phone &&
                                 body.dni_nie &&
                                 body.street_address &&
                                 body.driver_license_front &&
                                 body.driver_license_back &&
                                 body.id_document_front &&
                                 body.id_document_back;
    
    const customerStatus = hasAllRequiredFields ? 'active' : 'incomplete';
    
    console.log('📋 Validación al crear cliente (incluye requisitos para devolución de depósito):');
    console.log('  Nombre:', !!body.first_name);
    console.log('  Apellido:', !!body.last_name);
    console.log('  Email:', !!body.email);
    console.log('  Teléfono:', !!body.phone);
    console.log('  DNI/NIE:', !!body.dni_nie);
    console.log('  Dirección:', !!body.street_address);
    console.log('  Carnet Front:', !!body.driver_license_front);
    console.log('  Carnet Back:', !!body.driver_license_back);
    console.log('  ID Front:', !!body.id_document_front);
    console.log('  ID Back:', !!body.id_document_back);
    console.log('  ✅ Status asignado:', customerStatus);
    
    const customer = await prisma.carRentalCustomers.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone,
        street_address: body.street_address || null,
        address_details: body.address_details || null,
        postal_code: body.postal_code || null,
        city: body.city || null,
        state: body.state || null,
        country: country,
        dni_nie: body.dni_nie || null,
        driver_license: body.driver_license || null,
        license_expiry: body.license_expiry ? new Date(body.license_expiry) : null,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : null,
        customer_type: body.customer_type || 'individual',
        company_name: body.company_name || null,
        tax_id: body.tax_id || null,
        preferred_language: finalLanguage,
        notes: body.notes || null,
        driver_license_front: body.driver_license_front || null,
        driver_license_back: body.driver_license_back || null,
        id_document_front: body.id_document_front || null,
        id_document_back: body.id_document_back || null,
        status: customerStatus
      }
    });

    return NextResponse.json(customer);

  } catch (error) {
    console.error('Customer creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

