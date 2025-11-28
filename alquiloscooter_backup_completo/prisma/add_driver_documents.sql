
-- Agregar campos de documentos a bookingDrivers
ALTER TABLE "BookingDrivers" 
ADD COLUMN IF NOT EXISTS "id_document_front" TEXT,
ADD COLUMN IF NOT EXISTS "id_document_back" TEXT,
ADD COLUMN IF NOT EXISTS "driving_license_front" TEXT,
ADD COLUMN IF NOT EXISTS "driving_license_back" TEXT;

-- Comentario de documentación
COMMENT ON COLUMN "BookingDrivers"."id_document_front" IS 'URL de S3 para documento de identidad (anverso)';
COMMENT ON COLUMN "BookingDrivers"."id_document_back" IS 'URL de S3 para documento de identidad (reverso)';
COMMENT ON COLUMN "BookingDrivers"."driving_license_front" IS 'URL de S3 para carnet de conducir (anverso)';
COMMENT ON COLUMN "BookingDrivers"."driving_license_back" IS 'URL de S3 para carnet de conducir (reverso)';
