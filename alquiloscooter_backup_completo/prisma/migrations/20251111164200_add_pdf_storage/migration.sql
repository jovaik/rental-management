-- Add pdf_cloud_storage_path field to carRentalContracts table
ALTER TABLE "carRentalContracts" ADD COLUMN "pdf_cloud_storage_path" TEXT;

-- Add index for faster queries
CREATE INDEX "idx_contracts_pdf_path" ON "carRentalContracts"("pdf_cloud_storage_path");
