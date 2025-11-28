const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function configureReviewLink() {
  try {
    const config = await prisma.companyConfig.findFirst({
      where: { active: true }
    })
    
    if (!config) {
      console.log('❌ No se encontró configuración activa')
      return
    }
    
    console.log('📋 Configuración actual:')
    console.log('  Review Link:', config.google_review_link || 'NO CONFIGURADO')
    
    // Configurar el enlace de Opinas.es
    await prisma.companyConfig.update({
      where: { id: config.id },
      data: {
        google_review_link: 'https://opinas.es/alquiloscootermarbel'
      }
    })
    
    console.log('\n✅ Enlace de reseñas configurado: https://opinas.es/alquiloscootermarbel')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

configureReviewLink()
