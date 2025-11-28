
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserva tu Vehículo | AlquiloScooter",
  description: "Sistema de reservas online - Alquila tu vehículo de forma rápida y segura",
};

export default function PublicBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
