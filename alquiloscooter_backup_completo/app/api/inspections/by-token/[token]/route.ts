
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getFileUrl } from '@/lib/s3';

const prisma = new PrismaClient();

/**
 * Genera URL firmada de S3 con validez de 7 días
 */
async function getSignedUrlSafe(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    // URLs firmadas con validez de 7 días (604800 segundos)
    const signedUrl = await getFileUrl(path, 604800);
    return signedUrl;
  } catch (error) {
    console.error('Error generando URL firmada:', error);
    return null;
  }
}

/**
 * API endpoint público para obtener inspecciones por token
 * GET /api/inspections/by-token/[token]
 * No requiere autenticación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Buscar el enlace de inspección
    const inspectionLink = await prisma.inspectionLink.findUnique({
      where: {
        token: token
      },
      include: {
        booking: {
          include: {
            customer: true,
            vehicles: {
              include: {
                car: true
              }
            },
            inspections: {
              include: {
                vehicle: true,
                damages: true,
                extras: true
              },
              orderBy: {
                inspection_date: 'asc'
              }
            }
          }
        }
      }
    });

    // Verificar que el enlace existe
    if (!inspectionLink) {
      return NextResponse.json(
        { error: 'Enlace de inspección no válido' },
        { status: 404 }
      );
    }

    // Verificar que el enlace no ha expirado
    if (new Date() > inspectionLink.expires_at) {
      return NextResponse.json(
        { error: 'El enlace de inspección ha expirado' },
        { status: 410 } // 410 Gone
      );
    }

    // Verificar que la reserva está activa o completada
    const booking = inspectionLink.booking;
    if (!['confirmed', 'active', 'completed'].includes(booking.status || '')) {
      return NextResponse.json(
        { error: 'Esta reserva ya no está disponible' },
        { status: 404 }
      );
    }

    // Convertir fotos de inspección a URLs firmadas (válidas 7 días)
    const inspectionsWithSignedUrls = await Promise.all(
      booking.inspections.map(async (inspection) => {
        // Convertir fotos principales usando URLs firmadas
        const frontUrl = await getSignedUrlSafe(inspection.front_photo);
        const leftUrl = await getSignedUrlSafe(inspection.left_photo);
        const rearUrl = await getSignedUrlSafe(inspection.rear_photo);
        const rightUrl = await getSignedUrlSafe(inspection.right_photo);
        const odometerUrl = await getSignedUrlSafe(inspection.odometer_photo);

        // Convertir fotos de daños
        const damagesWithSignedUrls = await Promise.all(
          inspection.damages.map(async (d) => ({
            description: d.description,
            severity: d.severity,
            location: d.location,
            photo_url: await getSignedUrlSafe(d.photo_url)
          }))
        );

        return {
          id: inspection.id,
          type: inspection.inspection_type,
          date: inspection.inspection_date,
          vehicle_id: inspection.vehicle_id,
          vehicle: inspection.vehicle ? {
            make: inspection.vehicle.make,
            model: inspection.vehicle.model,
            registration: inspection.vehicle.registration_number
          } : null,
          photos: {
            front: frontUrl,
            left: leftUrl,
            rear: rearUrl,
            right: rightUrl,
            odometer: odometerUrl
          },
          odometer_reading: inspection.odometer_reading,
          fuel_level: inspection.fuel_level,
          general_condition: inspection.general_condition,
          notes: inspection.notes,
          damages: damagesWithSignedUrls,
          extras: inspection.extras.map(e => ({
            description: e.description,
            quantity: e.quantity || 1,
            extra_type: e.extra_type
          }))
        };
      })
    );

    // Retornar datos de inspección
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,  // Agregado para poder usar el endpoint HTML
        booking_number: booking.booking_number,
        pickup_date: booking.pickup_date,
        return_date: booking.return_date,
        status: booking.status,
        customer: {
          name: booking.customer_name,
          email: booking.customer_email,
          phone: booking.customer_phone
        },
        vehicles: booking.vehicles.map(v => ({
          id: v.car_id,
          make: v.car?.make,
          model: v.car?.model,
          registration: v.car?.registration_number
        })),
        inspections: inspectionsWithSignedUrls
      },
      expires_at: inspectionLink.expires_at
    });

  } catch (error) {
    console.error('Error obteniendo inspección por token:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de inspección' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
