
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar Vehículo | AlquiloScooter",
  description: "Motor de reservas oficial - Reserva tu vehículo de forma rápida y sencilla",
};

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
