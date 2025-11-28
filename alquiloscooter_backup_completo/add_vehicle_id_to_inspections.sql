-- Agregar columna vehicle_id a vehicle_inspections para soporte multivehículo
-- Esta migración es SEGURA: vehicle_id es nullable, no afecta datos existentes

BEGIN;

-- 1. Agregar columna vehicle_id (nullable)
ALTER TABLE vehicle_inspections 
ADD COLUMN IF NOT EXISTS vehicle_id INTEGER;

-- 2. Agregar foreign key constraint a car_rental_cars
ALTER TABLE vehicle_inspections
ADD CONSTRAINT vehicle_inspections_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) 
REFERENCES car_rental_cars(id) 
ON DELETE SET NULL;

-- 3. Crear índice para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id 
ON vehicle_inspections(vehicle_id);

-- 4. Intentar asignar vehicle_id a inspecciones existentes de reservas con 1 solo vehículo
-- Para reservas con 1 vehículo, asignar automáticamente
UPDATE vehicle_inspections vi
SET vehicle_id = bv.car_id
FROM (
  SELECT DISTINCT ON (booking_id) booking_id, car_id
  FROM booking_vehicles
  WHERE car_id IS NOT NULL
  GROUP BY booking_id, car_id
  HAVING COUNT(*) = 1
) bv
WHERE vi.booking_id = bv.booking_id 
AND vi.vehicle_id IS NULL;

COMMIT;

-- Verificación
SELECT 
  COUNT(*) as total_inspecciones,
  COUNT(vehicle_id) as con_vehicle_id,
  COUNT(*) - COUNT(vehicle_id) as sin_vehicle_id
FROM vehicle_inspections;

