
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GPSPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Título de la sección */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Seguimiento GPS de Flota
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Localización en tiempo real de vehículos • Sistema Lolamoto Flotas
        </p>
      </div>

      {/* Iframe con altura calculada */}
      <div className="flex-1 relative bg-white rounded-lg shadow-sm overflow-hidden" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <iframe
          src="https://flotas.lolamoto.com/dashboard/Mapa"
          className="absolute inset-0 w-full h-full border-0"
          title="GPS Tracking"
          allow="geolocation"
        />
      </div>

      {/* Nota informativa */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Nota:</strong> La primera vez debes iniciar sesión en Lolamoto dentro del mapa. 
          Tu sesión se mantendrá activa en futuras visitas.
        </p>
      </div>
    </div>
  );
}
