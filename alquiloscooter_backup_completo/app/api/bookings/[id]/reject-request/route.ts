
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Reject affiliate booking request
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
    const body = await request.json();
    const { reason } = body;

    // Get booking
    const booking = await prisma.carRentalBookings.findUnique({
      where: { id: bookingId },
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

    // Update status to cancelled
    const updatedBooking = await prisma.carRentalBookings.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        pickup_condition_notes: booking.pickup_condition_notes 
          ? `${booking.pickup_condition_notes}\n\nRazón de rechazo: ${reason || "No especificada"}`
          : `Razón de rechazo: ${reason || "No especificada"}`,
      },
    });

    // Send rejection email
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
          subject: `Actualización de Reserva - ${booking.booking_number}`,
          html: `
            <h2>Actualización de tu Reserva</h2>
            <p>Hola ${booking.customer_name},</p>
            <p>Lamentamos informarte que no podemos procesar tu solicitud de reserva en este momento:</p>
            <ul>
              <li><strong>Número de expediente:</strong> ${booking.booking_number}</li>
              <li><strong>Fecha solicitada:</strong> ${pickupDateStr} - ${returnDateStr}</li>
              ${reason ? `<li><strong>Motivo:</strong> ${reason}</li>` : ""}
            </ul>
            <p>Si deseas realizar otra reserva o tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Gracias por tu comprensión.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Reserva rechazada exitosamente",
    });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return NextResponse.json(
      { error: "Error al rechazar la reserva" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
