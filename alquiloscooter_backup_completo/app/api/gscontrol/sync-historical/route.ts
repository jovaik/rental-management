
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncToGSControl } from '@/lib/gscontrol-connector';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { type } = await request.json();

    const results = {
      success: 0,
      errors: 0,
      skipped: 0,
      details: [] as any[]
    };

    // Sincronizar pagos de reservas
    if (type === 'payments' || type === 'all') {
      console.log('🔄 Sincronizando pagos históricos...');
      
      const payments = await prisma.bookingPayments.findMany({
        include: {
          booking: {
            include: {
              customer: true
            }
          }
        },
        orderBy: {
          fecha_pago: 'asc'
        }
      });

      console.log(`📊 Total de pagos a sincronizar: ${payments.length}`);

      for (const payment of payments) {
        try {
          // Verificar si ya existe gscontrol_id
          if (payment.gscontrol_id) {
            results.skipped++;
            results.details.push({
              type: 'payment',
              id: payment.id,
              status: 'skipped',
              message: 'Ya sincronizado previamente'
            });
            continue;
          }

          // Sincronizar a GSControl
          if (!payment.booking) {
            results.errors++;
            results.details.push({
              type: 'payment',
              id: payment.id,
              status: 'error',
              message: 'No se pudo obtener datos de la reserva'
            });
            continue;
          }

          const gscontrolId = syncToGSControl({
            type: 'income',
            amount: Number(payment.monto),
            description: `${payment.concepto} - Reserva #${payment.booking.booking_number}`,
            date: payment.fecha_pago,
            paymentMethod: payment.metodo_pago,
            bookingId: payment.booking_id,
            customerId: payment.booking.customer_id || undefined,
            documentType: 'NO APLICA'
          });

          if (gscontrolId) {
            // Actualizar el registro con el ID de GSControl
            await prisma.bookingPayments.update({
              where: { id: payment.id },
              data: { gscontrol_id: gscontrolId }
            });

            results.success++;
            results.details.push({
              type: 'payment',
              id: payment.id,
              bookingNumber: payment.booking.booking_number,
              amount: Number(payment.monto),
              status: 'success',
              gscontrolId
            });
          } else {
            results.errors++;
            results.details.push({
              type: 'payment',
              id: payment.id,
              status: 'error',
              message: 'No se obtuvo ID de GSControl'
            });
          }
        } catch (error: any) {
          results.errors++;
          results.details.push({
            type: 'payment',
            id: payment.id,
            status: 'error',
            message: error.message
          });
          console.error(`❌ Error sincronizando pago ${payment.id}:`, error);
        }
      }
    }

    // Sincronizar gastos de mantenimiento
    if (type === 'expenses' || type === 'all') {
      console.log('🔄 Sincronizando gastos de mantenimiento históricos...');
      
      const maintenanceExpenses = await prisma.carRentalMaintenanceExpenses.findMany({
        include: {
          maintenance: {
            include: {
              car: true
            }
          }
        },
        orderBy: {
          purchase_date: 'asc'
        }
      });

      console.log(`📊 Total de gastos de mantenimiento a sincronizar: ${maintenanceExpenses.length}`);

      for (const expense of maintenanceExpenses) {
        try {
          // Verificar si ya existe gscontrol_id
          if (expense.gscontrol_id) {
            results.skipped++;
            results.details.push({
              type: 'expense',
              id: expense.id,
              status: 'skipped',
              message: 'Ya sincronizado previamente'
            });
            continue;
          }

          // Sincronizar a GSControl
          const gscontrolId = syncToGSControl({
            type: 'expense',
            amount: Number(expense.total_price),
            description: expense.description || `${expense.item_name} - ${expense.maintenance.car.registration_number}`,
            date: expense.purchase_date || expense.created_at,
            paymentMethod: 'TRANSFERENCIA',
            vehicleId: expense.maintenance.car_id,
            category: expense.expense_category,
            documentType: expense.invoice_number ? 'FACTURA' : 'NO APLICA'
          });

          if (gscontrolId) {
            // Actualizar el registro con el ID de GSControl
            await prisma.carRentalMaintenanceExpenses.update({
              where: { id: expense.id },
              data: { gscontrol_id: gscontrolId }
            });

            results.success++;
            results.details.push({
              type: 'expense',
              id: expense.id,
              amount: Number(expense.total_price),
              status: 'success',
              gscontrolId
            });
          } else {
            results.errors++;
            results.details.push({
              type: 'expense',
              id: expense.id,
              status: 'error',
              message: 'No se obtuvo ID de GSControl'
            });
          }
        } catch (error: any) {
          results.errors++;
          results.details.push({
            type: 'expense',
            id: expense.id,
            status: 'error',
            message: error.message
          });
          console.error(`❌ Error sincronizando gasto ${expense.id}:`, error);
        }
      }

      // Sincronizar gastos generales
      console.log('🔄 Sincronizando gastos generales históricos...');
      
      const generalExpenses = await prisma.carRentalGastos.findMany({
        include: {
          vehicle: true
        },
        orderBy: {
          fecha: 'asc'
        }
      });

      console.log(`📊 Total de gastos generales a sincronizar: ${generalExpenses.length}`);

      for (const gasto of generalExpenses) {
        try {
          // Verificar si ya existe gscontrol_id
          if (gasto.gscontrol_id) {
            results.skipped++;
            results.details.push({
              type: 'expense_general',
              id: gasto.id,
              status: 'skipped',
              message: 'Ya sincronizado previamente'
            });
            continue;
          }

          // Sincronizar a GSControl
          const gscontrolId = syncToGSControl({
            type: 'expense',
            amount: Number(gasto.total),
            description: `${gasto.categoria} - ${gasto.descripcion}`,
            date: gasto.fecha,
            paymentMethod: gasto.metodo_pago,
            vehicleId: gasto.vehicle_id || undefined,
            category: gasto.categoria,
            documentType: gasto.tipo_documento === 'FACTURA' ? 'FACTURA' : 'NO APLICA'
          });

          if (gscontrolId) {
            // Actualizar el registro con el ID de GSControl
            await prisma.carRentalGastos.update({
              where: { id: gasto.id },
              data: { gscontrol_id: gscontrolId }
            });

            results.success++;
            results.details.push({
              type: 'expense_general',
              id: gasto.id,
              amount: Number(gasto.total),
              status: 'success',
              gscontrolId
            });
          } else {
            results.errors++;
            results.details.push({
              type: 'expense_general',
              id: gasto.id,
              status: 'error',
              message: 'No se obtuvo ID de GSControl'
            });
          }
        } catch (error: any) {
          results.errors++;
          results.details.push({
            type: 'expense_general',
            id: gasto.id,
            status: 'error',
            message: error.message
          });
          console.error(`❌ Error sincronizando gasto general ${gasto.id}:`, error);
        }
      }
    }

    console.log('✅ Sincronización histórica completada:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('❌ Error en sincronización histórica:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la sincronización' },
      { status: 500 }
    );
  }
}
