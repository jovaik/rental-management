
/**
 * 🛴 TAREA 2: SINCRONIZACIÓN PERIÓDICA COMPLETA
 * ⚠️  INSTRUCCIONES EXACTAS DEL PDF - ACTUALIZADO CON FACTURAS, TICKETS Y GASTOS
 * 
 * Este script se ejecuta cada 5 minutos en el servidor backend
 * Envía TODAS las transacciones (ingresos y gastos) a GSControl para mantener sincronización
 * 
 * ✅ Incluye campos del PDF 2:
 *    - documentType (FACTURA/TICKET)
 *    - invoiceNumber
 *    - clientName, clientDni
 *    - costCategory (para gastos)
 */

// Cargar variables de entorno
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuración fija según instrucciones del PDF
const GSCONTROL_API_KEY = 'gs_69c6c837fac5c6ac12f40efcc44b55e9d2c97d61d3143933aa7390d14683d944';
const GSCONTROL_BASE_URL = 'https://gscontrol.abacusai.app';

async function sincronizacionCompletaGSControl() {
  try {
    console.log('🔄 Iniciando sincronización completa con GS Control...');

    // 1. OBTENER TODAS las transacciones de AlquiloScooter
    // 1.1 INGRESOS: Buscamos reservas confirmadas y completadas
    const todasLasReservas = await prisma.carRentalBookings.findMany({
      where: {
        status: {
          in: ['confirmed', 'completed']
        },
        // Opcional: Solo del año actual
        pickup_date: {
          gte: new Date('2025-01-01')
        }
      },
      include: {
        customer: true,
        car: true
      }
    });

    // 1.2 GASTOS: Obtener todos los gastos del año actual
    const todosLosGastos = await prisma.carRentalGastos.findMany({
      where: {
        fecha: {
          gte: new Date('2025-01-01')
        }
      },
      include: {
        vehicle: true,
        supplier: true
      }
    });

    // 2. FORMATEAR al formato de GS Control
    const transaccionesFormateadas = todasLasReservas.map(reserva => {
      // Obtener información del cliente
      const customerName = reserva.customer?.first_name 
        ? `${reserva.customer.first_name} ${reserva.customer.last_name || ''}`.trim()
        : reserva.customer_name || 'Cliente';

      // Descripción de la reserva
      const vehicleInfo = reserva.car?.registration_number 
        ? `${reserva.car.make} ${reserva.car.model} (${reserva.car.registration_number})`
        : 'Vehículo';
      
      const descripcion = `Reserva #${reserva.booking_number || reserva.id} - ${customerName} - ${vehicleInfo}`;

      // ✅ ACTUALIZACIÓN: Incluir campos de facturas/tickets (PDF 2)
      const transaction = {
        externalId: reserva.id.toString(),
        type: "INGRESO",
        date: reserva.pickup_date.toISOString().split('T')[0],
        amount: reserva.total_price || 0,
        description: descripcion,
        ivaRate: 21,
        // Tipo de documento (la mayoría son tickets)
        documentType: "TICKET"
      };

      // Si tiene datos del cliente, agregarlos
      if (reserva.customer?.first_name) {
        transaction.clientName = customerName;
      }
      if (reserva.customer?.dni_nie) {
        transaction.clientDni = reserva.customer.dni_nie;
      }

      return transaction;
    });

    // 2.2 GASTOS: Formatear gastos según PDF 2
    const EXPENSE_CATEGORY_MAP = {
      'Mantenimiento': 'TALLERES',
      'Combustible': 'COMBUSTIBLE',
      'Seguros': 'SEGUROS',
      'Impuestos': 'GESTORIA',
      'Repuestos': 'REPUESTOS',
      'Otros': 'OTROS GASTOS'
    };

    const gastosFormateados = todosLosGastos.map(gasto => {
      const vehicleInfo = gasto.vehicle?.registration_number 
        ? ` - ${gasto.vehicle.make} ${gasto.vehicle.model} (${gasto.vehicle.registration_number})`
        : '';
      
      const descripcion = `${gasto.categoria} - ${gasto.descripcion}${vehicleInfo}`;

      const gastoTx = {
        externalId: `gasto_${gasto.id}`, // Prefijo para distinguir de reservas
        type: "GASTO",
        date: gasto.fecha.toISOString().split('T')[0],
        amount: gasto.total || 0,
        description: descripcion,
        ivaRate: gasto.iva_porcentaje || 21,
        // ✅ Categoría del gasto (PDF 2)
        costCategory: EXPENSE_CATEGORY_MAP[gasto.categoria] || 'OTROS GASTOS'
      };

      // Si es factura, agregar campos adicionales
      if (gasto.tipo_documento === 'FACTURA' && gasto.numero_factura) {
        gastoTx.documentType = 'FACTURA';
        gastoTx.invoiceNumber = gasto.numero_factura;
        if (gasto.supplier?.name) {
          gastoTx.clientName = gasto.supplier.name;
        }
        if (gasto.proveedor_cif) {
          gastoTx.clientDni = gasto.proveedor_cif;
        }
      }

      return gastoTx;
    });

    // 3. COMBINAR INGRESOS Y GASTOS
    const todasLasTransacciones = [...transaccionesFormateadas, ...gastosFormateados];

    console.log(`📊 Total de transacciones a sincronizar: ${todasLasTransacciones.length} (${transaccionesFormateadas.length} ingresos + ${gastosFormateados.length} gastos)`);

    if (todasLasTransacciones.length === 0) {
      console.log('ℹ️  No hay transacciones para sincronizar');
      return;
    }

    // 4. ENVIAR TODO a GS Control
    const response = await fetch(`${GSCONTROL_BASE_URL}/api/integrations/pull`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GSCONTROL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactions: todasLasTransacciones
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en sincronización completa:', response.status, errorText);
    } else {
      const resultado = await response.json();
      console.log('✅ Sincronización completa exitosa:', resultado);
    }
  } catch (error) {
    console.error('❌ Error fatal en sincronización:', error);
  }
}

// EJECUTAR INMEDIATAMENTE al iniciar el script
sincronizacionCompletaGSControl();

// EJECUTAR CADA 5 MINUTOS
setInterval(sincronizacionCompletaGSControl, 5 * 60 * 1000);

console.log('⏰ Script de sincronización periódica iniciado. Se ejecutará cada 5 minutos.');
