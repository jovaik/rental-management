
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🏢 Inicializando configuración de empresa...')

  // Verificar si ya existe una configuración
  const existingConfig = await prisma.companyConfig.findFirst()

  if (existingConfig) {
    console.log('✅ Ya existe una configuración de empresa')
    console.log('Datos actuales:', {
      nombre: existingConfig.company_name,
      nif: existingConfig.company_nif,
      email: existingConfig.company_email,
    })
    return
  }

  // Crear configuración por defecto
  const config = await prisma.companyConfig.create({
    data: {
      company_name: 'Alquilo Scooter',
      company_nif: 'B12345678',
      company_address: 'Calle Ejemplo 123',
      company_city: 'Málaga, 29001',
      company_phone: '+34 600 000 000',
      company_email: 'info@alquiloscooter.com',
      company_website: 'https://alquiloscooter.com',
      primary_color: '#2563eb',
      secondary_color: '#1e40af',
      factura_prefix: 'FACT',
      ticket_prefix: 'TICK',
      factura_series: '2025',
      iva_rate: 0.21,
      invoice_footer_text: 'Gracias por confiar en nosotros. Para cualquier consulta, contacte con nosotros.',
      terms_and_conditions: 'Condiciones generales de alquiler...',
      active: true,
    },
  })

  console.log('✅ Configuración de empresa creada correctamente')
  console.log('Datos creados:', {
    id: config.id,
    nombre: config.company_name,
    nif: config.company_nif,
    email: config.company_email,
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
