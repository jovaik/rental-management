
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all vehicles with related data
    const vehicles = await prisma.carRentalCars.findMany({
      include: {
        pricingGroup: {
          select: {
            name: true
          }
        },
        ownerUser: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            phone: true
          }
        },
        depositorUser: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { registration_number: 'asc' }
    });

    // Convert to CSV format
    const headers = [
      'Matrícula',
      'Marca',
      'Modelo',
      'Año',
      'Color',
      'Kilometraje',
      'Estado',
      'Tipo Combustible',
      'Calificación',
      'Grupo Precios',
      'VIN/Bastidor',
      'Póliza Seguro',
      'Inicio Seguro',
      'Vencimiento Seguro',
      'Tipo Póliza',
      'Seguro Activo',
      'ITV Válida',
      'Última ITV',
      'Vencimiento ITV',
      'Tipo Propiedad',
      'Fin Contrato Renting',
      'Pago Mensual Renting',
      'Porcentaje Comisión',
      'Nombre Propietario',
      'Contacto Propietario',
      'Precio Compra',
      'Valor Mercado',
      'Precio Venta',
      'Estado Documentos',
      'Llaves Repuesto',
      'Asignado A',
      'Ubicación Actual',
      'Notas'
    ];

    const rows = vehicles.map((v: any) => [
      v.registration_number || '',
      v.make || '',
      v.model || '',
      v.year || '',
      v.color || '',
      v.mileage || '',
      v.status === 'T' ? 'Activo' : v.status === 'F' ? 'Inactivo' : v.status || '',
      v.fuel_type || '',
      v.condition_rating || '',
      v.pricingGroup?.name || '',
      v.vin || '',
      v.insurance_policy || '',
      v.insurance_start_date || '',
      v.insurance_expiry || '',
      v.insurance_policy_type || '',
      v.insurance_active ? 'Sí' : 'No',
      v.itv_valid ? 'Sí' : 'No',
      v.last_itv_date || '',
      v.itv_expiry || '',
      v.ownership_type || '',
      v.rental_contract_end || '',
      v.rental_monthly_payment || '',
      v.commission_percentage || '',
      v.ownerUser ? `${v.ownerUser.firstname} ${v.ownerUser.lastname}` : '',
      v.ownerUser ? (v.ownerUser.phone || v.ownerUser.email) : '',
      v.purchase_price || '',
      v.market_value || '',
      v.sale_price || '',
      v.document_status || '',
      v.spare_keys ? 'Sí' : 'No',
      v.assigned_to || '',
      v.current_location || '',
      v.notes || ''
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((cell: any) => {
        // Escape commas and quotes in cell values
        const value = String(cell).replace(/"/g, '""');
        return value.includes(',') || value.includes('"') || value.includes('\n') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vehiculos_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting vehicles:', error);
    return NextResponse.json({ error: 'Error al exportar vehículos' }, { status: 500 });
  }
}
