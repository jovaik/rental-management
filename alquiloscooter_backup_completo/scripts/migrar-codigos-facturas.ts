
/**
 * Script para migrar códigos de facturas del formato antiguo al nuevo
 * 
 * Formato antiguo: 2025-001, 2025-002
 * Formato nuevo: TICK-2025-0001, FACT-2025-0001
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migración de códigos de facturas...\n')

  // Obtener todas las facturas
  const todasFacturas = await prisma.carRentalFacturas.findMany({
    orderBy: {
      created_at: 'asc'
    }
  })

  // Filtrar las que tienen formato antiguo (no empiezan con TICK- o FACT-)
  const facturasAntiguas = todasFacturas.filter(f => 
    !f.numero.startsWith('TICK-') && !f.numero.startsWith('FACT-')
  )

  console.log(`📊 Encontradas ${facturasAntiguas.length} facturas con formato antiguo\n`)

  if (facturasAntiguas.length === 0) {
    console.log('✅ No hay facturas por migrar')
    return
  }

  // Contadores por año y tipo
  const contadores: Record<string, Record<string, number>> = {}

  for (const factura of facturasAntiguas) {
    const año = new Date(factura.created_at).getFullYear()
    const tipo = factura.tipo
    const prefijo = tipo === 'FACTURA' ? 'FACT' : 'TICK'

    // Inicializar contador si no existe
    if (!contadores[año]) {
      contadores[año] = { FACT: 0, TICK: 0 }
    }

    // Incrementar contador
    contadores[año][prefijo] += 1
    const numero = contadores[año][prefijo]

    // Generar nuevo código
    const nuevoCodigo = `${prefijo}-${año}-${numero.toString().padStart(4, '0')}`

    console.log(`   ${factura.numero} → ${nuevoCodigo} (${tipo})`)

    // Actualizar en base de datos
    await prisma.carRentalFacturas.update({
      where: { id: factura.id },
      data: { numero: nuevoCodigo }
    })
  }

  console.log('\n✅ Migración completada exitosamente')
  console.log('\n📊 Resumen por año:')
  for (const [año, tipos] of Object.entries(contadores)) {
    console.log(`   ${año}:`)
    console.log(`      - Facturas (FACT): ${tipos.FACT}`)
    console.log(`      - Tickets (TICK): ${tipos.TICK}`)
  }
}

main()
  .catch((error) => {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
