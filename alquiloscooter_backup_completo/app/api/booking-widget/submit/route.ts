
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// Email notification function
async function sendBookingNotification(booking: any, isAffiliate: boolean) {
  try {
    // TODO: Configure email settings in environment variables
    // For now, we'll just log the notification
    console.log("📧 Email notification:", {
      to: booking.customer_email,
      type: isAffiliate ? "Affiliate Request" : "Direct Booking",
      bookingNumber: booking.booking_number,
    });

    // Check if we have SMTP configuration in environment
    if (!process.env.SMTP_HOST) {
      console.log("ℹ️  Email not configured, skipping notification");
      return;
    }

    const nodemailer = require("nodemailer");
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const statusText = isAffiliate ? "SOLICITUD PENDIENTE DE APROBACIÓN" : "CONFIRMADA";
    
    // Determinar origen para el mensaje
    let sourceNote = "";
    if (booking.referral_source === 'website_public') {
      sourceNote = `\n\n🌐 ORIGEN: Esta reserva proviene de la web pública y requiere confirmación manual.`;
    } else if (isAffiliate) {
      sourceNote = `\n\n⚠️ NOTA: Esta reserva proviene de un colaborador/afiliado y requiere aprobación manual del departamento de reservas.`;
    }
    
    const affiliateNote = sourceNote;

    // Email to customer
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: booking.customer_email,
      subject: `Reserva ${statusText} - ${booking.booking_number}`,
      html: `
        <h2>Reserva ${statusText}</h2>
        <p>Hola ${booking.customer_name},</p>
        <p>Hemos recibido tu solicitud de reserva con los siguientes detalles:</p>
        <ul>
          <li><strong>Número de expediente:</strong> ${booking.booking_number}</li>
          <li><strong>Fecha de recogida:</strong> ${new Date(booking.pickup_date).toLocaleDateString()}</li>
          <li><strong>Fecha de devolución:</strong> ${new Date(booking.return_date).toLocaleDateString()}</li>
          <li><strong>Precio total:</strong> ${booking.total_price}€</li>
          <li><strong>Estado:</strong> ${statusText}</li>
        </ul>
        ${isAffiliate ? "<p><strong>Tu reserva está pendiente de aprobación.</strong> Nos pondremos en contacto contigo en breve para confirmarla.</p>" : "<p>Nos pondremos en contacto contigo pronto para completar los detalles.</p>"}
        <p>Gracias por confiar en nosotros.</p>
      `,
    });

    // Email to admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER,
      subject: `Nueva Reserva ${isAffiliate ? "(Afiliado - Requiere Aprobación)" : ""} - ${booking.booking_number}`,
      html: `
        <h2>Nueva Reserva Recibida</h2>
        <ul>
          <li><strong>Expediente:</strong> ${booking.booking_number}</li>
          <li><strong>Cliente:</strong> ${booking.customer_name}</li>
          <li><strong>Email:</strong> ${booking.customer_email}</li>
          <li><strong>Teléfono:</strong> ${booking.customer_phone}</li>
          <li><strong>Recogida:</strong> ${new Date(booking.pickup_date).toLocaleDateString()}</li>
          <li><strong>Devolución:</strong> ${new Date(booking.return_date).toLocaleDateString()}</li>
          <li><strong>Precio:</strong> ${booking.total_price}€</li>
          <li><strong>Estado:</strong> ${statusText}</li>
          ${booking.referral_source ? `<li><strong>Fuente:</strong> ${booking.referral_source}</li>` : ""}
        </ul>
        ${affiliateNote}
      `,
    });

    console.log("Booking notification emails sent successfully");
  } catch (error) {
    console.error("Error sending booking notification:", error);
    // Don't throw error, just log it
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      customerName,
      customerEmail,
      customerPhone,
      customerComments,
      source, // ✅ NUEVO: identificar el origen de la reserva
      affiliateCode, // ✅ NUEVO: código de afiliado directo desde URL
    } = body;

    // Validate required fields
    if (!vehicleId || !pickupDate || !returnDate || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Get referral code from cookie
    const cookieStore = await cookies();
    const referralCodeCookie = cookieStore.get("alquiloscooter_ref")?.value;
    
    // Priorizar affiliateCode de URL sobre cookie
    const referralCode = affiliateCode || referralCodeCookie;
    
    let referredByUserId = null;
    let referralSource = "widget_directo";
    let isAffiliateBooking = false;

    // ✅ NUEVO: Determinar fuente de la reserva
    if (source === 'website') {
      referralSource = 'website_public';
      // Las reservas de la web pública siempre requieren aprobación
      isAffiliateBooking = true; // Esto hace que el status sea 'request'
    } else if (referralCode) {
      // Buscar usuario con código de afiliado
      const referrer = await prisma.carRentalUsers.findUnique({
        where: { referral_code: referralCode, referral_enabled: true },
        select: { id: true, role: true },
      });
      
      if (referrer) {
        referredByUserId = referrer.id;
        // Si es afiliado (rol 'affiliate'), marcar como reserva de afiliado
        if (referrer.role === 'affiliate') {
          referralSource = `affiliate_${referralCode}`;
          isAffiliateBooking = true;
        } else {
          referralSource = `widget_${referralCode}`;
          isAffiliateBooking = true;
        }
      }
    }

    // Calculate total price
    // ✅ MEJORADO: Incluir horas en las fechas
    const pickup = new Date(pickupDate);
    if (pickupTime) {
      const [hours, minutes] = pickupTime.split(':');
      pickup.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    const returnD = new Date(returnDate);
    if (returnTime) {
      const [hours, minutes] = returnTime.split(':');
      returnD.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    const days = Math.ceil(
      (returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)
    );

    const vehicle = await prisma.carRentalCars.findUnique({
      where: { id: parseInt(vehicleId) },
      include: { pricingGroup: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    const pricePerDay = vehicle.pricingGroup?.price_1_3_days
      ? Number(vehicle.pricingGroup.price_1_3_days)
      : 50;
    const totalPrice = pricePerDay * days;

    // Check if customer exists
    let customer = await prisma.carRentalCustomers.findFirst({
      where: { email: customerEmail },
    });

    // Create customer if doesn't exist
    if (!customer) {
      customer = await prisma.carRentalCustomers.create({
        data: {
          first_name: customerName.split(" ")[0],
          last_name: customerName.split(" ").slice(1).join(" ") || "",
          email: customerEmail,
          phone: customerPhone,
          status: "T",
        },
      });
    }

    // Generate booking number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    const lastBooking = await prisma.carRentalBookings.findFirst({
      where: {
        booking_number: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        booking_number: "desc",
      },
    });

    let sequence = 1;
    if (lastBooking?.booking_number) {
      const lastSequence = parseInt(lastBooking.booking_number.slice(-4));
      sequence = lastSequence + 1;
    }

    const bookingNumber = `${datePrefix}${String(sequence).padStart(4, "0")}`;

    // Create booking with appropriate status
    // If from affiliate, status = "request" (pending approval)
    // If direct, status = "pending" (confirmed but pending details)
    const bookingStatus = isAffiliateBooking ? "request" : "pending";

    const booking = await prisma.carRentalBookings.create({
      data: {
        booking_number: bookingNumber,
        car_id: parseInt(vehicleId),
        customer_id: customer.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        pickup_date: pickup,
        return_date: returnD,
        total_price: totalPrice,
        status: bookingStatus,
        referred_by_user_id: referredByUserId,
        referral_source: referralSource,
        pickup_condition_notes: customerComments || "",
      },
    });

    // Create booking vehicle relation
    await prisma.bookingVehicles.create({
      data: {
        booking_id: booking.id,
        car_id: parseInt(vehicleId),
        vehicle_price: totalPrice,
      },
    });

    // Send email notifications
    await sendBookingNotification(booking, isAffiliateBooking);

    const responseMessage = isAffiliateBooking
      ? "Solicitud de reserva recibida. Tu reserva está pendiente de aprobación por nuestro equipo. Te contactaremos pronto."
      : "Reserva creada exitosamente. Nos pondremos en contacto contigo pronto.";

    return NextResponse.json({
      success: true,
      bookingNumber,
      status: bookingStatus,
      requiresApproval: isAffiliateBooking,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
