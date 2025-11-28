require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  // Buscar el registro problemático
  const expense = await prisma.carRentalMaintenanceExpenses.findUnique({
    where: { id: 10 },
    include: { maintenance: { include: { car: true } } }
  });

  if (expense) {
    console.log('📋 Registro con problema:', {
      id: expense.id,
      total_price: expense.total_price,
      type: typeof expense.total_price,
      isNull: expense.total_price === null
    });

    // Si el amount es null o 0, poner un valor por defecto
    if (!expense.total_price || expense.total_price === 0) {
      console.log('🔧 Corrigiendo...');
      await prisma.carRentalMaintenanceExpenses.update({
        where: { id: 10 },
        data: { total_price: 10.0 } // Valor mínimo
      });
      console.log('✅ Corregido');
    }
  }

  // Actualizar los registros exitosos con sus externalIds
  console.log('\n💾 Actualizando registros exitosos...');

  const successIds = [
    "cmhe389bw0037ml08i6cy8xz7",
    "cmhe389c00039ml08my43cz7y",
    "cmhe389c3003bml08fufj76oi",
    "cmhe389c5003dml086v01l2jb",
    "cmhe389c8003fml08klejg061",
    "cmhe389ca003hml08y7pf3qip",
    "cmhe389cd003jml08ckeqlqcs",
    "cmhe389cf003lml082d6krisg",
    "cmhe389ci003nml08089rkgzu0w"
  ];

  // Los externalIds que enviamos
  const externalIds = [
    "booking_2025_000006",
    "booking_2025_000007",
    "booking_2025_000008",
    "booking_2025_000009",
    "booking_2025_000010",
    "maintenance_expense_2025_000006",
    "maintenance_expense_2025_000007",
    "maintenance_expense_2025_000008",
    "maintenance_expense_2025_000009"
  ];

  for (let i = 0; i < externalIds.length && i < successIds.length; i++) {
    const externalId = externalIds[i];
    const gscontrolId = externalId; // Usar externalId como identificador

    if (externalId.startsWith('booking_')) {
      const bookingId = parseInt(externalId.split('_')[2]);
      await prisma.bookingPayments.updateMany({
        where: { 
          booking_id: bookingId,
          gscontrol_id: null
        },
        data: { gscontrol_id: externalId }
      });
      console.log(`✅ Actualizado pago de booking ${bookingId}`);
    } else if (externalId.startsWith('maintenance_expense_')) {
      const expenseId = parseInt(externalId.split('_')[3]);
      await prisma.carRentalMaintenanceExpenses.update({
        where: { id: expenseId },
        data: { gscontrol_id: externalId }
      });
      console.log(`✅ Actualizado gasto de mantenimiento ${expenseId}`);
    }
  }

  console.log('\n✅ ACTUALIZACIÓN COMPLETADA');
  await prisma.$disconnect();
}

fix().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
});
