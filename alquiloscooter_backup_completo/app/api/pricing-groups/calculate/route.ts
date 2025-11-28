
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { car_id, pickup_datetime, return_datetime, include_insurance, season = 'normal' } = await request.json();

    // Get vehicle with its pricing group
    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: parseInt(car_id) },
      include: {
        pricingGroup: true
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (!vehicle.pricingGroup) {
      return NextResponse.json({ error: 'Vehicle does not have a pricing group assigned' }, { status: 400 });
    }

    const pricingGroup = vehicle.pricingGroup;

    // Calculate rental duration
    const pickup = new Date(pickup_datetime);
    const returnDate = new Date(return_datetime);
    const durationMs = returnDate.getTime() - pickup.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    const durationMonths = durationDays / 30;

    let basePrice = 0;
    let pricePerDay = 0;
    let rentalType = 'daily';

    // Determine pricing based on duration and season
    const minMonths = season === 'high' 
      ? pricingGroup.min_months_high_season 
      : pricingGroup.min_months_low_season;
    
    const monthlyPrice = season === 'high'
      ? pricingGroup.price_monthly_high
      : pricingGroup.price_monthly_low;

    if (durationMonths >= minMonths && monthlyPrice) {
      // Monthly/Annual subscription
      if (durationMonths >= (pricingGroup.min_months_full_year || 12) && pricingGroup.price_annual_full) {
        rentalType = 'annual';
        basePrice = Number(pricingGroup.price_annual_full) * Math.floor(durationMonths / 12);
        const remainingMonths = durationMonths % 12;
        if (remainingMonths > 0) {
          basePrice += Number(monthlyPrice) * remainingMonths;
        }
      } else {
        rentalType = 'monthly';
        basePrice = Number(monthlyPrice) * durationMonths;
      }
    } else {
      // Daily rental - use appropriate range based on season
      if (season === 'low') {
        // TEMPORADA BAJA: Usar precios directos si están definidos, sino usar precios de temporada alta con multiplicador
        if (durationDays >= 1 && durationDays <= 3) {
          pricePerDay = pricingGroup.price_1_3_days_low ? Number(pricingGroup.price_1_3_days_low) : Number(pricingGroup.price_1_3_days);
        } else if (durationDays >= 4 && durationDays <= 7) {
          pricePerDay = pricingGroup.price_4_7_days_low ? Number(pricingGroup.price_4_7_days_low) : Number(pricingGroup.price_4_7_days);
        } else {
          pricePerDay = pricingGroup.price_8_plus_days_low ? Number(pricingGroup.price_8_plus_days_low) : Number(pricingGroup.price_8_plus_days);
        }
      } else {
        // TEMPORADA ALTA o NORMAL: Usar precios de temporada alta
        if (durationDays >= 1 && durationDays <= 3) {
          pricePerDay = Number(pricingGroup.price_1_3_days);
        } else if (durationDays >= 4 && durationDays <= 7) {
          pricePerDay = Number(pricingGroup.price_4_7_days);
        } else {
          pricePerDay = Number(pricingGroup.price_8_plus_days);
        }
      }
      
      basePrice = pricePerDay * durationDays;
    }

    // DEPRECATED: Aplicar multiplicador de temporada baja SOLO si no hay precios directos definidos
    let seasonMultiplier = 1.0;
    let priceWithSeason = basePrice;
    
    if (season === 'low' && rentalType === 'daily') {
      // Solo aplicar multiplicador si NO hay precios directos de temporada baja
      const hasDirectLowSeasonPrices = pricingGroup.price_1_3_days_low || pricingGroup.price_4_7_days_low || pricingGroup.price_8_plus_days_low;
      if (!hasDirectLowSeasonPrices && pricingGroup.low_season_multiplier) {
        seasonMultiplier = Number(pricingGroup.low_season_multiplier);
        priceWithSeason = basePrice * seasonMultiplier;
      } else {
        // Ya usamos precios directos, no aplicar multiplicador adicional
        priceWithSeason = basePrice;
      }
    }

    // Calculate total (no insurance in new schema)
    const total = priceWithSeason;

    return NextResponse.json({
      base_price: basePrice.toFixed(2),
      price_per_day: pricePerDay > 0 ? pricePerDay.toFixed(2) : null,
      season_multiplier: seasonMultiplier,
      price_with_season: priceWithSeason.toFixed(2),
      total: total.toFixed(2),
      duration_days: durationDays,
      rental_type: rentalType,
      pricing_group: pricingGroup.name,
      deposit: Number(pricingGroup.deposit_amount || 0).toFixed(2),
      included_km_per_day: pricingGroup.included_km_per_day || 0,
      extra_km_charge: Number(pricingGroup.extra_km_charge || 0).toFixed(2),
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json({ error: 'Error calculating price' }, { status: 500 });
  }
}
