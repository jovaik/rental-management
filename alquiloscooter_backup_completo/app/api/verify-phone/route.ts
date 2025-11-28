
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeMessage } from '@/lib/whatsapp';

/**
 * POST /api/verify-phone
 * Valida y verifica un número de teléfono enviando un mensaje de bienvenida por WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, customerName } = body;

    // Validar que se proporcionó un teléfono
    if (!phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se proporcionó número de teléfono',
          verified: false 
        },
        { status: 400 }
      );
    }

    // Validar formato básico del teléfono (debe contener al menos dígitos)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?\d{8,15}$/; // Formato internacional: 8-15 dígitos con + opcional

    if (!phoneRegex.test(cleanPhone)) {
      console.log(`⚠️ Formato de teléfono inválido: ${phone}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de teléfono inválido',
          verified: false,
          method: 'none',
          message: 'El número debe tener entre 8 y 15 dígitos'
        },
        { status: 400 }
      );
    }

    console.log(`📞 Verificando teléfono: ${phone} (${customerName || 'Sin nombre'})`);

    // Enviar mensaje de bienvenida por WhatsApp
    const result = await sendWelcomeMessage(phone, customerName || '');

    if (result.success) {
      return NextResponse.json({
        success: true,
        verified: true,
        method: result.method,
        message: '✅ Número verificado - Mensaje de bienvenida enviado',
        verificationDate: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        method: result.method,
        message: '⚠️ No se pudo enviar el mensaje - El número podría ser inválido',
      }, { status: 200 }); // 200 porque no es un error del servidor, solo que no se pudo enviar
    }

  } catch (error) {
    console.error('❌ Error en verificación de teléfono:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar teléfono',
        verified: false,
        method: 'none'
      },
      { status: 500 }
    );
  }
}
