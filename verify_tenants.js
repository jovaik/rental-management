const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_giGslv78NtrJ@ep-red-waterfall-aex88kcu-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  console.log('🔍 Verificando tenants en Neon...\n');
  
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        location: true,
        logo: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`✅ Tenants encontrados: ${tenants.length}\n`);
    
    if (tenants.length > 0) {
      console.log('Detalles de los tenants:');
      tenants.forEach((tenant, index) => {
        console.log(`\n${index + 1}. ${tenant.name}`);
        console.log(`   - ID: ${tenant.id}`);
        console.log(`   - Subdomain: ${tenant.subdomain}`);
        console.log(`   - Location: ${tenant.location || 'N/A'}`);
        console.log(`   - Logo: ${tenant.logo || 'N/A'}`);
        console.log(`   - Creado: ${tenant.createdAt}`);
      });
    } else {
      console.log('⚠️  No se encontraron tenants en la base de datos.');
      console.log('Esto explica el error "tenant no encontrado".');
    }
    
  } catch (error) {
    console.error('❌ Error al consultar tenants:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
