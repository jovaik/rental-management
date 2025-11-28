
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, FileText, Pen } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

export default function RemoteSignPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  
  const signatureRef = useRef<any>(null);

  useEffect(() => {
    if (token) {
      loadContract();
    }
  }, [token]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar el contrato por token (endpoint correcto)
      const response = await fetch(`/api/contracts/remote-sign?token=${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        
        // Manejar casos específicos de error
        if (data.errorCode === 'INVALID_TOKEN') {
          throw new Error('El enlace de firma no es válido o ha caducado');
        } else if (data.errorCode === 'TOKEN_EXPIRED') {
          throw new Error('El enlace de firma ha expirado. Por favor, contacte con la empresa para obtener un nuevo enlace');
        } else if (data.errorCode === 'ALREADY_SIGNED') {
          throw new Error('Este contrato ya ha sido firmado');
        }
        
        throw new Error(data.error || 'Error al cargar el contrato');
      }

      const data = await response.json();
      setContract(data);

    } catch (error: any) {
      console.error('Error al cargar contrato:', error);
      setError(error.message || 'No se pudo cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Por favor, firme en el recuadro');
      return;
    }

    try {
      setSigning(true);

      // Obtener la firma en formato base64
      const signatureData = signatureRef.current.toDataURL();

      // Enviar la firma
      const response = await fetch('/api/contracts/remote-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signatureData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al firmar el contrato');
      }

      toast.success('¡Contrato firmado correctamente!');
      setSigned(true);

    } catch (error: any) {
      console.error('Error al firmar:', error);
      toast.error(error.message || 'Error al firmar el contrato');
    } finally {
      setSigning(false);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de firmado exitosamente
  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <CardTitle>¡Contrato Firmado!</CardTitle>
            </div>
            <CardDescription>
              Su contrato ha sido firmado correctamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Gracias por firmar el contrato. Recibirá una copia por email.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulario de firma
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Firma de Contrato de Alquiler</CardTitle>
                <CardDescription>
                  Por favor, revise y firme el contrato a continuación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">
                  {contract?.customer?.firstName} {contract?.customer?.lastName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contrato Nº:</span>
                <span className="font-medium">{contract?.contractNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contenido del Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none bg-white p-6 rounded border max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: contract?.contractText || '' }}
            />
          </CardContent>
        </Card>

        {/* Firma */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pen className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Firme Aquí</CardTitle>
            </div>
            <CardDescription>
              Dibuje su firma en el recuadro de abajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-40 border border-gray-200 rounded',
                }}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={clearSignature}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              onClick={handleSign}
              disabled={signing}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {signing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <Pen className="mr-2 h-5 w-5" />
                  Firmar Contrato
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Aviso legal */}
        <Alert>
          <AlertDescription className="text-xs text-muted-foreground">
            Al firmar este contrato, usted acepta los términos y condiciones establecidos. 
            Su firma será registrada digitalmente junto con la fecha, hora e IP desde donde firma.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
