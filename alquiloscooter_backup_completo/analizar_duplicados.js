
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 ANÁLISIS COMPLETO DE DUPLICADOS - TODAS LAS RESERVAS\n');
  console.log('=' .repeat(80) + '\n');
  
  // Obtener TODAS las reservas
  const allReservas = await prisma.carRentalBookings.findMany({
    include: {
      customer: true,
      vehicles: {
        include: {
          car: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });
  
  console.log(`📊 TOTAL RESERVAS EN LA BASE DE DATOS: ${allReservas.length}\n`);
  
  // Agrupar por cliente + vehículo + fecha para detectar duplicados
  const grupos = new Map();
  
  allReservas.forEach(r => {
    if (!r.customer_id || !r.vehicles[0]?.car_id || !r.pickup_date) return;
    
    // Clave: cliente + vehículo + día de recogida
    const key = `${r.customer_id}-${r.vehicles[0].car_id}-${r.pickup_date.toISOString().split('T')[0]}`;
    
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key).push(r);
  });
  
  // Filtrar solo grupos con más de 1 reserva (duplicados)
  const duplicados = Array.from(grupos.values()).filter(g => g.length > 1);
  
  console.log(`🔄 GRUPOS DE DUPLICADOS ENCONTRADOS: ${duplicados.length}\n`);
  console.log('=' .repeat(80) + '\n');
  
  // Preparar lista de IDs a eliminar (solo Rodeeo)
  const idsRodeeoAEliminar = [];
  
  duplicados.forEach((grupo, i) => {
    console.log(`\n--- GRUPO ${i + 1} ---`);
    console.log(`Cliente: ${grupo[0].customer?.first_name || 'SIN NOMBRE'} ${grupo[0].customer?.last_name || ''}`);
    console.log(`Email: ${grupo[0].customer?.email || 'SIN EMAIL'}`);
    console.log(`Vehículo: ${grupo[0].vehicles[0]?.car?.registration_number || 'SIN VEHÍCULO'}`);
    console.log(`Fecha: ${grupo[0].pickup_date?.toISOString().split('T')[0] || 'SIN FECHA'}\n`);
    
    let manualId = null;
    let rodeeoIds = [];
    
    grupo.forEach(r => {
      const esRodeeo = r.booking_number?.match(/^[A-F0-9]{8}$/);
      const origen = esRodeeo ? '📥 RODEEO' : '✍️  MANUAL';
      const hora = r.pickup_date?.toISOString().substring(11, 16) || 'SIN HORA';
      
      console.log(`  #${r.id} | ${r.booking_number || 'SIN NUM'} | ${origen} | ${hora} | €${r.total_price}`);
      
      if (esRodeeo) {
        rodeeoIds.push(r.id);
      } else {
        manualId = r.id;
      }
    });
    
    // Añadir IDs de Rodeeo a la lista de eliminación
    idsRodeeoAEliminar.push(...rodeeoIds);
    
    console.log(`\n  ➡️  ACCIÓN: Eliminar Rodeeo IDs: [${rodeeoIds.join(', ')}], MANTENER Manual ID: ${manualId}`);
  });
  
  console.log(`\n\n${'=' .repeat(80)}`);
  console.log('📋 RESUMEN DE ELIMINACIÓN:\n');
  console.log(`   Total grupos duplicados: ${duplicados.length}`);
  console.log(`   Total reservas a ELIMINAR (Rodeeo): ${idsRodeeoAEliminar.length}`);
  console.log(`   Total reservas a MANTENER (Manual): ${duplicados.length}\n`);
  
  console.log('🗑️  IDs DE RODEEO A ELIMINAR:\n');
  console.log(`   [${idsRodeeoAEliminar.join(', ')}]\n`);
  
  await prisma.$disconnect();
})();
