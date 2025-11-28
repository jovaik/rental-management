\x
SELECT 
  b.booking_number,
  b.id as booking_id,
  v.make, 
  v.model, 
  v.registration,
  vi.id as inspection_id,
  vi.inspection_type,
  vi.inspection_date,
  vi.photo_front,
  vi.photo_left,
  vi.photo_rear,
  vi.photo_right,
  vi.photo_odometer
FROM car_rental_bookings b
JOIN booking_vehicles bv ON b.id = bv.booking_id
JOIN car_rental_cars v ON bv.vehicle_id = v.id
LEFT JOIN vehicle_inspections vi ON vi.booking_id = b.id AND vi.vehicle_id = v.id
WHERE b.booking_number = '202511110003'
ORDER BY vi.inspection_date;
