/**
 * Booking Confirmation Email Template
 * Sent when a booking is confirmed
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  itemName: string;
  itemType: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  deposit?: number;
  invoiceNumber: string;
  invoiceUrl?: string;
  tenantName: string;
  tenantLocation?: string;
  bookingId: string;
  notes?: string;
}

export function generateBookingConfirmationEmail(
  data: BookingConfirmationData
): { subject: string; html: string; text: string } {
  const {
    customerName,
    itemName,
    itemType,
    startDate,
    endDate,
    totalPrice,
    deposit,
    invoiceNumber,
    invoiceUrl,
    tenantName,
    tenantLocation,
    notes,
  } = data;

  const formattedStartDate = format(new Date(startDate), "d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedEndDate = format(new Date(endDate), "d 'de' MMMM 'de' yyyy", { locale: es });

  const subject = `Confirmación de Reserva - ${itemName} - ${invoiceNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .booking-details {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .detail-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #10b981;
          }
          .button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            padding: 20px;
            background: #f8f9fa;
          }
          .alert-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Reserva Confirmada</h1>
            <p style="margin: 0;">Número de factura: ${invoiceNumber}</p>
          </div>
          
          <div class="content">
            <h2>Hola ${customerName},</h2>
            
            <p>Tu reserva ha sido confirmada exitosamente. A continuación encontrarás los detalles:</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0;">🚗 ${itemName}</h3>
              <p style="color: #666; margin: 5px 0 15px 0;">Tipo: ${itemType}</p>
              
              <div class="detail-row">
                <span>📅 Fecha de inicio:</span>
                <span><strong>${formattedStartDate}</strong></span>
              </div>
              
              <div class="detail-row">
                <span>📅 Fecha de fin:</span>
                <span><strong>${formattedEndDate}</strong></span>
              </div>
              
              ${deposit ? `
              <div class="detail-row">
                <span>💵 Depósito:</span>
                <span>€${deposit.toFixed(2)}</span>
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span>💰 Total:</span>
                <span>€${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            ${notes ? `
            <div class="alert-box">
              <strong>📝 Notas importantes:</strong><br>
              ${notes}
            </div>
            ` : ''}
            
            ${invoiceUrl ? `
            <div style="text-align: center;">
              <a href="${invoiceUrl}" class="button">Descargar Factura (PDF)</a>
            </div>
            ` : ''}
            
            <h3>📍 Información de contacto:</h3>
            <p>
              <strong>${tenantName}</strong><br>
              ${tenantLocation ? `${tenantLocation}<br>` : ''}
            </p>
            
            <p>Por favor, presenta esta confirmación al momento de recoger el artículo.</p>
            
            <p>Si necesitas modificar o cancelar tu reserva, contáctanos lo antes posible.</p>
            
            <p>¡Gracias por tu confianza!</p>
            
            <p>Saludos,<br><strong>${tenantName}</strong></p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Reserva Confirmada - ${invoiceNumber}

Hola ${customerName},

Tu reserva ha sido confirmada exitosamente.

Detalles de la reserva:
- Artículo: ${itemName}
- Tipo: ${itemType}
- Fecha de inicio: ${formattedStartDate}
- Fecha de fin: ${formattedEndDate}
${deposit ? `- Depósito: €${deposit.toFixed(2)}
` : ''}- Total: €${totalPrice.toFixed(2)}

${notes ? `Notas importantes:
${notes}

` : ''}Información de contacto:
${tenantName}
${tenantLocation ? `${tenantLocation}
` : ''}
Por favor, presenta esta confirmación al momento de recoger el artículo.

¡Gracias por tu confianza!

Saludos,
${tenantName}
  `;

  return { subject, html, text };
}
