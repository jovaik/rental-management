import { prisma } from './lib/db'

async function main() {
  try {
    const config = await prisma.companyConfig.findFirst({
      where: { active: true },
      select: {
        smtp_host: true,
        smtp_port: true,
        smtp_user: true,
        smtp_password: true,
        company_email: true,
        google_review_link: true,
      }
    })
    
    console.log('==== DIAGNÓSTICO CONFIGURACIÓN ====\n')
    
    if (!config) {
      console.log('❌ NO HAY CONFIGURACIÓN DE EMPRESA EN LA BASE DE DATOS')
      return
    }
    
    // Check SMTP
    console.log('📧 CONFIGURACIÓN EMAIL/SMTP:')
    console.log('  smtp_host:', config.smtp_host || '❌ NO CONFIGURADO')
    console.log('  smtp_port:', config.smtp_port || '❌ NO CONFIGURADO')
    console.log('  smtp_user:', config.smtp_user || '❌ NO CONFIGURADO')
    console.log('  smtp_password:', config.smtp_password ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO')
    console.log('  company_email:', config.company_email || '❌ NO CONFIGURADO')
    
    const smtpOk = !!(config.smtp_host && config.smtp_user && config.smtp_password)
    console.log('\n  ESTADO:', smtpOk ? '✅ EMAIL PUEDE FUNCIONAR' : '❌ EMAIL NO FUNCIONARÁ')
    
    // Check Google Review Link
    console.log('\n⭐ CONFIGURACIÓN RESEÑAS:')
    console.log('  google_review_link:', config.google_review_link || '❌ NO CONFIGURADO')
    console.log('  ESTADO:', config.google_review_link ? '✅ RESEÑAS PUEDEN FUNCIONAR' : '❌ RESEÑAS NO FUNCIONARÁN')
    
    // Resumen
    console.log('\n==== RESUMEN ====')
    if (!smtpOk) {
      console.log('❌ Los emails NO funcionarán (falta configuración SMTP)')
    }
    if (!config.google_review_link) {
      console.log('❌ Las solicitudes de reseña NO funcionarán (falta enlace de Google)')
    }
    if (smtpOk && config.google_review_link) {
      console.log('✅ Todo configurado correctamente')
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
