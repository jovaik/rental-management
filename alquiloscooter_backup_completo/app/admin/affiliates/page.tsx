
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Edit, DollarSign, TrendingUp, Users, Eye, EyeOff, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Affiliate = {
  id: number;
  email: string;
  name: string;
  role: string;
  referralCode: string | null;
  referralEnabled: boolean;
  commissionPercentage: number | null;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  conversionRate: number;
};

export default function AdminAffiliatesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [newAffiliateEmail, setNewAffiliateEmail] = useState("");
  const [newAffiliateFirstName, setNewAffiliateFirstName] = useState("");
  const [newAffiliateLastName, setNewAffiliateLastName] = useState("");
  const [newAffiliateRole, setNewAffiliateRole] = useState("colaborador");
  const [newAffiliateCommission, setNewAffiliateCommission] = useState("10");
  
  // Extended form fields
  const [newAffiliatePhone, setNewAffiliatePhone] = useState("");
  const [newAffiliateCompany, setNewAffiliateCompany] = useState("");
  const [newAffiliateAddress, setNewAffiliateAddress] = useState("");
  const [newAffiliateCity, setNewAffiliateCity] = useState("");
  const [newAffiliatePostalCode, setNewAffiliatePostalCode] = useState("");
  const [newAffiliateCountry, setNewAffiliateCountry] = useState("España");
  const [newAffiliateTaxId, setNewAffiliateTaxId] = useState("");
  const [newAffiliateBusinessName, setNewAffiliateBusinessName] = useState("");
  const [newAffiliateFiscalAddress, setNewAffiliateFiscalAddress] = useState("");
  const [newAffiliateType, setNewAffiliateType] = useState("individual");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      if (session?.user?.role !== "super_admin") {
        toast.error("No tienes permisos para acceder a esta página");
        router.push("/");
        return;
      }
      loadAffiliates();
    }
  }, [status, session, router]);

  const loadAffiliates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/affiliates");
      if (!response.ok) throw new Error("Error al cargar afiliados");
      const data = await response.json();
      setAffiliates(data);
    } catch (error) {
      console.error("Error loading affiliates:", error);
      toast.error("Error al cargar lista de afiliados");
    } finally {
      setLoading(false);
    }
  };

  const createAffiliate = async () => {
    // Validaciones
    if (!newAffiliateEmail || !newAffiliateFirstName || !newAffiliatePhone) {
      toast.error("Email, nombre y teléfono son obligatorios");
      return;
    }

    if ((newAffiliateType === "hotel" || newAffiliateType === "empresa") && !newAffiliateCompany) {
      toast.error("El nombre de la empresa/hotel es obligatorio");
      return;
    }

    try {
      const response = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Datos básicos del usuario
          email: newAffiliateEmail,
          firstName: newAffiliateFirstName,
          lastName: newAffiliateLastName,
          phone: newAffiliatePhone,
          role: newAffiliateRole,
          
          // Datos del perfil completo
          businessName: (newAffiliateType === "hotel" || newAffiliateType === "empresa") 
            ? newAffiliateCompany 
            : `${newAffiliateFirstName} ${newAffiliateLastName}`.trim(),
          affiliateType: newAffiliateType,
          commissionPercentage: parseFloat(newAffiliateCommission),
          
          // Dirección
          addressStreet: newAffiliateAddress,
          addressCity: newAffiliateCity,
          addressPostalCode: newAffiliatePostalCode,
          addressCountry: newAffiliateCountry,
          
          // Datos fiscales
          taxId: newAffiliateTaxId,
          legalName: newAffiliateBusinessName,
          fiscalAddressStreet: newAffiliateFiscalAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear afiliado");
      }

      toast.success("Afiliado creado exitosamente con todos sus datos");
      resetAffiliateForm();
      setCreateDialogOpen(false);
      loadAffiliates();
    } catch (error: any) {
      console.error("Error creating affiliate:", error);
      toast.error(error.message || "Error al crear afiliado");
    }
  };

  const resetAffiliateForm = () => {
    setNewAffiliateEmail("");
    setNewAffiliateFirstName("");
    setNewAffiliateLastName("");
    setNewAffiliateRole("colaborador");
    setNewAffiliateCommission("10");
    setNewAffiliatePhone("");
    setNewAffiliateCompany("");
    setNewAffiliateAddress("");
    setNewAffiliateCity("");
    setNewAffiliatePostalCode("");
    setNewAffiliateCountry("España");
    setNewAffiliateTaxId("");
    setNewAffiliateBusinessName("");
    setNewAffiliateFiscalAddress("");
    setNewAffiliateType("individual");
  };

  const updateAffiliate = async () => {
    if (!editingAffiliate) return;

    try {
      const response = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingAffiliate.id,
          role: editingAffiliate.role,
          referralEnabled: editingAffiliate.referralEnabled,
          commissionPercentage: editingAffiliate.commissionPercentage,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar afiliado");

      toast.success("Afiliado actualizado exitosamente");
      setEditDialogOpen(false);
      setEditingAffiliate(null);
      loadAffiliates();
    } catch (error) {
      console.error("Error updating affiliate:", error);
      toast.error("Error al actualizar afiliado");
    }
  };

  const toggleAffiliateStatus = async (affiliateId: number, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: affiliateId,
          referralEnabled: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error("Error al cambiar estado");

      toast.success(`Afiliado ${!currentStatus ? "activado" : "desactivado"}`);
      loadAffiliates();
    } catch (error) {
      console.error("Error toggling affiliate status:", error);
      toast.error("Error al cambiar estado del afiliado");
    }
  };

  const copyToClipboard = async (text: string, affiliateId: number) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(affiliateId);
        toast.success("Código copiado al portapapeles");
        setTimeout(() => setCopied(null), 2000);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(affiliateId);
        toast.success("Código copiado al portapapeles");
        setTimeout(() => setCopied(null), 2000);
      }
    } catch (err) {
      toast.error("No se pudo copiar");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="destructive">Super Admin</Badge>;
      case "propietario":
        return <Badge variant="default">Propietario</Badge>;
      case "colaborador":
        return <Badge variant="secondary">Colaborador</Badge>;
      case "taller":
        return <Badge variant="outline">Taller</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getTotalCommission = () => {
    return affiliates.reduce((sum, a) => {
      const commission = (a.totalRevenue * (a.commissionPercentage || 0)) / 100;
      return sum + commission;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando afiliados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Afiliados</h1>
          <p className="text-muted-foreground">
            Administra colaboradores, propietarios y sus comisiones
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Afiliado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Afiliado</DialogTitle>
              <DialogDescription>
                Agrega un nuevo colaborador o propietario al sistema (hoteles, empresas, individuos, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Tipo de Afiliado */}
              <div>
                <Label>Tipo de Afiliado *</Label>
                <Select value={newAffiliateType} onValueChange={setNewAffiliateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Persona Física</SelectItem>
                    <SelectItem value="hotel">Hotel / Alojamiento</SelectItem>
                    <SelectItem value="empresa">Empresa / Agencia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Información Básica */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3 text-gray-700">Información de Contacto</h4>
                <div className="space-y-3">
                  {(newAffiliateType === "hotel" || newAffiliateType === "empresa") && (
                    <div>
                      <Label>Nombre de la Empresa/Hotel *</Label>
                      <Input
                        value={newAffiliateCompany}
                        onChange={(e) => setNewAffiliateCompany(e.target.value)}
                        placeholder="Hotel Marbella, Rent a Car Express, etc."
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre de Contacto *</Label>
                      <Input
                        value={newAffiliateFirstName}
                        onChange={(e) => setNewAffiliateFirstName(e.target.value)}
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <Label>Apellidos</Label>
                      <Input
                        value={newAffiliateLastName}
                        onChange={(e) => setNewAffiliateLastName(e.target.value)}
                        placeholder="García"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newAffiliateEmail}
                        onChange={(e) => setNewAffiliateEmail(e.target.value)}
                        placeholder="ejemplo@email.com"
                      />
                    </div>
                    <div>
                      <Label>Teléfono *</Label>
                      <Input
                        type="tel"
                        value={newAffiliatePhone}
                        onChange={(e) => setNewAffiliatePhone(e.target.value)}
                        placeholder="+34 600 123 456"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3 text-gray-700">Dirección</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Dirección Completa</Label>
                    <Input
                      value={newAffiliateAddress}
                      onChange={(e) => setNewAffiliateAddress(e.target.value)}
                      placeholder="Calle, número, piso, etc."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Ciudad</Label>
                      <Input
                        value={newAffiliateCity}
                        onChange={(e) => setNewAffiliateCity(e.target.value)}
                        placeholder="Marbella"
                      />
                    </div>
                    <div>
                      <Label>Código Postal</Label>
                      <Input
                        value={newAffiliatePostalCode}
                        onChange={(e) => setNewAffiliatePostalCode(e.target.value)}
                        placeholder="29600"
                      />
                    </div>
                    <div>
                      <Label>País</Label>
                      <Input
                        value={newAffiliateCountry}
                        onChange={(e) => setNewAffiliateCountry(e.target.value)}
                        placeholder="España"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos Fiscales */}
              {(newAffiliateType === "hotel" || newAffiliateType === "empresa" || newAffiliateType === "individual") && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3 text-gray-700">Datos Fiscales</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{newAffiliateType === "individual" ? "DNI/NIE" : "CIF"}</Label>
                        <Input
                          value={newAffiliateTaxId}
                          onChange={(e) => setNewAffiliateTaxId(e.target.value)}
                          placeholder={newAffiliateType === "individual" ? "12345678A" : "B12345678"}
                        />
                      </div>
                      <div>
                        <Label>Razón Social</Label>
                        <Input
                          value={newAffiliateBusinessName}
                          onChange={(e) => setNewAffiliateBusinessName(e.target.value)}
                          placeholder="Nombre fiscal completo"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Dirección Fiscal (si es diferente)</Label>
                      <Input
                        value={newAffiliateFiscalAddress}
                        onChange={(e) => setNewAffiliateFiscalAddress(e.target.value)}
                        placeholder="Dejar en blanco si es la misma"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Comisiones */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3 text-gray-700">Configuración</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Rol</Label>
                    <Select value={newAffiliateRole} onValueChange={setNewAffiliateRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="propietario">Propietario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Comisión (%) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newAffiliateCommission}
                      onChange={(e) => setNewAffiliateCommission(e.target.value)}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Porcentaje de comisión sobre las reservas traídas
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="text-blue-900">
                  ℹ️ Se generará automáticamente un código de afiliado único y una contraseña temporal
                  que será enviada por email.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetAffiliateForm();
                setCreateDialogOpen(false);
              }}>
                Cancelar
              </Button>
              <Button onClick={createAffiliate}>Crear Afiliado</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Afiliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates.length}</div>
            <p className="text-xs text-muted-foreground">
              {affiliates.filter(a => a.referralEnabled).length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates.reduce((sum, a) => sum + a.totalRevenue, 0).toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              De {affiliates.reduce((sum, a) => sum + a.totalBookings, 0)} reservas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getTotalCommission().toFixed(2)}€
            </div>
            <p className="text-xs text-muted-foreground">
              Comisiones acumuladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Afiliados</CardTitle>
          <CardDescription>Gestiona todos los usuarios que pueden generar reservas referidas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No hay afiliados registrados. Crea el primero usando el botón "Nuevo Afiliado".
                  </TableCell>
                </TableRow>
              ) : (
                affiliates.map((affiliate) => {
                  const commission = (affiliate.totalRevenue * (affiliate.commissionPercentage || 0)) / 100;
                  return (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{affiliate.name}</p>
                          <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(affiliate.role)}</TableCell>
                      <TableCell>
                        {affiliate.referralCode ? (
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {affiliate.referralCode}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(affiliate.referralCode!, affiliate.id)}
                            >
                              {copied === affiliate.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin código</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">{affiliate.totalBookings}</p>
                          <p className="text-xs text-muted-foreground">
                            {affiliate.completedBookings} completadas
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {affiliate.totalRevenue.toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold text-green-600">
                            {commission.toFixed(2)}€
                          </p>
                          {affiliate.commissionPercentage && (
                            <p className="text-xs text-muted-foreground">
                              {affiliate.commissionPercentage}%
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.referralEnabled)}
                        >
                          {affiliate.referralEnabled ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAffiliate(affiliate);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Afiliado</DialogTitle>
            <DialogDescription>
              Modifica los datos del afiliado {editingAffiliate?.name}
            </DialogDescription>
          </DialogHeader>
          {editingAffiliate && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingAffiliate.email} disabled />
              </div>
              <div>
                <Label>Rol</Label>
                <Select
                  value={editingAffiliate.role}
                  onValueChange={(value) =>
                    setEditingAffiliate({ ...editingAffiliate, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="propietario">Propietario</SelectItem>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Comisión (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editingAffiliate.commissionPercentage || ""}
                  onChange={(e) =>
                    setEditingAffiliate({
                      ...editingAffiliate,
                      commissionPercentage: parseFloat(e.target.value) || null,
                    })
                  }
                  placeholder="10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={editingAffiliate.referralEnabled}
                  onChange={(e) =>
                    setEditingAffiliate({
                      ...editingAffiliate,
                      referralEnabled: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="enabled">Afiliado activo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateAffiliate}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
