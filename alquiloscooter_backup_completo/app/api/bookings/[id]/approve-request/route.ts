
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Approve affiliate booking request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const bookingId = parseInt(params.id);

    // Get booking
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        car: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (booking.status !== "request") {
      return NextResponse.json(
        { error: "Esta reserva no está pendiente de aprobación" },
        { status: 400 }
      );
    }

    // Update status to confirmed
    const updatedBooking = await prisma.carRentalBookings.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
      },
    });

    // Send confirmation email
    try {
      if (!process.env.SMTP_HOST) {
        console.log("Email not configured, skipping notification");
      } else {
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

        const pickupDateStr = booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString() : "N/A";
        const returnDateStr = booking.return_date ? new Date(booking.return_date).toLocaleDateString() : "N/A";

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: booking.customer_email,
          subject: `✅ Reserva CONFIRMADA - ${booking.booking_number}`,
          html: `
            <h2>¡Tu reserva ha sido confirmada!</h2>
            <p>Hola ${booking.customer_name},</p>
            <p>Nos complace informarte que tu reserva ha sido <strong>CONFIRMADA</strong>:</p>
            <ul>
              <li><strong>Número de expediente:</strong> ${booking.booking_number}</li>
              <li><strong>Vehículo:</strong> ${booking.car?.model || "N/A"}</li>
              <li><strong>Fecha de recogida:</strong> ${pickupDateStr}</li>
              <li><strong>Fecha de devolución:</strong> ${returnDateStr}</li>
              <li><strong>Precio total:</strong> ${booking.total_price}€</li>
            </ul>
            <p>Nos pondremos en contacto contigo pronto con más detalles.</p>
            <p>Gracias por confiar en nosotros.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Reserva aprobada y confirmada exitosamente",
    });
  } catch (error) {
    console.error("Error approving booking:", error);
    return NextResponse.json(
      { error: "Error al aprobar la reserva" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
