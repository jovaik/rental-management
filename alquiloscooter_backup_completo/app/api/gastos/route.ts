
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncToGSControl } from '@/lib/gscontrol-connector';
import { uploadFile } from '@/lib/s3'; // ✅ NUEVO: Para subir archivos a S3

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const categoria = searchParams.get('categoria') || '';
    const tipo_documento = searchParams.get('tipo_documento') || '';
    const fecha_inicio = searchParams.get('fecha_inicio') || '';
    const fecha_fin = searchParams.get('fecha_fin') || '';

    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (categoria && categoria !== 'all') {
      whereClause.categoria = categoria;
    }

    if (tipo_documento && tipo_documento !== 'all') {
      whereClause.tipo_documento = tipo_documento;
    }

    if (fecha_inicio) {
      whereClause.fecha = {
        ...whereClause.fecha,
        gte: new Date(fecha_inicio)
      };
    }

    if (fecha_fin) {
      whereClause.fecha = {
        ...whereClause.fecha,
        lte: new Date(fecha_fin)
      };
    }

    const [gastos, total] = await Promise.all([
      prisma.carRentalGastos.findMany({
        where: whereClause,
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
        },
        orderBy: { fecha: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.carRentalGastos.count({ where: whereClause })
    ]);

    return NextResponse.json({
      gastos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Gastos API error:', error);
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

    // ✅ NUEVO: Soporte para FormData (con archivo) y JSON
    const contentType = request.headers.get('content-type');
    let body: any;
    let uploadedFile: File | null = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // FormData con archivo
      const formData = await request.formData();
      uploadedFile = formData.get('file') as File | null;
      
      // Convertir FormData a objeto
      body = {};
      for (const [key, value] of formData.entries()) {
        if (key !== 'file') {
          body[key] = value;
        }
      }
    } else {
      // JSON sin archivo
      body = await request.json();
    }
    
    // Validar campos requeridos
    if (!body.descripcion || body.descripcion.trim() === '') {
      return NextResponse.json({ error: 'La descripción es obligatoria' }, { status: 400 });
    }
    
    if (!body.categoria) {
      return NextResponse.json({ error: 'La categoría es obligatoria' }, { status: 400 });
    }
    
    if (!body.total || parseFloat(body.total) <= 0) {
      return NextResponse.json({ error: 'El importe total debe ser mayor a 0' }, { status: 400 });
    }
    
    if (!body.metodo_pago) {
      return NextResponse.json({ error: 'El método de pago es obligatorio' }, { status: 400 });
    }
    
    // Si es factura, validar campos adicionales
    if (body.tipo_documento === 'FACTURA') {
      if (!body.proveedor) {
        return NextResponse.json({ error: 'El proveedor es obligatorio para facturas' }, { status: 400 });
      }
      if (!body.numero_factura) {
        return NextResponse.json({ error: 'El número de factura es obligatorio' }, { status: 400 });
      }
      if (!body.base_imponible || parseFloat(body.base_imponible) <= 0) {
        return NextResponse.json({ error: 'La base imponible es obligatoria para facturas' }, { status: 400 });
      }
    }
    
    // Calcular IVA si es factura
    let gastoData: any = {
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      tipo_documento: body.tipo_documento || 'TICKET',
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
    
    // ✅ NUEVO: Subir archivo PDF/imagen a S3 si existe
    if (uploadedFile) {
      try {
        console.log('📎 [GASTOS-API] Subiendo archivo a S3:', uploadedFile.name);
        
        // Convertir File a Buffer
        const bytes = await uploadedFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const sanitizedFileName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const s3Key = `gastos/${timestamp}-${sanitizedFileName}`;
        
        // Subir a S3
        await uploadFile(buffer, s3Key);
        
        // Agregar path de S3 a los datos del gasto
        gastoData.factura_pdf_path = s3Key;
        
        console.log('✅ [GASTOS-API] Archivo subido correctamente:', s3Key);
      } catch (uploadError) {
        console.error('❌ [GASTOS-API] Error al subir archivo:', uploadError);
        // Continuar sin el archivo si falla la subida
      }
    }
    
    const gasto = await prisma.carRentalGastos.create({
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

    // ✅ SINCRONIZACIÓN AUTOMÁTICA CON GSCONTROL
    // ⚠️  ACTUALIZADO: Incluye costCategory según PDF
    try {
      const gscontrolId = syncToGSControl({
        type: 'expense',
        amount: Number(gasto.total),
        description: `${gasto.categoria} - ${gasto.descripcion}`,
        date: gasto.fecha || new Date(),
        bookingId: gasto.id, // Usar el ID del gasto como external ID
        paymentMethod: gasto.metodo_pago,
        vehicleId: gasto.vehicle_id || undefined,
        category: gasto.categoria, // Se mapeará automáticamente a costCategory en el conector
        documentType: gasto.tipo_documento === 'FACTURA' ? 'FACTURA' : 'TICKET',
        invoiceNumber: gasto.numero_factura || undefined,
        ivaRate: gasto.iva_porcentaje ? Number(gasto.iva_porcentaje) : 21
      });

      // Actualizar con el ID de GSControl
      if (gscontrolId) {
        await prisma.carRentalGastos.update({
          where: { id: gasto.id },
          data: { gscontrol_id: gscontrolId }
        });
        console.log(`✅ Gasto ${gasto.id} sincronizado con GSControl (tipo: ${gasto.tipo_documento}, categoría: ${gasto.categoria})`);
      }
    } catch (gsError) {
      console.error('❌ Error sincronizando con GSControl:', gsError);
      // No bloquear la creación del gasto
    }

    return NextResponse.json(gasto);

  } catch (error: any) {
    console.error('Gastos creation error:', error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un gasto con estos datos' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Error al crear el gasto' },
      { status: 500 }
    );
  }
}
