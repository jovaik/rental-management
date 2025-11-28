require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICACIÓN FINAL DE SINCRONIZACIÓN');
  console.log('='.repeat(80) + '\n');

  // PAGOS
  const totalPayments = await prisma.bookingPayments.count();
  const syncedPayments = await prisma.bookingPayments.count({
    where: { gscontrol_id: { not: null } }
  });

  console.log('💰 PAGOS:');
  console.log(`   Total: ${totalPayments}`);
  console.log(`   Sincronizados: ${syncedPayments}`);
  console.log(`   Pendientes: ${totalPayments - syncedPayments}`);
  console.log(`   Progreso: ${totalPayments > 0 ? ((syncedPayments / totalPayments) * 100).toFixed(1) : 0}%\n`);

  // GASTOS DE MANTENIMIENTO
  const totalMaintenance = await prisma.carRentalMaintenanceExpenses.count();
  const syncedMaintenance = await prisma.carRentalMaintenanceExpenses.count({
    where: { gscontrol_id: { not: null } }
  });

  console.log('🔧 GASTOS DE MANTENIMIENTO:');
  console.log(`   Total: ${totalMaintenance}`);
  console.log(`   Sincronizados: ${syncedMaintenance}`);
  console.log(`   Pendientes: ${totalMaintenance - syncedMaintenance}`);
  console.log(`   Progreso: ${totalMaintenance > 0 ? ((syncedMaintenance / totalMaintenance) * 100).toFixed(1) : 0}%\n`);

  // GASTOS GENERALES
  const totalExpenses = await prisma.carRentalGastos.count();
  const syncedExpenses = await prisma.carRentalGastos.count({
    where: { gscontrol_id: { not: null } }
  });

  console.log('💸 GASTOS GENERALES:');
  console.log(`   Total: ${totalExpenses}`);
  console.log(`   Sincronizados: ${syncedExpenses}`);
  console.log(`   Pendientes: ${totalExpenses - syncedExpenses}`);
  console.log(`   Progreso: ${totalExpenses > 0 ? ((syncedExpenses / totalExpenses) * 100).toFixed(1) : 0}%\n`);

  // TOTALES
  const totalRecords = totalPayments + totalMaintenance + totalExpenses;
  const totalSynced = syncedPayments + syncedMaintenance + syncedExpenses;
  const totalPending = totalRecords - totalSynced;

  console.log('='.repeat(80));
  console.log('📈 RESUMEN GENERAL:');
  console.log(`   Total registros: ${totalRecords}`);
  console.log(`   Sincronizados: ${totalSynced}`);
  console.log(`   Pendientes: ${totalPending}`);
  console.log(`   Progreso global: ${totalRecords > 0 ? ((totalSynced / totalRecords) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(80) + '\n');

  if (totalPending === 0) {
    console.log('🎉 ✅ SINCRONIZACIÓN 100% COMPLETA\n');
  } else {
    console.log(`⚠️  Aún hay ${totalPending} registros pendientes\n`);
  }

  await prisma.$disconnect();
}

verify().catch(err => {
  console.error('❌ ERROR:', err);
  prisma.$disconnect();
});
