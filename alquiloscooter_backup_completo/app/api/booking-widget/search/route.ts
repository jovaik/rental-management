
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getFileUrl } from "@/lib/s3";

const prisma = new PrismaClient();

async function searchVehicles(pickupDate: string, returnDate: string, carType?: string) {
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);

  // Get all active vehicles
  let vehiclesQuery: any = {
    status: "T",
  };

  if (carType && carType !== "all") {
    vehiclesQuery.car_type_id = parseInt(carType);
  }

  const vehicles = await prisma.carRentalCars.findMany({
    where: vehiclesQuery,
    include: {
      pricingGroup: true,
      bookings: {
        where: {
          OR: [
            {
              AND: [
                // ✅ CERO MARGEN: Si reserva termina a las 13:00, otra puede empezar a las 13:00
                { pickup_date: { lt: returnD } },  // pickup antes del return solicitado
                { return_date: { gt: pickup } },   // return después del pickup solicitado
              ],
            },
          ],
          status: { in: ["confirmed", "pending", "active"] },
          // IMPORTANTE: Excluimos 'completed', 'cancelled', 'request' ya que no bloquean disponibilidad
        },
      },
    },
  });

  // Get unique make+model combinations to fetch photos
  const makeModelPairs = vehicles
    .filter((v) => v.make && v.model)
    .map((v) => ({ make: v.make!.toUpperCase(), model: v.model!.toUpperCase() }));

  // Fetch model photos for all vehicles (efficiently with a single query)
  const modelPhotos = await prisma.vehicleModelPhotos.findMany({
    where: {
      OR: makeModelPairs.map((pair) => ({
        make: pair.make,
        model: pair.model,
      })),
    },
    orderBy: [
      { is_primary: 'desc' },
      { photo_order: 'asc' }
    ]
  });

  // Create a map of make+model -> photos
  const photosMap = new Map<string, typeof modelPhotos>();
  modelPhotos.forEach((photo) => {
    const key = `${photo.make}_${photo.model}`;
    if (!photosMap.has(key)) {
      photosMap.set(key, []);
    }
    photosMap.get(key)!.push(photo);
  });

  // Filter out booked vehicles and calculate prices
  const availableVehicles = await Promise.all(
    vehicles
      .filter((vehicle) => vehicle.bookings.length === 0)
      .map(async (vehicle) => {
        const days = Math.ceil(
          (returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)
        );

        let pricePerDay = 50; // Default price
        if (vehicle.pricingGroup?.price_1_3_days) {
          pricePerDay = Number(vehicle.pricingGroup.price_1_3_days);
        }

        const totalPrice = pricePerDay * days;

        // Get model photos
        const modelKey = `${vehicle.make?.toUpperCase()}_${vehicle.model?.toUpperCase()}`;
        const vehiclePhotos = photosMap.get(modelKey) || [];
        const primaryPhoto = vehiclePhotos.find(p => p.is_primary);
        const firstPhoto = primaryPhoto || vehiclePhotos[0];
        
        // Generate signed URLs for all photos
        let signedImageUrl = null;
        let signedImages: string[] = [];
        
        try {
          if (firstPhoto?.photo_url) {
            signedImageUrl = await getFileUrl(firstPhoto.photo_url, 604800); // 7 días
          }
          
          if (vehiclePhotos.length > 0) {
            const urls = await Promise.all(
              vehiclePhotos.map(async (photo) => {
                try {
                  return await getFileUrl(photo.photo_url, 604800); // 7 días
                } catch (error) {
                  console.error(`Error generating signed URL for ${photo.photo_url}:`, error);
                  return null;
                }
              })
            );
            // Filtrar nulls
            signedImages = urls.filter((url): url is string => url !== null);
          }
        } catch (error) {
          console.error('Error generating signed URLs:', error);
        }
        
        return {
          id: vehicle.id,
          make: vehicle.make || "Desconocido",
          model: vehicle.model || "Desconocido",
          brand: vehicle.make || "Desconocido",
          year: vehicle.year || new Date().getFullYear(),
          plate: vehicle.registration_number || "",
          registration_number: vehicle.registration_number || "",
          category: "Scooter",
          car_type: "Scooter",
          imageUrl: signedImageUrl,
          image: signedImageUrl,
          images: signedImages, // Todas las fotos del modelo con URLs firmadas
          pricePerDay,
          totalPrice,
          days,
          available: true,
          capacity: vehicle.seating_capacity || 2,
          features: {
            passengers: vehicle.seating_capacity || 2,
            transmission: vehicle.transmission_type || "Automático",
            fuelType: vehicle.fuel_type || "Eléctrico",
          },
        };
      })
  );

  return availableVehicles;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pickupDate = searchParams.get("pickupDate");
    const returnDate = searchParams.get("returnDate");
    const carType = searchParams.get("carType");

    if (!pickupDate || !returnDate) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
    }

    const availableVehicles = await searchVehicles(pickupDate, returnDate, carType || undefined);
    return NextResponse.json(availableVehicles);
  } catch (error) {
    console.error("Error searching vehicles:", error);
    return NextResponse.json(
      { error: "Error al buscar vehículos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickupDate, returnDate, carType } = body;

    if (!pickupDate || !returnDate) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
    }

    const availableVehicles = await searchVehicles(pickupDate, returnDate, carType);
    return NextResponse.json({ vehicles: availableVehicles });
  } catch (error) {
    console.error("Error searching vehicles:", error);
    return NextResponse.json(
      { error: "Error al buscar vehículos" },
      { status: 500 }
    );
  }
}
