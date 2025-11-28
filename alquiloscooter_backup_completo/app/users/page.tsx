
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Edit, UserPlus, Shield, Users } from "lucide-react";

type User = {
  id: number;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "operador" | "taller" | "colaborador" | "propietario" | "cesionario";
  createdAt: string;
};

export default function UsersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"super_admin" | "admin" | "operador" | "taller" | "colaborador" | "propietario" | "cesionario">("operador");
  
  // Edit user states
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState<"super_admin" | "admin" | "operador" | "taller" | "colaborador" | "propietario" | "cesionario">("operador");

  // Check if user is super admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "super_admin") {
      toast.error("No tienes permisos para acceder a esta página");
      router.push("/");
      return;
    }
  }, [status, session, router]);

  // Load users
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "super_admin") {
      loadUsers();
    }
  }, [status, session]);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Error al cargar usuarios");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Validar que los campos no estén vacíos (incluyendo solo espacios)
    if (!newUserEmail?.trim() || !newUserName?.trim() || !newUserPassword?.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Validar longitud mínima del nombre
    if (newUserName.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      toast.error("Por favor introduce un email válido");
      return;
    }

    // Validar longitud mínima de contraseña
    if (newUserPassword.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear usuario");
      }

      toast.success("Usuario creado exitosamente");
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("operador");
      loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Error al crear usuario");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Log para debugging
    console.log('📝 Intentando actualizar usuario:', {
      id: selectedUser.id,
      emailActual: selectedUser.email,
      emailNuevo: editUserEmail,
      nombre: editUserName,
      rol: editUserRole
    });

    // Validar que los campos no estén vacíos (incluyendo solo espacios)
    if (!editUserName?.trim() || !editUserEmail?.trim()) {
      toast.error("El nombre y email son obligatorios");
      return;
    }

    // Validar longitud mínima del nombre
    if (editUserName.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    // Validar formato de email con logging detallado
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailTrimmed = editUserEmail.trim();
    console.log('🔍 Validando email:', emailTrimmed, '| Válido:', emailRegex.test(emailTrimmed));
    
    if (!emailRegex.test(emailTrimmed)) {
      toast.error(`El email "${emailTrimmed}" no tiene un formato válido`);
      console.error('❌ Email inválido:', emailTrimmed);
      return;
    }

    // Validar contraseña solo si se proporcionó una nueva
    if (editUserPassword && editUserPassword.trim() !== "") {
      if (editUserPassword.length < 4) {
        toast.error("La contraseña debe tener al menos 4 caracteres");
        return;
      }
    }

    try {
      const updateData: any = {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole,
      };

      // Solo incluir contraseña si se proporcionó una nueva
      if (editUserPassword && editUserPassword.trim() !== "") {
        updateData.password = editUserPassword;
      }

      console.log('📤 Enviando actualización al servidor:', updateData);

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      console.log('📥 Respuesta del servidor:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error del servidor:', error);
        throw new Error(error.error || "Error al actualizar usuario");
      }

      const result = await response.json();
      console.log('✅ Usuario actualizado exitosamente:', result);

      toast.success("Usuario actualizado exitosamente");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditUserName("");
      setEditUserEmail("");
      setEditUserPassword("");
      setEditUserRole("operador");
      loadUsers();
    } catch (error: any) {
      console.error("❌ Error completo al actualizar usuario:", error);
      toast.error(error.message || "Error al actualizar usuario");
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar usuario");
      }

      toast.success("Usuario eliminado exitosamente");
      loadUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Error al eliminar usuario");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-red-600 hover:bg-red-700">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Admin</Badge>;
      case "operador":
        return <Badge className="bg-green-600 hover:bg-green-700">Operador</Badge>;
      case "taller":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Taller</Badge>;
      case "colaborador":
        return <Badge className="bg-purple-600 hover:bg-purple-700">Colaborador</Badge>;
      case "propietario":
        return <Badge className="bg-indigo-600 hover:bg-indigo-700">Propietario</Badge>;
      case "cesionario":
        return <Badge className="bg-pink-600 hover:bg-pink-700">Cesionario</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "operador":
        return "Operador";
      case "taller":
        return "Taller";
      case "colaborador":
        return "Colaborador";
      case "propietario":
        return "Propietario";
      case "cesionario":
        return "Cesionario";
      default:
        return role;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && session?.user?.role !== "super_admin") {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        </div>
        <p className="text-muted-foreground">
          Administra los usuarios y sus roles en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                Total de usuarios: {users.length}
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Completa los datos del nuevo usuario
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      placeholder="Nombre completo (mínimo 2 caracteres)"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 4 caracteres"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      La contraseña debe tener al menos 4 caracteres
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operador">Operador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="taller">Taller</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="propietario">Propietario</SelectItem>
                        <SelectItem value="cesionario">Cesionario</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser}>Crear Usuario</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditUserName(user.name);
                          setEditUserEmail(user.email);
                          setEditUserPassword(""); // Dejar vacío para no cambiar
                          setEditUserRole(user.role);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={user.id === Number(session?.user?.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedUser(null);
          setEditUserName("");
          setEditUserEmail("");
          setEditUserPassword("");
          setEditUserRole("operador");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modificar los datos de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                placeholder="Nombre completo (mínimo 2 caracteres)"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Dejar vacío para no cambiar (mínimo 4 caracteres)"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Solo completa este campo si deseas cambiar la contraseña (mínimo 4 caracteres)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol *</Label>
              <Select 
                value={editUserRole || "operador"} 
                onValueChange={(value: any) => {
                  setEditUserRole(value);
                }}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="taller">Taller</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="propietario">Propietario</SelectItem>
                  <SelectItem value="cesionario">Cesionario</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                setEditUserName("");
                setEditUserEmail("");
                setEditUserPassword("");
                setEditUserRole("operador");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
