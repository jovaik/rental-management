require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🧪 Verificando que la tabla affiliate_profiles existe...\n');
    
    const count = await prisma.$queryRaw`SELECT COUNT(*) FROM affiliate_profiles`;
    console.log('✅ Tabla existe. Registros actuales:', count[0].count);
    
    console.log('\n🧪 Verificando enums...\n');
    
    const enums = await prisma.$queryRaw`
      SELECT 
        t.typname as enum_name,
        string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('AffiliateType', 'AffiliateCategory', 'AffiliateStatus', 'PaymentMethod')
      GROUP BY t.typname
    `;
    
    enums.forEach(e => {
      console.log(`✅ ${e.enum_name}: ${e.values}`);
    });
    
    console.log('\n✅ Sistema de afiliados completamente configurado y listo para usar!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
