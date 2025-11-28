
-- Eliminar columnas redundantes de texto libre
ALTER TABLE car_rental_cars DROP COLUMN IF EXISTS owner_name;
ALTER TABLE car_rental_cars DROP COLUMN IF EXISTS owner_contact;
