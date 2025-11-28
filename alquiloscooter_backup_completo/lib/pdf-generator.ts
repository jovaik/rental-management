/**
 * RESTAURADO: Generación de PDFs de facturas con html-pdf-node (funcionaba 07/11/2025)
 */
import { CompanyConfig } from '@prisma/client'

interface InvoiceData {
  numero: string
  tipo: 'TICKET' | 'FACTURA'
  fecha: Date
  customer: {
    name: string
    surname?: string | null
    dni?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
  }
  items: Array<{
    descripcion: string
    cantidad: number
    precio_unitario: number | string
    total: number | string
  }>
  subtotal: number | string
  iva: number | string
  total: number | string
  metodo_pago?: string | null
  estado: string
}

export async function generateInvoicePDF(
  invoiceData: InvoiceData,
  companyConfig: CompanyConfig,
  logoBase64?: string | null
): Promise<Buffer> {
  const html = generateInvoiceHTML(invoiceData, companyConfig, logoBase64)

  // ✅ DEFINITIVO: Usar puppeteer-core + @sparticuz/chromium para producción serverless
  const { launchBrowser } = await import('@/lib/puppeteer-launcher');
  const browser = await launchBrowser();
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

function generateInvoiceHTML(
  invoice: InvoiceData,
  company: CompanyConfig,
  logoBase64?: string | null
): string {
  const tipo = invoice.tipo === 'FACTURA' ? 'FACTURA' : 'NO APLICA'
  const fechaFormateada = new Date(invoice.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Usar colores personalizados de la empresa
  const primaryColor = company.primary_color || '#2563eb'
  const secondaryColor = company.secondary_color || '#1e40af'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tipo} ${invoice.numero}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      padding: 30px;
      color: #1e293b;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo-image {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 10px;
    }
    
    .logo-text {
      font-size: 28px;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    
    .business-info {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    
    .document-info {
      text-align: right;
    }
    
    .document-type {
      font-size: 32px;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    
    .document-number {
      font-size: 18px;
      color: #333;
      margin-bottom: 5px;
    }
    
    .document-date {
      font-size: 13px;
      color: #64748b;
    }
    
    .customer-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid ${primaryColor};
    }
    
    .customer-title {
      font-size: 12px;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .customer-name {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .customer-details {
      font-size: 12px;
      color: #475569;
      line-height: 1.8;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table thead {
      background: ${primaryColor};
      color: white;
    }
    
    .items-table th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #334155;
    }
    
    .items-table tbody tr:hover {
      background: #f8fafc;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: 2px solid #cbd5e1;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .totals-box {
      width: 350px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    
    .total-row.subtotal {
      color: #64748b;
      font-weight: 500;
    }
    
    .total-row.iva {
      color: #64748b;
      font-weight: 500;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    
    .total-row.final {
      font-size: 22px;
      font-weight: bold;
      color: ${primaryColor};
      padding-top: 15px;
      border-top: 3px solid ${primaryColor};
    }
    
    .payment-info {
      background: ${primaryColor}15;
      border-left: 4px solid ${primaryColor};
      padding: 18px 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    
    .payment-info-title {
      font-weight: bold;
      color: ${secondaryColor};
      margin-bottom: 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .payment-method {
      color: ${secondaryColor};
      font-size: 16px;
      font-weight: 600;
    }
    
    .estado-badge {
      display: inline-block;
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .estado-pagada {
      background: #dcfce7;
      color: #166534;
    }
    
    .estado-pendiente {
      background: #fef3c7;
      color: #92400e;
    }
    
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 11px;
      line-height: 1.8;
    }
    
    .footer strong {
      color: #475569;
    }
    
    .bank-info {
      background: #f8fafc;
      padding: 15px 20px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    
    .bank-info-title {
      font-weight: bold;
      color: #334155;
      margin-bottom: 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${
          logoBase64
            ? `<img src="${logoBase64}" alt="${company.company_name}" class="logo-image">`
            : `<div class="logo-text">${company.company_name}</div>`
        }
        <div class="business-info">
          <strong>NIF:</strong> ${company.company_nif}<br>
          ${company.company_address}<br>
          ${company.company_city}<br>
          <strong>Tel:</strong> ${company.company_phone}<br>
          <strong>Email:</strong> ${company.company_email}
          ${company.company_website ? `<br><strong>Web:</strong> ${company.company_website}` : ''}
        </div>
      </div>
      
      <div class="document-info">
        <div class="document-type">${tipo}</div>
        <div class="document-number">${invoice.numero}</div>
        <div class="document-date">${fechaFormateada}</div>
      </div>
    </div>
    
    <!-- Customer Info -->
    <div class="customer-section">
      <div class="customer-title">Cliente</div>
      <div class="customer-name">
        ${invoice.customer.name}${invoice.customer.surname ? ' ' + invoice.customer.surname : ''}
      </div>
      <div class="customer-details">
        ${invoice.customer.dni ? `<strong>DNI/NIF:</strong> ${invoice.customer.dni}<br>` : ''}
        ${invoice.customer.email ? `<strong>Email:</strong> ${invoice.customer.email}<br>` : ''}
        ${invoice.customer.phone ? `<strong>Teléfono:</strong> ${invoice.customer.phone}<br>` : ''}
        ${invoice.customer.address ? `<strong>Dirección:</strong> ${invoice.customer.address}` : ''}
      </div>
    </div>
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-center">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td>${item.descripcion}</td>
            <td class="text-center">${item.cantidad}</td>
            <td class="text-right">€${parseFloat(String(item.precio_unitario)).toFixed(2)}</td>
            <td class="text-right">€${parseFloat(String(item.total)).toFixed(2)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row subtotal">
          <span>Base imponible:</span>
          <span>€${parseFloat(String(invoice.subtotal)).toFixed(2)}</span>
        </div>
        <div class="total-row iva">
          <span>IVA (${(company.iva_rate * 100).toFixed(0)}%):</span>
          <span>€${parseFloat(String(invoice.iva)).toFixed(2)}</span>
        </div>
        <div class="total-row final">
          <span>TOTAL:</span>
          <span>€${parseFloat(String(invoice.total)).toFixed(2)}</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Info -->
    ${
      invoice.metodo_pago
        ? `
    <div class="payment-info">
      <div class="payment-info-title">Método de Pago</div>
      <div class="payment-method">${formatMetodoPago(invoice.metodo_pago)}</div>
    </div>
    `
        : ''
    }
    
    <!-- Bank Info (solo para facturas) -->
    ${
      invoice.tipo === 'FACTURA' && company.bank_iban
        ? `
    <div class="bank-info">
      <div class="bank-info-title">Datos Bancarios</div>
      ${company.bank_name ? `<strong>Banco:</strong> ${company.bank_name}<br>` : ''}
      ${company.bank_iban ? `<strong>IBAN:</strong> ${company.bank_iban}<br>` : ''}
      ${company.bank_swift ? `<strong>SWIFT/BIC:</strong> ${company.bank_swift}` : ''}
    </div>
    `
        : ''
    }
    
    <!-- Estado -->
    <div style="margin-bottom: 30px;">
      <span class="estado-badge ${invoice.estado === 'PAGADA' ? 'estado-pagada' : 'estado-pendiente'}">
        ${invoice.estado}
      </span>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>${company.invoice_footer_text || `Gracias por confiar en ${company.company_name}`}</strong><br>
        Este documento ha sido generado electrónicamente.<br>
        Para cualquier consulta, contacte con nosotros en ${company.company_email}
      </p>
    </div>
  </div>
</body>
</html>
  `
}

function formatMetodoPago(metodoPago: string): string {
  const metodos: { [key: string]: string } = {
    EFECTIVO: '💵 Efectivo',
    TPV_SUMUP: '💳 TPV SUMUP',
    TPV_UNICAJA: '💳 TPV UNICAJA',
    TARJETA: '💳 Tarjeta',
    TRANSFERENCIA: '🏦 Transferencia Bancaria',
  }
  return metodos[metodoPago] || metodoPago
}
