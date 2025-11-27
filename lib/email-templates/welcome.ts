/**
 * Welcome Email Template
 * Sent when a new tenant is registered
 */

import type { Tenant } from '@prisma/client';

interface WelcomeEmailData {
  tenant: Tenant;
  userName: string;
  userEmail: string;
  loginUrl: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const { tenant, userName, loginUrl } = data;

  const subject = `¡Bienvenido a ${tenant.name}! 🎉`;

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
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .button {
            display: inline-block;
            background: #667eea;
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
            margin-top: 30px;
            padding: 20px;
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ¡Bienvenido!</h1>
        </div>
        
        <div class="content">
          <h2>Hola ${userName},</h2>
          
          <p>Gracias por registrarte en <strong>${tenant.name}</strong>. Tu cuenta ha sido creada exitosamente.</p>
          
          <div class="info-box">
            <strong>🏢 Información de tu negocio:</strong><br>
            Nombre: ${tenant.name}<br>
            Subdominio: ${tenant.subdomain}<br>
            Ubicación: ${tenant.location || 'No especificada'}<br>
            Tipo de negocio: ${tenant.businessTypes?.join(', ') || 'No especificado'}
          </div>
          
          <p>Ahora puedes acceder a tu panel de control y comenzar a gestionar tu inventario, reservas, clientes y facturas.</p>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Acceder al Panel</a>
          </div>
          
          <h3>🚀 Primeros pasos:</h3>
          <ol>
            <li><strong>Añade tu inventario:</strong> Agrega los artículos que deseas alquilar (vehículos, propiedades, embarcaciones, etc.)</li>
            <li><strong>Gestiona reservas:</strong> Crea y administra reservas con un calendario intuitivo</li>
            <li><strong>Registra clientes:</strong> Mantén un registro completo de tus clientes</li>
            <li><strong>Facturación automática:</strong> Las facturas se generan automáticamente al confirmar reservas</li>
          </ol>
          
          <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
          
          <p>Saludos,<br>El equipo de Rental Management</p>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Rental Management. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
¡Bienvenido a ${tenant.name}!

Hola ${userName},

Gracias por registrarte en ${tenant.name}. Tu cuenta ha sido creada exitosamente.

Información de tu negocio:
- Nombre: ${tenant.name}
- Subdominio: ${tenant.subdomain}
- Ubicación: ${tenant.location || 'No especificada'}
- Tipo de negocio: ${tenant.businessTypes?.join(', ') || 'No especificado'}

Accede a tu panel: ${loginUrl}

Primeros pasos:
1. Añade tu inventario
2. Gestiona reservas
3. Registra clientes
4. Facturación automática

Saludos,
El equipo de Rental Management
  `;

  return { subject, html, text };
}
