
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, ExternalLink, DollarSign, TrendingUp, Calendar, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ReferralStats = {
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  commissionPercentage: number;
  statusCounts: Record<string, number>;
  bookings: Array<{
    id: number;
    bookingNumber: string;
    customerName: string;
    pickupDate: string;
    returnDate: string;
    totalPrice: number;
    status: string;
    vehicle: string;
  }>;
};

export default function ReferralsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "year" | "all">("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadReferralData();
      loadStats();
    }
  }, [status, router, period]);

  const loadReferralData = async () => {
    try {
      const response = await fetch("/api/referrals/generate-code", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setReferralCode(data.referralCode);
        setReferralEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/referrals/stats?period=${period}`);
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const toggleReferralEnabled = async () => {
    try {
      const response = await fetch("/api/referrals/generate-code", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !referralEnabled }),
      });

      if (response.ok) {
        setReferralEnabled(!referralEnabled);
        toast.success(
          !referralEnabled
            ? "Sistema de afiliados activado"
            : "Sistema de afiliados desactivado"
        );
      }
    } catch (error) {
      console.error("Error toggling referral:", error);
      toast.error("Error al cambiar el estado");
    }
  };

  const getEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `<iframe src="${baseUrl}/booking-widget?ref=${referralCode}" width="100%" height="800" frameborder="0"></iframe>`;
  };

  const getDirectLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/booking-widget?ref=${referralCode}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${type} copiado al portapapeles`);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          toast.success(`${type} copiado al portapapeles`);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('Fallback copy failed');
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('No se pudo copiar. Intenta copiar manualmente.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando datos de afiliados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Afiliados</h1>
          <p className="text-muted-foreground">
            Comparte tu enlace y gana comisiones por cada reserva
          </p>
        </div>
      </div>

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Código de Afiliado</CardTitle>
          <CardDescription>
            Comparte este enlace o widget embebible para que tus reservas sean rastreadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Código de Afiliado</Label>
              <div className="flex gap-2 mt-1">
                <Input value={referralCode} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(referralCode, "Código")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant={referralEnabled ? "destructive" : "default"}
                onClick={toggleReferralEnabled}
              >
                {referralEnabled ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Enlace Directo</TabsTrigger>
              <TabsTrigger value="embed">Código Embebible</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-2">
              <Label>Enlace para Compartir</Label>
              <div className="flex gap-2">
                <Input value={getDirectLink()} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getDirectLink(), "Enlace")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(getDirectLink(), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Comparte este enlace en redes sociales, WhatsApp, email, etc.
              </p>
            </TabsContent>

            <TabsContent value="embed" className="space-y-2">
              <Label>Código HTML para Embeber</Label>
              <div className="flex gap-2">
                <Input value={getEmbedCode()} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getEmbedCode(), "Código embebible")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Copia y pega este código HTML en tu sitio web para embeber el widget de reservas.
              </p>
              <div className="bg-gray-50 border rounded p-4">
                <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                <div className="bg-white border-2 border-dashed border-gray-300 rounded p-4 text-center text-sm text-gray-500">
                  El widget de reservas aparecerá aquí en tu web
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-1">ℹ️ Reservas bajo Solicitud</p>
            <p className="text-blue-800">
              Las reservas generadas desde tu enlace serán marcadas como <strong>"Solicitud Pendiente"</strong> y deberán ser 
              aprobadas por el departamento de reservas antes de confirmarse.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <>
          <div className="flex gap-2 justify-end">
            <Button
              variant={period === "month" ? "default" : "outline"}
              onClick={() => setPeriod("month")}
              size="sm"
            >
              Este Mes
            </Button>
            <Button
              variant={period === "year" ? "default" : "outline"}
              onClick={() => setPeriod("year")}
              size="sm"
            >
              Este Año
            </Button>
            <Button
              variant={period === "all" ? "default" : "outline"}
              onClick={() => setPeriod("all")}
              size="sm"
            >
              Todo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <p className="text-xs text-muted-foreground">Generadas por tu enlace</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground">Valor total de reservas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalCommission.toFixed(2)}€
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.commissionPercentage}% de comisión
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reservas Generadas</CardTitle>
              <CardDescription>Historial de reservas realizadas a través de tu enlace</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aún no tienes reservas generadas</p>
                  <p className="text-sm mt-2">Comparte tu enlace para empezar a generar comisiones</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expediente</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono">{booking.bookingNumber}</TableCell>
                        <TableCell>{booking.customerName}</TableCell>
                        <TableCell className="text-sm">{booking.vehicle}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(booking.pickupDate), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {booking.totalPrice.toFixed(2)}€
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "completed"
                                ? "secondary"
                                : booking.status === "request"
                                ? "outline"
                                : "outline"
                            }
                          >
                            {booking.status === "request" ? "Pendiente Aprobación" : booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
