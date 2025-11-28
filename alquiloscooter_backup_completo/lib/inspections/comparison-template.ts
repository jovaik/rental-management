
/**
 * Template HTML para comparativa de inspecciones (ENTREGA vs DEVOLUCIÓN)
 * Sigue la misma arquitectura que los contratos
 */

interface InspectionComparisonData {
  booking: any;
  customer: any;
  vehicle: any;
  deliveryInspection: any;
  returnInspection: any;
}

/**
 * Genera HTML completo para PDF comparativo de inspecciones
 * Este HTML será procesado por el mismo motor PDF que los contratos (generateContractPDF)
 */
export function generateInspectionComparisonHTML(data: InspectionComparisonData): string {
  const { booking, customer, vehicle, deliveryInspection, returnInspection } = data;
  
  // Helper para formatear fechas
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparativa de Inspecciones - ${booking.booking_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
      padding: 15mm;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #FF6B35;
    }
    
    .header h1 {
      color: #FF6B35;
      font-size: 20pt;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .header h2 {
      color: #666;
      font-size: 14pt;
      font-weight: normal;
    }
    
    .info-section {
      margin: 15px 0;
      padding: 12px;
      background: #f8f8f8;
      border-left: 4px solid #FF6B35;
    }
    
    .info-section h3 {
      color: #FF6B35;
      font-size: 12pt;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 9pt;
    }
    
    .info-item {
      padding: 5px 0;
    }
    
    .info-item strong {
      color: #555;
      display: inline-block;
      min-width: 130px;
    }
    
    .comparison-title {
      text-align: center;
      margin: 30px 0 20px 0;
      padding: 15px;
      background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
      color: white;
      border-radius: 8px;
    }
    
    .comparison-title h2 {
      font-size: 16pt;
      margin: 0;
    }
    
    .comparison-container {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    .comparison-table th {
      background: #FF6B35;
      color: white;
      padding: 12px;
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
    }
    
    .comparison-table td {
      padding: 15px;
      vertical-align: top;
      border: 1px solid #ddd;
      width: 50%;
    }
    
    .inspection-column {
      background: white;
    }
    
    .inspection-column h4 {
      color: #FF6B35;
      font-size: 10pt;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .inspection-data {
      font-size: 9pt;
      margin: 8px 0;
    }
    
    .inspection-data strong {
      color: #666;
      display: inline-block;
      min-width: 100px;
    }
    
    .photo-container {
      margin: 15px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .photo-container img {
      width: 100%;
      max-width: 100%;
      height: auto;
      border: 2px solid #e0e0e0;
      border-radius: 4px;
      margin: 8px 0;
    }
    
    .photo-label {
      font-size: 9pt;
      color: #666;
      font-weight: bold;
      margin-top: 5px;
      text-transform: uppercase;
    }
    
    .damages-section {
      margin: 25px 0;
      padding: 15px;
      background: #fff8f8;
      border-left: 4px solid #d9534f;
      page-break-inside: avoid;
    }
    
    .damages-section h3 {
      color: #d9534f;
      font-size: 12pt;
      margin-bottom: 12px;
    }
    
    .damage-item {
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-left: 3px solid #d9534f;
    }
    
    .notes-section {
      margin: 20px 0;
      padding: 12px;
      background: #fffef5;
      border: 1px solid #ffd700;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    
    .notes-section h4 {
      color: #856404;
      font-size: 11pt;
      margin-bottom: 8px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 8pt;
      color: #888;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body {
        padding: 10mm;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <h1>📊 COMPARATIVA DE INSPECCIONES</h1>
    <h2>ENTREGA vs DEVOLUCIÓN</h2>
  </div>
  
  <!-- INFORMACIÓN DE LA RESERVA -->
  <div class="info-section">
    <h3>📋 Información de la Reserva</h3>
    <div class="info-grid">
      <div class="info-item"><strong>Nº Reserva:</strong> ${booking.booking_number}</div>
      <div class="info-item"><strong>Cliente:</strong> ${customer.first_name || ''} ${customer.last_name || ''}</div>
      <div class="info-item"><strong>DNI/NIE:</strong> ${customer.dni || 'N/A'}</div>
      <div class="info-item"><strong>Fecha Recogida:</strong> ${formatDate(booking.pickup_date)}</div>
      <div class="info-item"><strong>Fecha Devolución:</strong> ${formatDate(booking.return_date)}</div>
    </div>
  </div>
  
  <!-- INFORMACIÓN DEL VEHÍCULO -->
  <div class="info-section">
    <h3>🏍️ Información del Vehículo</h3>
    <div class="info-grid">
      <div class="info-item"><strong>Marca/Modelo:</strong> ${vehicle.make} ${vehicle.model}</div>
      <div class="info-item"><strong>Matrícula:</strong> ${vehicle.registration_number}</div>
      <div class="info-item"><strong>Año:</strong> ${vehicle.year || 'N/A'}</div>
      <div class="info-item"><strong>Color:</strong> ${vehicle.color || 'N/A'}</div>
    </div>
  </div>
  
  <!-- TÍTULO DE COMPARATIVA -->
  <div class="comparison-title">
    <h2>COMPARATIVA LADO A LADO</h2>
  </div>
  
  <!-- DATOS DE LAS INSPECCIONES -->
  <div class="comparison-container">
    <table class="comparison-table">
      <thead>
        <tr>
          <th>🚀 INSPECCIÓN DE ENTREGA</th>
          <th>🏁 INSPECCIÓN DE DEVOLUCIÓN</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="inspection-column">
            <h4>Datos de Entrega</h4>
            <div class="inspection-data">
              <strong>Fecha:</strong> ${formatDate(deliveryInspection.inspection_date)}
            </div>
            <div class="inspection-data">
              <strong>Odómetro:</strong> ${deliveryInspection.odometer_reading || 'N/A'} km
            </div>
            <div class="inspection-data">
              <strong>Combustible:</strong> ${deliveryInspection.fuel_level || 'N/A'}
            </div>
            <div class="inspection-data">
              <strong>Estado General:</strong> ${deliveryInspection.general_condition || 'N/A'}
            </div>
            ${deliveryInspection.notes ? `
              <div class="notes-section">
                <h4>📝 Observaciones</h4>
                <p>${deliveryInspection.notes}</p>
              </div>
            ` : ''}
          </td>
          <td class="inspection-column">
            <h4>Datos de Devolución</h4>
            <div class="inspection-data">
              <strong>Fecha:</strong> ${formatDate(returnInspection.inspection_date)}
            </div>
            <div class="inspection-data">
              <strong>Odómetro:</strong> ${returnInspection.odometer_reading || 'N/A'} km
            </div>
            <div class="inspection-data">
              <strong>Combustible:</strong> ${returnInspection.fuel_level || 'N/A'}
            </div>
            <div class="inspection-data">
              <strong>Estado General:</strong> ${returnInspection.general_condition || 'N/A'}
            </div>
            ${returnInspection.notes ? `
              <div class="notes-section">
                <h4>📝 Observaciones</h4>
                <p>${returnInspection.notes}</p>
              </div>
            ` : ''}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- FOTOS FRONTALES -->
  ${deliveryInspection.front_photo || returnInspection.front_photo ? `
    <div class="page-break"></div>
    <div class="comparison-title">
      <h2>📸 VISTA FRONTAL</h2>
    </div>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Entrega</th>
          <th>Devolución</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="inspection-column">
            ${deliveryInspection.front_photo ? `
              <div class="photo-container">
                <img src="${deliveryInspection.front_photo}" alt="Vista frontal entrega">
                <div class="photo-label">Vista Frontal - Entrega</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
          <td class="inspection-column">
            ${returnInspection.front_photo ? `
              <div class="photo-container">
                <img src="${returnInspection.front_photo}" alt="Vista frontal devolución">
                <div class="photo-label">Vista Frontal - Devolución</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
        </tr>
      </tbody>
    </table>
  ` : ''}
  
  <!-- FOTOS LATERALES IZQUIERDA -->
  ${deliveryInspection.left_photo || returnInspection.left_photo ? `
    <div class="page-break"></div>
    <div class="comparison-title">
      <h2>📸 LADO IZQUIERDO</h2>
    </div>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Entrega</th>
          <th>Devolución</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="inspection-column">
            ${deliveryInspection.left_photo ? `
              <div class="photo-container">
                <img src="${deliveryInspection.left_photo}" alt="Lado izquierdo entrega">
                <div class="photo-label">Lado Izquierdo - Entrega</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
          <td class="inspection-column">
            ${returnInspection.left_photo ? `
              <div class="photo-container">
                <img src="${returnInspection.left_photo}" alt="Lado izquierdo devolución">
                <div class="photo-label">Lado Izquierdo - Devolución</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
        </tr>
      </tbody>
    </table>
  ` : ''}
  
  <!-- FOTOS TRASERAS -->
  ${deliveryInspection.rear_photo || returnInspection.rear_photo ? `
    <div class="page-break"></div>
    <div class="comparison-title">
      <h2>📸 VISTA TRASERA</h2>
    </div>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Entrega</th>
          <th>Devolución</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="inspection-column">
            ${deliveryInspection.rear_photo ? `
              <div class="photo-container">
                <img src="${deliveryInspection.rear_photo}" alt="Vista trasera entrega">
                <div class="photo-label">Vista Trasera - Entrega</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
          <td class="inspection-column">
            ${returnInspection.rear_photo ? `
              <div class="photo-container">
                <img src="${returnInspection.rear_photo}" alt="Vista trasera devolución">
                <div class="photo-label">Vista Trasera - Devolución</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
        </tr>
      </tbody>
    </table>
  ` : ''}
  
  <!-- FOTOS LATERALES DERECHA -->
  ${deliveryInspection.right_photo || returnInspection.right_photo ? `
    <div class="page-break"></div>
    <div class="comparison-title">
      <h2>📸 LADO DERECHO</h2>
    </div>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Entrega</th>
          <th>Devolución</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="inspection-column">
            ${deliveryInspection.right_photo ? `
              <div class="photo-container">
                <img src="${deliveryInspection.right_photo}" alt="Lado derecho entrega">
                <div class="photo-label">Lado Derecho - Entrega</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
          <td class="inspection-column">
            ${returnInspection.right_photo ? `
              <div class="photo-container">
                <img src="${returnInspection.right_photo}" alt="Lado derecho devolución">
                <div class="photo-label">Lado Derecho - Devolución</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
        </tr>
      </tbody>
    </table>
  ` : ''}
  
  <!-- FOTOS ODÓMETRO -->
  ${deliveryInspection.odometer_photo || returnInspection.odometer_photo ? `
    <div class="page-break"></div>
    <div class="comparison-title">
      <h2>📸 ODÓMETRO</h2>
    </div>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Entrega</th>
          <th>Devolución</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="inspection-column">
            ${deliveryInspection.odometer_photo ? `
              <div class="photo-container">
                <img src="${deliveryInspection.odometer_photo}" alt="Odómetro entrega">
                <div class="photo-label">Odómetro - Entrega</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
          <td class="inspection-column">
            ${returnInspection.odometer_photo ? `
              <div class="photo-container">
                <img src="${returnInspection.odometer_photo}" alt="Odómetro devolución">
                <div class="photo-label">Odómetro - Devolución</div>
              </div>
            ` : '<p style="text-align: center; color: #999;">No disponible</p>'}
          </td>
        </tr>
      </tbody>
    </table>
  ` : ''}
  
  <!-- DAÑOS (SI EXISTEN) -->
  ${returnInspection.damages && returnInspection.damages.length > 0 ? `
    <div class="page-break"></div>
    <div class="damages-section">
      <h3>⚠️ Daños Registrados en Devolución</h3>
      ${returnInspection.damages.map((damage: any) => `
        <div class="damage-item">
          <strong>Ubicación:</strong> ${damage.location}<br>
          <strong>Descripción:</strong> ${damage.description}<br>
          ${damage.severity ? `<strong>Severidad:</strong> ${damage.severity}<br>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}
  
  <!-- FOOTER -->
  <div class="footer">
    <p>Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
    <p>Comparativa de inspecciones - Reserva ${booking.booking_number}</p>
    <p>© ${new Date().getFullYear()} Alquiloscooter - Todos los derechos reservados</p>
  </div>
</body>
</html>
  `;
}
