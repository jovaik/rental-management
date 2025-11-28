
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Clock, AlertCircle, Mail, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PendingRequest = {
  id: number;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  vehicle: string;
  referralSource: string;
  createdAt: string;
  notes?: string;
};

export function PendingRequestsPanel() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingRequests();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingRequests = async () => {
    try {
      const response = await fetch("/api/bookings?status=request");
      const data = await response.json();
      
      if (response.ok) {
        const formattedRequests = data.bookings?.map((booking: any) => ({
          id: booking.id,
          bookingNumber: booking.booking_number,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone,
          pickupDate: booking.pickup_date,
          returnDate: booking.return_date,
          totalPrice: booking.total_price,
          vehicle: booking.car?.model || "N/A",
          referralSource: booking.referral_source,
          createdAt: booking.created_at,
          notes: booking.pickup_condition_notes,
        })) || [];
        
        setRequests(formattedRequests);
      }
    } catch (error) {
      console.error("Error loading pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${requestId}/approve-request`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Reserva aprobada y confirmada");
        setRequests(requests.filter((r) => r.id !== requestId));
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al aprobar la reserva");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Error al aprobar la reserva");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${selectedRequest.id}/reject-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        toast.success("Solicitud rechazada");
        setRequests(requests.filter((r) => r.id !== selectedRequest.id));
        setShowRejectDialog(false);
        setSelectedRequest(null);
        setRejectReason("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al rechazar la reserva");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Error al rechazar la reserva");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-600">Cargando solicitudes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Solicitudes de Reserva Pendientes
          </CardTitle>
          <CardDescription>
            Reservas de afiliados que requieren aprobación manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No hay solicitudes pendientes de aprobación</p>
            <p className="text-sm mt-1">Todas las reservas de afiliados han sido procesadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                Solicitudes Pendientes de Aprobación
                <Badge variant="destructive" className="ml-2">{requests.length}</Badge>
              </CardTitle>
              <CardDescription>
                Reservas de afiliados/colaboradores que requieren aprobación manual
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPendingRequests}
              disabled={loading}
            >
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Recibido</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="bg-white">
                    <TableCell className="font-mono font-semibold">
                      {request.bookingNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.customerName}</p>
                        {request.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            {request.notes.substring(0, 50)}
                            {request.notes.length > 50 ? "..." : ""}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{request.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{request.customerPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.vehicle}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <p>
                          <strong>Recogida:</strong>{" "}
                          {format(new Date(request.pickupDate), "dd MMM yyyy", { locale: es })}
                        </p>
                        <p>
                          <strong>Devolución:</strong>{" "}
                          {format(new Date(request.returnDate), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {request.totalPrice.toFixed(2)}€
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {request.referralSource.replace("widget_", "").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {format(new Date(request.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(request.id)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          disabled={processing}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud de Reserva</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar esta solicitud? Se enviará un email al cliente
              informándole.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p>
                  <strong>Expediente:</strong> {selectedRequest.bookingNumber}
                </p>
                <p>
                  <strong>Cliente:</strong> {selectedRequest.customerName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedRequest.customerEmail}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason">Motivo del Rechazo (opcional)</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: No disponemos de vehículos para esas fechas"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedRequest(null);
                setRejectReason("");
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? "Procesando..." : "Confirmar Rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
