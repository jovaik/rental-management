-- Agregar campos de Google Drive a CarRentalBookings
ALTER TABLE car_rental_bookings 
ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_folder_url TEXT;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bookings_google_drive_folder_id 
ON car_rental_bookings(google_drive_folder_id);

