import { NextRequest, NextResponse } from "next/server";
import { getTenantFromHeaders } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromHeaders();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: "Error al obtener información del tenant" },
      { status: 500 }
    );
  }
}
