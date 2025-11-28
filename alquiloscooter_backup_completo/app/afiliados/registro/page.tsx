
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AffiliateRegistrationPage() {
  const [formData, setFormData] = useState({
    affiliateType: "business",
    businessName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressStreet: "",
    addressCity: "",
    addressPostalCode: "",
    addressCountry: "España",
    taxId: "",
    legalName: "",
    fiscalAddressStreet: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.phone) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (formData.affiliateType === "business" && !formData.businessName) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/affiliates/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el formulario");
      }

      setSuccess(true);
      toast.success("¡Solicitud enviada correctamente!");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el formulario");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">¡Solicitud Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Hemos recibido tu solicitud para convertirte en afiliado. Nuestro equipo la revisará y se pondrá en contacto contigo en un plazo de 24-48 horas.
            </p>
            <p className="text-sm text-gray-500">
              Recibirás un email de confirmación en <strong>{formData.email}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Texto Explicativo */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col items-center mb-6">
              <img 
                src="/alquiloscooter-logo.png" 
                alt="Alquiloscooter" 
                className="h-24 w-auto object-contain mb-4"
              />
              <div className="text-center">
                <CardTitle className="text-3xl mb-2">Programa de Afiliados</CardTitle>
                <CardDescription className="text-lg">Únete a nuestra red de colaboradores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded" style={{ backgroundColor: '#FFE5E5', borderLeft: '4px solid #FF5555' }}>
              <h3 className="font-semibold text-gray-900 mb-2">¿Qué es el Programa de Afiliados?</h3>
              <p className="text-gray-700 text-sm">
                Nuestro programa de afiliados está diseñado para hoteles, apartamentos turísticos, agencias de viaje y otros establecimientos que deseen ofrecer servicios de alquiler de scooters y motos a sus clientes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="font-bold text-2xl mb-2" style={{ color: '#FF5555' }}>💰</div>
                <h4 className="font-semibold mb-1">Comisiones Atractivas</h4>
                <p className="text-sm text-gray-600">Gana comisiones por cada reserva generada a través de tu establecimiento</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="font-bold text-2xl mb-2" style={{ color: '#FF5555' }}>🔗</div>
                <h4 className="font-semibold mb-1">Widget Personalizado</h4>
                <p className="text-sm text-gray-600">Integra nuestro sistema de reservas en tu web de forma sencilla</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="font-bold text-2xl mb-2" style={{ color: '#FF5555' }}>📊</div>
                <h4 className="font-semibold mb-1">Panel de Control</h4>
                <p className="text-sm text-gray-600">Accede a estadísticas y gestiona tus reservas en tiempo real</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-yellow-800 text-sm">
                <strong>Importante:</strong> Una vez enviado el formulario, nuestro equipo revisará tu solicitud y se pondrá en contacto contigo para confirmar los detalles de colaboración y configurar tu cuenta.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Registro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Formulario de Registro</CardTitle>
            <CardDescription>Los campos marcados con * son obligatorios</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Afiliado */}
              <div>
                <Label>Tipo de Afiliado *</Label>
                <Select
                  value={formData.affiliateType}
                  onValueChange={(value) => setFormData({ ...formData, affiliateType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Empresa / Establecimiento</SelectItem>
                    <SelectItem value="individual">Particular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Datos de la Empresa/Establecimiento */}
              {formData.affiliateType === "business" && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700">Datos del Establecimiento</h3>
                  
                  <div>
                    <Label>Nombre de la Empresa/Hotel *</Label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Ej: Hotel Paradise, Apartamentos Mar Azul..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>CIF</Label>
                      <Input
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="B12345678"
                      />
                    </div>
                    <div>
                      <Label>Razón Social</Label>
                      <Input
                        value={formData.legalName}
                        onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                        placeholder="Razón social de la empresa"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.affiliateType === "individual" && (
                <div>
                  <Label>DNI/NIE</Label>
                  <Input
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="12345678A"
                  />
                </div>
              )}

              {/* Persona de Contacto */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700">Persona de Contacto</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <Label>Apellidos</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="García López"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contacto@hotel.com"
                    />
                  </div>
                  <div>
                    <Label>Teléfono *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700">Dirección</h3>
                
                <div>
                  <Label>Dirección Completa</Label>
                  <Input
                    value={formData.addressStreet}
                    onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                    placeholder="Calle Principal, 123"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Ciudad</Label>
                    <Input
                      value={formData.addressCity}
                      onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                      placeholder="Barcelona"
                    />
                  </div>
                  <div>
                    <Label>Código Postal</Label>
                    <Input
                      value={formData.addressPostalCode}
                      onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
                      placeholder="08001"
                    />
                  </div>
                  <div>
                    <Label>País</Label>
                    <Input
                      value={formData.addressCountry}
                      onChange={(e) => setFormData({ ...formData, addressCountry: e.target.value })}
                      placeholder="España"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección Fiscal (solo para empresas) */}
              {formData.affiliateType === "business" && (
                <div>
                  <Label>Dirección Fiscal (si es diferente a la anterior)</Label>
                  <Input
                    value={formData.fiscalAddressStreet}
                    onChange={(e) => setFormData({ ...formData, fiscalAddressStreet: e.target.value })}
                    placeholder="Dirección fiscal"
                  />
                </div>
              )}

              {/* Notas adicionales */}
              <div>
                <Label>Comentarios o información adicional</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Cuéntanos más sobre tu establecimiento o cualquier pregunta que tengas..."
                  rows={4}
                />
              </div>

              {/* Botón de envío */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
