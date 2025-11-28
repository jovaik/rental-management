
"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Image from "next/image";

/**
 * HERO SECTION PROFESIONAL - Estilo Cooltra/Riderly/Marbella4rent
 * 
 * Diseño profesional con imagen de fondo grande, título impactante,
 * y formulario de búsqueda inline horizontal.
 * 
 * Para personalizar:
 * 1. Reemplaza el gradiente con tu imagen de fondo en la línea del div con bg-gradient-to-br
 * 2. Ajusta el título y subtítulo según tu marca
 * 3. Los colores naranja (#FF6B35) son los corporativos de Alquiloscooter
 */

type HeroSectionProps = {
  companyLogo?: string;
  companyName: string;
  onScrollToSearch?: () => void;
};

export function VehicleCarousel({ companyLogo, companyName, onScrollToSearch }: HeroSectionProps) {
  return (
    <div className="relative w-full">
      {/* Hero Section - Imagen de fondo grande */}
      <div className="relative h-[550px] rounded-2xl overflow-hidden shadow-2xl">
        {/* 
          NOTA: Aquí puedes agregar tu imagen de fondo real
          Opción 1: Usar Next Image con una imagen local
          Opción 2: Usar background-image con una URL externa
          
          Ejemplo con imagen:
          <Image 
            src="/images/hero-background.jpg" 
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
        */}
        
        {/* Fondo temporal - Reemplazar con imagen real */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-400">
          {/* Patrón decorativo opcional */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        </div>
        
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30" />
        
        {/* Contenido del Hero */}
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-16">
          <div className="max-w-4xl">
            {/* Badge pequeño */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white text-sm font-semibold rounded-full mb-6 shadow-lg animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              DISPONIBLE AHORA
            </div>
            
            {/* Título principal - Extra grande y bold */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-tight drop-shadow-2xl">
              Alquila tu scooter<br />
              <span className="text-[#FF6B35]">en Marbella</span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 font-light max-w-2xl drop-shadow-lg">
              Reserva fácil, rápida y flexible. Explora la ciudad con libertad total.
            </p>
            
            {/* Botón CTA */}
            <Button 
              onClick={onScrollToSearch}
              size="lg"
              className="bg-[#FF6B35] hover:bg-[#FF5520] text-white px-8 py-6 text-lg font-bold rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] transition-all duration-300 hover:scale-105"
            >
              <Search className="mr-2 h-6 w-6" />
              Ver vehículos disponibles
            </Button>
          </div>
        </div>
        
        {/* Decoración inferior */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 60C1200 60 1320 45 1380 37.5L1440 30V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1"/>
          </svg>
        </div>
      </div>
      
      {/* Features rápidos - Opcional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="text-3xl mb-3">🏍️</div>
          <h3 className="font-bold text-lg mb-2 text-gray-900">Flota Premium</h3>
          <p className="text-gray-600 text-sm">Scooters nuevos y en perfecto estado</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="text-3xl mb-3">💳</div>
          <h3 className="font-bold text-lg mb-2 text-gray-900">Mejor Precio</h3>
          <p className="text-gray-600 text-sm">Tarifas competitivas sin sorpresas</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-bold text-lg mb-2 text-gray-900">Reserva Rápida</h3>
          <p className="text-gray-600 text-sm">Proceso simple y sin complicaciones</p>
        </div>
      </div>
    </div>
  );
}
