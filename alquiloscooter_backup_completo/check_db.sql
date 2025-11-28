-- Verificar estado de sincronización
SELECT 
  'Pagos' as tipo,
  COUNT(*) as total,
  COUNT(gscontrol_id) as sincronizados,
  COUNT(*) - COUNT(gscontrol_id) as pendientes
FROM "booking_payments"
UNION ALL
SELECT 
  'Gastos Mantenimiento' as tipo,
  COUNT(*) as total,
  COUNT(gscontrol_id) as sincronizados,
  COUNT(*) - COUNT(gscontrol_id) as pendientes
FROM "car_rental_maintenance_expenses"
UNION ALL
SELECT 
  'Gastos Generales' as tipo,
  COUNT(*) as total,
  COUNT(gscontrol_id) as sincronizados,
  COUNT(*) - COUNT(gscontrol_id) as pendientes
FROM "car_rental_gastos";
