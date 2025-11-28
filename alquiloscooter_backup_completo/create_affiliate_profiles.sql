-- Crear enums
DO $$ BEGIN
    CREATE TYPE "AffiliateType" AS ENUM ('HOTEL', 'AGENCY', 'RESTAURANT', 'SHOP', 'INDIVIDUAL', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AffiliateCategory" AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'STANDARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AffiliateStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'CASH', 'CHECK', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla
CREATE TABLE IF NOT EXISTS "affiliate_profiles" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL UNIQUE,
    "business_name" TEXT NOT NULL,
    "contact_person_primary" TEXT NOT NULL,
    "contact_person_secondary" TEXT,
    "email_primary" TEXT NOT NULL,
    "email_secondary" TEXT,
    "phone_primary" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "address_street" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_postal_code" TEXT,
    "address_country" TEXT NOT NULL DEFAULT 'España',
    "tax_id" TEXT,
    "legal_name" TEXT,
    "fiscal_address_street" TEXT,
    "fiscal_address_city" TEXT,
    "fiscal_address_state" TEXT,
    "fiscal_address_postal_code" TEXT,
    "fiscal_address_country" TEXT,
    "affiliate_type" "AffiliateType" NOT NULL DEFAULT 'INDIVIDUAL',
    "affiliate_category" "AffiliateCategory" NOT NULL DEFAULT 'STANDARD',
    "commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "payment_method" "PaymentMethod",
    "bank_account" TEXT,
    "paypal_email" TEXT,
    "widget_custom_name" TEXT,
    "widget_show_branding" BOOLEAN NOT NULL DEFAULT true,
    "widget_custom_color" TEXT,
    "widget_custom_logo_url" TEXT,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    CONSTRAINT "affiliate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "car_rental_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Crear índices
CREATE INDEX IF NOT EXISTS "affiliate_profiles_affiliate_type_idx" ON "affiliate_profiles"("affiliate_type");
CREATE INDEX IF NOT EXISTS "affiliate_profiles_affiliate_category_idx" ON "affiliate_profiles"("affiliate_category");
CREATE INDEX IF NOT EXISTS "affiliate_profiles_status_idx" ON "affiliate_profiles"("status");

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_affiliate_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_affiliate_profiles_timestamp ON "affiliate_profiles";
CREATE TRIGGER update_affiliate_profiles_timestamp
    BEFORE UPDATE ON "affiliate_profiles"
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_profiles_updated_at();

