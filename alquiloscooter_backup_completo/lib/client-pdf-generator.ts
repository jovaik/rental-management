
/**
 * CLIENT-SIDE PDF GENERATOR
 * Genera PDFs directamente en el navegador del usuario
 * SIN dependencias del servidor
 * 100% confiable
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InspectionData {
  booking_number: string;
  customer_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_registration: string;
  delivery_date?: string;
  return_date?: string;
  delivery_photos?: {
    frontal?: string;
    lateral_izquierdo?: string;
    trasera?: string;
    lateral_derecho?: string;
    odometro?: string;
    damages?: Array<{ url: string; description: string }>;
  };
  return_photos?: {
    frontal?: string;
    lateral_izquierdo?: string;
    trasera?: string;
    lateral_derecho?: string;
    odometro?: string;
    damages?: Array<{ url: string; description: string }>;
  };
}

/**
 * Genera un PDF de comparación de inspecciones
 * @param data Datos de la inspección
 * @returns Promise<Blob> PDF generado
 */
export async function generateInspectionComparisonPDF(
  data: InspectionData
): Promise<Blob> {
  try {
    // Crear contenedor HTML temporal
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.background = '#ffffff';
    container.style.padding = '40px';
    
    // Generar HTML del PDF
    container.innerHTML = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="text-align: center; color: #333;">Comparativa de Inspecciones</h1>
        <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
          <p><strong>Reserva:</strong> ${data.booking_number}</p>
          <p><strong>Cliente:</strong> ${data.customer_name}</p>
          <p><strong>Vehículo:</strong> ${data.vehicle_make} ${data.vehicle_model} (${data.vehicle_registration})</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
          <!-- Inspección de Entrega -->
          <div>
            <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              Inspección de Entrega
            </h2>
            <p><strong>Fecha:</strong> ${data.delivery_date || 'N/A'}</p>
            
            ${data.delivery_photos?.frontal ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Frontal:</p>
                <img src="${data.delivery_photos.frontal}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.delivery_photos?.lateral_izquierdo ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Lateral Izquierdo:</p>
                <img src="${data.delivery_photos.lateral_izquierdo}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.delivery_photos?.trasera ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Trasera:</p>
                <img src="${data.delivery_photos.trasera}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.delivery_photos?.lateral_derecho ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Lateral Derecho:</p>
                <img src="${data.delivery_photos.lateral_derecho}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.delivery_photos?.odometro ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Odómetro:</p>
                <img src="${data.delivery_photos.odometro}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
          </div>

          <!-- Inspección de Devolución -->
          <div>
            <h2 style="color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px;">
              Inspección de Devolución
            </h2>
            <p><strong>Fecha:</strong> ${data.return_date || 'N/A'}</p>
            
            ${data.return_photos?.frontal ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Frontal:</p>
                <img src="${data.return_photos.frontal}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.return_photos?.lateral_izquierdo ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Lateral Izquierdo:</p>
                <img src="${data.return_photos.lateral_izquierdo}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.return_photos?.trasera ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Trasera:</p>
                <img src="${data.return_photos.trasera}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.return_photos?.lateral_derecho ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Lateral Derecho:</p>
                <img src="${data.return_photos.lateral_derecho}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
            
            ${data.return_photos?.odometro ? `
              <div style="margin: 15px 0;">
                <p style="font-weight: bold;">Odómetro:</p>
                <img src="${data.return_photos.odometro}" style="width: 100%; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Generar canvas desde HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    // Eliminar contenedor temporal
    document.body.removeChild(container);

    // Crear PDF desde canvas
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // Retornar como Blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generando PDF en cliente:', error);
    throw error;
  }
}

/**
 * Descarga un PDF generado
 * @param blob Blob del PDF
 * @param filename Nombre del archivo
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
