"use client";

import { signOut, useSession } from "next-auth/react";
import { useTenant } from "@/components/providers/tenant-provider";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { tenant } = useTenant();

  if (status === "loading") {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              {tenant?.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {tenant?.name || "Rental Management"}
                </span>
              )}
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/items"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Items
              </Link>
              <Link
                href="/bookings"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Reservas
              </Link>
              <Link
                href="/customers"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Clientes
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-sm text-gray-700 mr-4">
                {session.user.name || session.user.email}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-4">
                {session.user.role}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
