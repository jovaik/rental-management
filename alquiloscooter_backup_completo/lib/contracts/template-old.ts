// Plantilla del contrato de alquiler en formato HTML moderno
export const CONTRACT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="{{LANGUAGE}}">
<head>
  <meta charset="UTF-8">
  <title>Contrato {{CONTRACT_NUMBER}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 12px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 4px solid {{PRIMARY_COLOR}}; }
    .logo-section { flex: 1; }
    .logo-image { max-width: 180px; max-height: 70px; margin-bottom: 8px; }
    .logo-text { font-size: 28px; font-weight: bold; color: {{PRIMARY_COLOR}}; margin-bottom: 6px; }
    .company-tagline { font-size: 11px; color: #64748b; font-style: italic; }
    .document-badge { background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}}); color: white; padding: 18px 25px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .document-title { font-size: 14px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
    .document-number { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .document-date { font-size: 11px; opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .info-card { background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid {{PRIMARY_COLOR}}; }
    .info-card-title { font-size: 10px; font-weight: bold; color: {{PRIMARY_COLOR}}; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .info-item { margin-bottom: 6px; font-size: 11px; }
    .info-label { font-weight: 600; color: #475569; display: inline-block; min-width: 100px; }
    .info-value { color: #1e293b; }
    .section-title { background: linear-gradient(90deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}}); color: white; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-weight: bold; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .conditions-list { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
    .condition-item { margin-bottom: 12px; padding-left: 18px; position: relative; font-size: 11px; }
    .condition-item:before { content: "→"; position: absolute; left: 0; color: {{PRIMARY_COLOR}}; font-weight: bold; font-size: 14px; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin: 16px 0; border-radius: 4px; }
    .warning-box-title { font-weight: bold; color: #92400e; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .article-section { background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
    .article-title { color: {{PRIMARY_COLOR}}; font-size: 12px; font-weight: bold; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid {{PRIMARY_COLOR}}30; }
    .article-content { font-size: 11px; color: #334155; line-height: 1.7; }
    .article-list { list-style: upper-alpha; padding-left: 20px; margin-top: 8px; }
    .article-list li { margin-bottom: 8px; padding-left: 4px; font-size: 11px; }
    .signature-section { background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 25px; border-radius: 10px; margin-top: 30px; border: 2px solid {{PRIMARY_COLOR}}30; page-break-inside: avoid; }
    .signature-title { color: {{PRIMARY_COLOR}}; font-size: 16px; font-weight: bold; margin-bottom: 16px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
    .signature-declarations { background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid {{PRIMARY_COLOR}}; }
    .declaration-item { margin-bottom: 10px; font-size: 11px; padding-left: 18px; position: relative; }
    .declaration-item:before { content: "✓"; position: absolute; left: 0; color: {{PRIMARY_COLOR}}; font-weight: bold; font-size: 14px; }
    .signature-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #cbd5e1; }
    .signature-item { text-align: center; font-size: 10px; }
    .signature-label { font-weight: bold; color: #475569; margin-bottom: 4px; }
    .signature-value { color: {{PRIMARY_COLOR}}; font-weight: 600; }
    .footer { text-align: center; padding-top: 25px; margin-top: 30px; border-top: 3px solid {{PRIMARY_COLOR}}; color: #64748b; font-size: 10px; }
    .footer-brand { color: {{PRIMARY_COLOR}}; font-weight: bold; font-size: 12px; margin-bottom: 8px; }
    .inspection-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 2px solid {{PRIMARY_COLOR}}; page-break-before: always; }
    .inspection-photos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
    .inspection-photo { border: 2px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .inspection-photo img { width: 100%; height: auto; display: block; }
    .inspection-photo-label { background: {{PRIMARY_COLOR}}; color: white; padding: 6px; text-align: center; font-size: 10px; font-weight: bold; }
    .inspection-info { background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid {{PRIMARY_COLOR}}; }
    @media print { body { padding: 10px; } .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">{{LOGO_HTML}}<div class="company-tagline">Alquiler de Vehículos</div></div>
      <div class="document-badge"><div class="document-title">Contrato de Alquiler</div><div class="document-number">{{CONTRACT_NUMBER}}</div><div class="document-date">{{CONTRACT_DATE}}</div></div>
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">📋 Datos del Cliente</div>
        <div class="info-item"><span class="info-label">Nombre:</span><span class="info-value">{{CUSTOMER_FULLNAME}}</span></div>
        <div class="info-item"><span class="info-label">DNI/NIE:</span><span class="info-value">{{CUSTOMER_DNI}}</span></div>
        <div class="info-item"><span class="info-label">Teléfono:</span><span class="info-value">{{CUSTOMER_PHONE}}</span></div>
        <div class="info-item"><span class="info-label">Email:</span><span class="info-value">{{CUSTOMER_EMAIL}}</span></div>
        <div class="info-item"><span class="info-label">Dirección:</span><span class="info-value">{{CUSTOMER_ADDRESS}}</span></div>
        <div class="info-item"><span class="info-label">Carnet:</span><span class="info-value">{{DRIVER_LICENSE}}</span></div>
      </div>
      
      <div class="info-card">
        <div class="info-card-title">📅 Datos de la Reserva</div>
        <div class="info-item"><span class="info-label">Recogida:</span><span class="info-value">{{PICKUP_DATE}}</span></div>
        <div class="info-item"><span class="info-label">Lugar:</span><span class="info-value">{{PICKUP_LOCATION}}</span></div>
        <div class="info-item" style="margin-top: 12px;"><span class="info-label">Devolución:</span><span class="info-value">{{RETURN_DATE}}</span></div>
        <div class="info-item"><span class="info-label">Lugar:</span><span class="info-value">{{RETURN_LOCATION}}</span></div>
      </div>
    </div>

    {{ADDITIONAL_DRIVERS_SECTION}}

    <div class="section-title">💰 Desglose de Precios</div>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
      <thead>
        <tr style="background: {{PRIMARY_COLOR}}; color: white;">
          <th style="padding: 12px; text-align: left; font-size: 11px;">Descripción</th>
          <th style="padding: 12px; text-align: center; font-size: 11px; width: 100px;">Precio Unit.</th>
          <th style="padding: 12px; text-align: center; font-size: 11px; width: 80px;">Cantidad</th>
          <th style="padding: 12px; text-align: right; font-size: 11px; width: 100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{VEHICLES_TABLE_ROWS}}
        {{EXTRAS_TABLE_ROWS}}
        {{UPGRADES_TABLE_ROWS}}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; border-top: 2px solid {{PRIMARY_COLOR}};">
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px;">Subtotal (Base Imponible):</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px;">{{SUBTOTAL}}€</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td colspan="3" style="padding: 12px; text-align: right; font-size: 11px;">IVA (21%):</td>
          <td style="padding: 12px; text-align: right; font-size: 11px;">{{IVA}}€</td>
        </tr>
        <tr style="background: {{PRIMARY_COLOR}}; color: white;">
          <td colspan="3" style="padding: 14px; text-align: right; font-weight: bold; font-size: 14px;">TOTAL:</td>
          <td style="padding: 14px; text-align: right; font-weight: bold; font-size: 14px;">{{TOTAL_PRICE}}€</td>
        </tr>
      </tfoot>
    </table>

    <div class="section-title">🚗 Información de los Vehículos</div>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; margin-bottom: 20px; font-size: 11px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid {{PRIMARY_COLOR}};">
          <th style="padding: 10px; text-align: left;">Vehículo</th>
          <th style="padding: 10px; text-align: center;">Matrícula</th>
          <th style="padding: 10px; text-align: center;">Días</th>
        </tr>
      </thead>
      <tbody>
        {{VEHICLES_INFO_ROWS}}
      </tbody>
    </table>

    {{COMMENTS_SECTION}}

    <div class="section-title">📑 Condiciones Generales</div>
    <div class="conditions-list">
      <div class="condition-item"><strong>Alquiler:</strong> Cubre el periodo contratado.</div>
      <div class="condition-item"><strong>Casco:</strong> El uso del mismo es obligatorio.</div>
      <div class="condition-item"><strong>Pasajeros:</strong> Máximo 2 personas incluido el conductor, siempre con cascos.</div>
      <div class="condition-item"><strong>Robo:</strong> En caso de sustracción, perderá la cantidad abonada.</div>
      <div class="condition-item"><strong>Devolución:</strong> Recargo adicional de un día si no se devuelve a tiempo.</div>
      <div class="condition-item"><strong>Zona marítima:</strong> Conducir en zonas marítimas anula el contrato y el seguro.</div>
    </div>
    
    <div class="warning-box">
      <div class="warning-box-title">⚠️ Importante</div>
      <ul style="margin-left: 20px; font-size: 11px; line-height: 1.7;">
        <li>NO DEJE OBJETOS EN EL INTERIOR Y CIERRE LA MOTO</li>
        <li>ES OBLIGATORIO LLEVAR ESTE CONTRATO EN LA MOTO O EN SU MÓVIL</li>
        <li>LA PÉRDIDA O DAÑO DE LOS CASCOS: 50€ POR UNIDAD</li>
        <li>DEVOLUCIÓN CON MENOS GASOLINA: 10€ + IMPORTE DE LA GASOLINA</li>
        <li>NO SALIR DE LOS LÍMITES DE LA CIUDAD (50cc) O PROVINCIA (resto)</li>
        <li>SANCIONES: Importe + 30€ de gastos de gestión</li>
      </ul>
    </div>

    <div class="page-break"></div>

    <div class="section-title">📜 Artículos del Contrato</div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 1º. UTILIZACIÓN DEL VEHÍCULO</div>
      <div class="article-content">
        <p style="margin-bottom: 10px;">El CLIENTE se obliga a no dejar conducir el vehículo a otras personas, salvo las expresamente aceptadas por ALQUILOSCOOTER.</p>
        <p style="margin-bottom: 8px;"><strong>El CLIENTE se obliga a no conducir ni permitir que se conduzca el vehículo:</strong></p>
        <ul class="article-list">
          <li>Para transporte a título oneroso de pasajeros o mercancías.</li>
          <li>Para empujar o remolcar cualquier vehículo u objeto.</li>
          <li>Para participar en competiciones deportivas.</li>
          <li>Por personas bajo efectos de alcohol, drogas o fármacos.</li>
          <li>Con fines ilícitos o transporte de mercancías prohibidas.</li>
          <li>Transportando más pasajeros del permitido.</li>
          <li>Por personas menores de 23 años o sin carnet con 3 años de antigüedad.</li>
          <li>Negligentemente (debe cerrar el vehículo y conservar las llaves).</li>
          <li>Como propio (no puede ceder, vender o hipotecar el vehículo).</li>
        </ul>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 2º. ESTADO DEL VEHÍCULO</div>
      <div class="article-content">
        <p>El CLIENTE reconoce haber recibido el vehículo en perfecto estado de marcha y limpieza. En caso de deterioro no debido al uso normal, deberá reemplazar inmediatamente las piezas afectadas o satisfacer el importe del daño.</p>
        <p style="margin-top: 10px;"><strong>IMPORTANTE:</strong> El vehículo se entrega rotulado con vinilos identificativos. Debe devolverse con todos los vinilos. La falta de alguno supondrá la pérdida de la fianza.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 3º. PRECIO, DEPÓSITO Y PROLONGACIÓN</div>
      <div class="article-content">
        <ul class="article-list" style="list-style: disc;">
          <li>El precio se determina por las tarifas vigentes.</li>
          <li>La fianza no puede servir para prolongar el arrendamiento.</li>
          <li>Para prolongar el contrato se requiere autorización escrita y pago correspondiente.</li>
          <li>Retraso de más de 30 min: cargo extra de un día de tarifa normal.</li>
          <li>Exceder 24h el día de retorno: pérdida de fianza + acciones legales.</li>
          <li>Devolución anticipada: no hay devolución de cantidades pagadas.</li>
        </ul>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 4º. PAGOS</div>
      <div class="article-content">
        <p style="margin-bottom: 8px;"><strong>El CLIENTE se obliga a pagar:</strong></p>
        <ul class="article-list">
          <li>Cantidades según tarifa por la duración del alquiler.</li>
          <li>60€ por servicio entre distintas ciudades no autorizado.</li>
          <li>Impuestos, tasas y contribuciones aplicables.</li>
          <li>Multas, gastos e impuestos por infracciones durante el contrato.</li>
          <li>Gastos por reparación de daños ocasionados por colisión u otros motivos.</li>
          <li>Fianza (depósito) de hasta 2.500€ para garantizar devolución en perfectas condiciones.</li>
        </ul>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 5º. SEGUROS, GARANTÍAS Y COBERTURAS</div>
      <div class="article-content">
        <p style="margin-bottom: 10px;">El vehículo está asegurado con SEGUROS CASER con las siguientes coberturas:</p>
        <ul class="article-list">
          <li><strong>Responsabilidad Civil Obligatoria:</strong> Según ley vigente.</li>
          <li><strong>RC Voluntaria:</strong> Hasta 50M de Euros.</li>
          <li><strong>Defensa Jurídica:</strong> Asistencia legal en procedimientos derivados de accidentes.</li>
          <li><strong>Seguro del Conductor:</strong> 18.000€ por muerte e invalidez.</li>
          <li><strong>Asistencia en Viaje:</strong> Radio máximo de 20km desde base.</li>
        </ul>
        <p style="margin-top: 10px;"><strong>En caso de accidente, el CLIENTE debe:</strong></p>
        <ul style="margin-left: 20px; margin-top: 6px; font-size: 11px;">
          <li>Informar a ALQUILOSCOOTER en 24 horas</li>
          <li>Avisar a la policía en caso de daños o sustracción</li>
          <li>Hacer constar todas las circunstancias del accidente</li>
          <li>No discutir responsabilidad ni transigir con terceros</li>
          <li>No abandonar el vehículo sin protegerlo</li>
        </ul>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 6º. ROBO</div>
      <div class="article-content">
        <p><strong>EL CLIENTE SERÁ RESPONSABLE DEL ROBO O SUSTRACCIÓN DEL VEHÍCULO</strong> (excepto clientes con tarifa PREMIUM que limita la responsabilidad a la fianza depositada).</p>
        <p style="margin-top: 8px;">El CLIENTE autoriza a ALQUILOSCOOTER a cargar en su tarjeta de crédito el importe necesario para cubrir el valor del vehículo.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 7º. MANTENIMIENTO Y REPARACIONES</div>
      <div class="article-content">
        <p>El desgaste mecánico por uso normal lo asume ALQUILOSCOOTER. Las reparaciones sólo pueden efectuarse con acuerdo escrito de ALQUILOSCOOTER.</p>
        <p style="margin-top: 10px;"><strong>Para alquileres de larga temporada:</strong> Revisiones obligatorias cada 3.000 km. No hacerlas supone pérdida de fianza y el CLIENTE asume todos los costes de reparación.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 8º. GASOLINA Y ACEITE</div>
      <div class="article-content">
        <p>La gasolina es a cargo del CLIENTE. Debe comprobar constantemente los niveles de agua, aceite y presión de neumáticos.</p>
        <p style="margin-top: 8px;"><strong>CUALQUIER AVERÍA POR FALTA DE CONTROL DE ESTOS NIVELES SERÁ RESPONSABILIDAD DEL CLIENTE.</strong></p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 9º. RESPONSABILIDAD</div>
      <div class="article-content">
        <p>El CLIENTE responde penalmente de las infracciones cometidas durante la conducción y estacionamiento del vehículo.</p>
        <p style="margin-top: 8px;">En caso de infracciones notificadas después de la finalización del contrato, el CLIENTE autoriza el cargo en su tarjeta de crédito del importe de la sanción.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 10º. VALIDEZ DEL CONTRATO</div>
      <div class="article-content">
        <p>Cualquier modificación de las cláusulas del presente contrato deberá constar expresamente por escrito, sin lo cual será nula.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">ARTÍCULO 11º. LEGISLACIÓN APLICABLE</div>
      <div class="article-content">
        <p>El presente contrato se rige por las leyes españolas. Las cuestiones que se susciten son de competencia de los Juzgados y tribunales de Málaga.</p>
      </div>
    </div>

    <div class="article-section">
      <div class="article-title">📋 PROTECCIÓN DE DATOS</div>
      <div class="article-content">
        <p>De acuerdo con la LOPD 15/99 y el RLOPD, los datos personales facilitados serán incluidos en los ficheros de GRUPO SERVYTUR (JOSE M.MILLAN FERNANDEZ), para gestión administrativa, contable y comercial.</p>
        <p style="margin-top: 8px;">Sus datos pueden ser cedidos a terceros directamente relacionados cuando sea necesario. Puede ejercer sus derechos de acceso, rectificación, oposición y cancelación mediante email certificado a info@alquiloscooter.com.</p>
      </div>
    </div>

    <div class="signature-section">
      <div class="signature-title">✍️ Firma del Contrato</div>
      <div class="signature-declarations">
        <div class="declaration-item">Haber leído y comprendido todas las cláusulas del contrato</div>
        <div class="declaration-item">Estar conforme con todas las condiciones establecidas</div>
        <div class="declaration-item">Que todos los datos proporcionados son veraces y exactos</div>
        <div class="declaration-item">Estar en posesión de la licencia necesaria para conducir este vehículo</div>
        <div class="declaration-item">Aceptar responsabilidad ante pérdida, robo, daño o perjuicio al vehículo</div>
        <div class="declaration-item">Autorizar cargos adicionales en tarjeta por gastos ocasionados</div>
      </div>
      <div class="signature-info">
        <div class="signature-item"><div class="signature-label">Fecha de firma</div><div class="signature-value">{{SIGNATURE_DATE}}</div></div>
        <div class="signature-item"><div class="signature-label">Hora de firma</div><div class="signature-value">{{SIGNATURE_TIME}}</div></div>
        <div class="signature-item"><div class="signature-label">IP del firmante</div><div class="signature-value">{{IP_ADDRESS}}</div></div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">{{COMPANY_NAME}}</div>
      <p>Este contrato ha sido generado electrónicamente y es válido sin firma manuscrita.<br>
      Para cualquier consulta, contacte con nosotros.</p>
    </div>
  </div>
</body>
</html>
`;

interface VehicleInfo {
  registration: string;
  make: string;
  model: string;
  pricePerDay: number;
  days: number;
  total: number;
}

interface Driver {
  fullName: string;
  license?: string;
}

interface ExtraUpgrade {
  description: string;
  priceUnit: number;
  quantity: number;
  total: number;
}

interface ContractData {
  contractNumber: string;
  contractDate: string;
  customerFullname: string;
  customerDni: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  driverLicense: string;
  
  // Múltiples vehículos
  vehicles: VehicleInfo[];
  
  // Conductores adicionales
  additionalDrivers?: Driver[];
  
  // Extras y upgrades
  extras?: ExtraUpgrade[];
  upgrades?: ExtraUpgrade[];
  
  pickupDate: string;
  returnDate: string;
  pickupLocation?: string;
  returnLocation?: string;
  
  // Precios desglosados
  subtotal: number;
  iva: number;
  totalPrice: string;
  
  // Comentarios especiales
  comments?: string;
  
  signatureDate?: string;
  signatureTime?: string;
  ipAddress?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoBase64?: string | null;
  companyName?: string;
}

export function generateContractHTML(data: ContractData): string {
  let contract = CONTRACT_HTML_TEMPLATE;
  
  // Colores corporativos
  const primaryColor = data.primaryColor || '#FF6B35';
  const secondaryColor = data.secondaryColor || '#FF8C42';
  
  // Logo HTML
  const logoHtml = data.logoBase64
    ? `<img src="${data.logoBase64}" alt="${data.companyName || 'Alquilo Scooter'}" class="logo-image">`
    : `<div class="logo-text">${data.companyName || 'Alquilo Scooter'}</div>`;
  
  // Generar sección de conductores adicionales
  let additionalDriversSection = '';
  if (data.additionalDrivers && data.additionalDrivers.length > 0) {
    additionalDriversSection = `
      <div class="info-card" style="margin-top: 20px;">
        <div class="info-card-title">👥 Conductores Adicionales Autorizados</div>
        ${data.additionalDrivers.map(driver => `
          <div class="info-item"><span class="info-label">Nombre:</span><span class="info-value">${driver.fullName}</span></div>
          ${driver.license ? `<div class="info-item"><span class="info-label">Carnet:</span><span class="info-value">${driver.license}</span></div>` : ''}
        `).join('')}
      </div>
    `;
  }
  
  // Generar filas de la tabla de vehículos
  const vehiclesTableRows = data.vehicles.map(vehicle => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px; font-size: 11px;">${vehicle.make} ${vehicle.model}</td>
      <td style="padding: 12px; text-align: center; font-size: 11px;">${vehicle.pricePerDay.toFixed(2)}€</td>
      <td style="padding: 12px; text-align: center; font-size: 11px;">${vehicle.days}</td>
      <td style="padding: 12px; text-align: right; font-size: 11px; font-weight: 600;">${vehicle.total.toFixed(2)}€</td>
    </tr>
  `).join('');
  
  // Generar filas de extras
  let extrasTableRows = '';
  if (data.extras && data.extras.length > 0) {
    extrasTableRows = data.extras.map(extra => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: #fef3c7;">
        <td style="padding: 12px; font-size: 11px;">🎯 ${extra.description}</td>
        <td style="padding: 12px; text-align: center; font-size: 11px;">${extra.priceUnit.toFixed(2)}€</td>
        <td style="padding: 12px; text-align: center; font-size: 11px;">${extra.quantity}</td>
        <td style="padding: 12px; text-align: right; font-size: 11px; font-weight: 600;">${extra.total.toFixed(2)}€</td>
      </tr>
    `).join('');
  }
  
  // Generar filas de upgrades
  let upgradesTableRows = '';
  if (data.upgrades && data.upgrades.length > 0) {
    upgradesTableRows = data.upgrades.map(upgrade => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: #dbeafe;">
        <td style="padding: 12px; font-size: 11px;">⭐ ${upgrade.description}</td>
        <td style="padding: 12px; text-align: center; font-size: 11px;">${upgrade.priceUnit.toFixed(2)}€</td>
        <td style="padding: 12px; text-align: center; font-size: 11px;">${upgrade.quantity}</td>
        <td style="padding: 12px; text-align: right; font-size: 11px; font-weight: 600;">${upgrade.total.toFixed(2)}€</td>
      </tr>
    `).join('');
  }
  
  // Generar filas de información de vehículos
  const vehiclesInfoRows = data.vehicles.map(vehicle => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px;">${vehicle.make} ${vehicle.model}</td>
      <td style="padding: 10px; text-align: center; font-weight: 600;">${vehicle.registration}</td>
      <td style="padding: 10px; text-align: center;">${vehicle.days} días</td>
    </tr>
  `).join('');
  
  // Generar sección de comentarios
  let commentsSection = '';
  if (data.comments) {
    commentsSection = `
      <div class="warning-box">
        <div class="warning-box-title">📝 Comentarios / Instrucciones Especiales</div>
        <p style="font-size: 11px; line-height: 1.7; margin-top: 8px;">${data.comments}</p>
      </div>
    `;
  }
  
  // Reemplazar todos los placeholders
  contract = contract.replace(/{{PRIMARY_COLOR}}/g, primaryColor);
  contract = contract.replace(/{{SECONDARY_COLOR}}/g, secondaryColor);
  contract = contract.replace(/{{LOGO_HTML}}/g, logoHtml);
  contract = contract.replace(/{{CONTRACT_NUMBER}}/g, data.contractNumber);
  contract = contract.replace(/{{CONTRACT_DATE}}/g, data.contractDate);
  contract = contract.replace(/{{CUSTOMER_FULLNAME}}/g, data.customerFullname);
  contract = contract.replace(/{{CUSTOMER_DNI}}/g, data.customerDni || 'No proporcionado');
  contract = contract.replace(/{{CUSTOMER_PHONE}}/g, data.customerPhone);
  contract = contract.replace(/{{CUSTOMER_EMAIL}}/g, data.customerEmail || 'No proporcionado');
  contract = contract.replace(/{{CUSTOMER_ADDRESS}}/g, data.customerAddress || 'No proporcionada');
  contract = contract.replace(/{{DRIVER_LICENSE}}/g, data.driverLicense || 'No proporcionado');
  contract = contract.replace(/{{PICKUP_DATE}}/g, data.pickupDate);
  contract = contract.replace(/{{RETURN_DATE}}/g, data.returnDate);
  contract = contract.replace(/{{PICKUP_LOCATION}}/g, data.pickupLocation || 'No especificada');
  contract = contract.replace(/{{RETURN_LOCATION}}/g, data.returnLocation || 'No especificada');
  contract = contract.replace(/{{ADDITIONAL_DRIVERS_SECTION}}/g, additionalDriversSection);
  contract = contract.replace(/{{VEHICLES_TABLE_ROWS}}/g, vehiclesTableRows);
  contract = contract.replace(/{{EXTRAS_TABLE_ROWS}}/g, extrasTableRows);
  contract = contract.replace(/{{UPGRADES_TABLE_ROWS}}/g, upgradesTableRows);
  contract = contract.replace(/{{VEHICLES_INFO_ROWS}}/g, vehiclesInfoRows);
  contract = contract.replace(/{{COMMENTS_SECTION}}/g, commentsSection);
  contract = contract.replace(/{{SUBTOTAL}}/g, data.subtotal.toFixed(2));
  contract = contract.replace(/{{IVA}}/g, data.iva.toFixed(2));
  contract = contract.replace(/{{TOTAL_PRICE}}/g, data.totalPrice);
  contract = contract.replace(/{{SIGNATURE_DATE}}/g, data.signatureDate || new Date().toLocaleDateString('es-ES'));
  contract = contract.replace(/{{SIGNATURE_TIME}}/g, data.signatureTime || new Date().toLocaleTimeString('es-ES'));
  contract = contract.replace(/{{IP_ADDRESS}}/g, data.ipAddress || 'No disponible');
  contract = contract.replace(/{{COMPANY_NAME}}/g, data.companyName || 'Alquilo Scooter');
  
  return contract;
}

// Esta función ya no se usa - el número de contrato se genera en la API usando el mismo sistema que facturas
export function generateContractNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${year}${month}${day}${random}`;
}

// Mantener compatibilidad con código antiguo
export const CONTRACT_TEMPLATE = CONTRACT_HTML_TEMPLATE;
export function generateContract(data: ContractData): string {
  return generateContractHTML(data);
}
