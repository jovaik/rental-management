require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔄 Ejecutando migración...');
    
    // Ejecutar ALTER TABLE
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "booking_drivers" 
      ADD COLUMN IF NOT EXISTS "id_document_front" TEXT,
      ADD COLUMN IF NOT EXISTS "id_document_back" TEXT,
      ADD COLUMN IF NOT EXISTS "driving_license_front" TEXT,
      ADD COLUMN IF NOT EXISTS "driving_license_back" TEXT
    `);
    console.log('✅ Columnas agregadas exitosamente');
    
    // Ejecutar comentarios
    await prisma.$executeRawUnsafe(`COMMENT ON COLUMN "booking_drivers"."id_document_front" IS 'URL de S3 para documento de identidad (anverso)'`);
    await prisma.$executeRawUnsafe(`COMMENT ON COLUMN "booking_drivers"."id_document_back" IS 'URL de S3 para documento de identidad (reverso)'`);
    await prisma.$executeRawUnsafe(`COMMENT ON COLUMN "booking_drivers"."driving_license_front" IS 'URL de S3 para carnet de conducir (anverso)'`);
    await prisma.$executeRawUnsafe(`COMMENT ON COLUMN "booking_drivers"."driving_license_back" IS 'URL de S3 para carnet de conducir (reverso)'`);
    console.log('✅ Comentarios agregados exitosamente');
    
    console.log('\n✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
