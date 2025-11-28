
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * API para enviar factura/ticket por email
 * 
 * NOTA: En producción, deberías usar un servicio de email real como:
 * - SendGrid
 * - Amazon SES
 * - Mailgun
 * - Resend
 * 
 * Por ahora, esta es una implementación de demostración
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { facturaId, email, mensaje } = await request.json()

    if (!facturaId || !email) {
      return NextResponse.json(
        { error: 'facturaId y email son requeridos' },
        { status: 400 }
      )
    }

    // Obtener la factura
    const factura = await prisma.carRentalFacturas.findUnique({
      where: { id: parseInt(facturaId) },
      include: {
        customer: true,
        items: true,
      }
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // AQUÍ DEBERÍAS INTEGRAR TU SERVICIO DE EMAIL
    // Ejemplo con SendGrid, Amazon SES, etc.
    
    console.log('📧 Simulando envío de email:')
    console.log('  Para:', email)
    console.log('  Asunto:', `${factura.tipo} ${factura.numero}`)
    console.log('  Mensaje:', mensaje)
    console.log('  Factura ID:', facturaId)
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000))

    // En producción, aquí enviarías el email real:
    /*
    import { sendEmail } from '@/lib/email-service'
    
    await sendEmail({
      to: email,
      subject: `${factura.tipo} ${factura.numero}`,
      html: `
        <h2>${mensaje}</h2>
        <p>Adjunto encontrarás tu ${factura.tipo.toLowerCase()} #${factura.numero}</p>
        <p>Total: €${factura.total.toFixed(2)}</p>
      `,
      attachments: [
        {
          filename: `${factura.tipo}_${factura.numero}.pdf`,
          content: pdfBuffer
        }
      ]
    })
    */

    // Por ahora, retornamos éxito de demostración
    return NextResponse.json({
      success: true,
      message: 'Email enviado correctamente (modo demostración)',
      demo: true,
      details: {
        to: email,
        facturaNumero: factura.numero,
        tipo: factura.tipo
      }
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Error al enviar el email' },
      { status: 500 }
    )
  }
}
