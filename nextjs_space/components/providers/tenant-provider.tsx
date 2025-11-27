"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Tenant } from "@/types";

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
});

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}

interface TenantProviderProps {
  children: React.ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch tenant information from API
        const response = await fetch("/api/tenant/current");
        
        if (!response.ok) {
          throw new Error("No se pudo cargar la información del tenant");
        }

        const data = await response.json();
        setTenant(data.tenant);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error loading tenant:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}
