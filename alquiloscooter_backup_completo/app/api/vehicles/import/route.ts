
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Helper function to detect CSV delimiter
function detectDelimiter(line: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(d => ({ delimiter: d, count: line.split(d).length }));
  const max = counts.reduce((a, b) => a.count > b.count ? a : b);
  return max.count > 1 ? max.delimiter : ',';
}

// Helper function to parse CSV line properly
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values.map(v => v.replace(/^"|"$/g, '').trim());
}

// Helper to safely get value from row
function getValue(rowData: Record<string, string>, key: string): string {
  return rowData[key]?.trim() || '';
}

// Helper to parse integer
function parseIntSafe(str: string): number | null {
  if (!str || str.trim() === '') return null;
  const num = parseInt(str);
  return isNaN(num) ? null : num;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    console.log(`\n📁 IMPORTACIÓN INICIADA: ${file.name} (${file.size} bytes)`);

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ 
        error: 'El archivo está vacío',
        debug: { linesFound: lines.length }
      }, { status: 400 });
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCSVLine(lines[0], delimiter);
    const dataLines = lines.slice(1);

    console.log(`📊 Delimitador: "${delimiter}"`);
    console.log(`📋 Columnas: ${headers.join(', ')}`);
    console.log(`📄 Filas: ${dataLines.length}\n`);

    const results = {
      success: 0,
      errors: [] as string[],
      skipped: 0,
      debug: {
        totalLines: dataLines.length,
        delimiter,
        headers
      }
    };

    // Solo requiere columna Matrícula
    const matriculaIndex = headers.findIndex(h => 
      h.toLowerCase().includes('matr') || 
      h.toLowerCase() === 'matricula' || 
      h.toLowerCase() === 'registration'
    );

    if (matriculaIndex === -1) {
      return NextResponse.json({
        error: 'No se encontró columna de matrícula (debe contener "matrícula", "matricula" o "registration")',
        debug: { foundHeaders: headers }
      }, { status: 400 });
    }

    console.log(`✓ Columna matrícula encontrada en posición ${matriculaIndex}: "${headers[matriculaIndex]}"\n`);

    // Procesar líneas
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) {
        console.log(`⏭️  Línea ${i + 2}: vacía, omitiendo`);
        continue;
      }

      try {
        const values = parseCSVLine(line, delimiter);
        
        // Crear objeto con los datos
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index]?.trim() || '';
        });

        const registration = values[matriculaIndex]?.trim();

        if (!registration || registration.length < 2) {
          results.errors.push(`Línea ${i + 2}: Matrícula inválida "${registration}"`);
          console.log(`❌ Línea ${i + 2}: Matrícula inválida`);
          continue;
        }

        // Verificar si existe
        const existing = await prisma.carRentalCars.findFirst({
          where: { registration_number: registration }
        });

        if (existing) {
          results.skipped++;
          console.log(`⏭️  Línea ${i + 2}: ${registration} ya existe`);
          continue;
        }

        // Crear con valores mínimos
        const vehicleData: any = {
          registration_number: registration,
          status: 'T', // Activo por defecto
        };

        // Helper para parsear decimales
        const parseDecimalSafe = (str: string): number | null => {
          if (!str || str.trim() === '') return null;
          const num = parseFloat(str.replace(',', '.'));
          return isNaN(num) ? null : num;
        };

        // Agregar campos opcionales si existen en el CSV
        const marca = getValue(rowData, 'Marca') || getValue(rowData, 'Make');
        const modelo = getValue(rowData, 'Modelo') || getValue(rowData, 'Model');
        const año = parseIntSafe(getValue(rowData, 'Año') || getValue(rowData, 'Year'));
        const color = getValue(rowData, 'Color');
        const kilometraje = parseIntSafe(getValue(rowData, 'Kilometraje') || getValue(rowData, 'Mileage'));
        const bastidor = getValue(rowData, 'Bastidor') || getValue(rowData, 'VIN') || getValue(rowData, 'Número de Bastidor');
        const ubicacion = getValue(rowData, 'Ubicación Actual') || getValue(rowData, 'Ubicacion Actual') || getValue(rowData, 'Ubicación');
        const valorCompra = parseDecimalSafe(getValue(rowData, 'Valor de Compra') || getValue(rowData, 'Precio Compra') || getValue(rowData, 'Purchase Price'));
        const valorActual = parseDecimalSafe(getValue(rowData, 'Valor Actual') || getValue(rowData, 'Current Value') || getValue(rowData, 'Valor de Mercado'));

        if (marca) vehicleData.make = marca;
        if (modelo) vehicleData.model = modelo;
        if (año) vehicleData.year = año;
        if (color) vehicleData.color = color;
        if (kilometraje) vehicleData.mileage = kilometraje;
        if (bastidor) vehicleData.vin = bastidor;
        if (ubicacion) vehicleData.current_location = ubicacion;
        if (valorCompra) vehicleData.purchase_price = valorCompra;
        if (valorActual) vehicleData.current_value = valorActual;

        await prisma.carRentalCars.create({ data: vehicleData });

        results.success++;
        console.log(`✅ Línea ${i + 2}: ${registration} importado`);

      } catch (error: any) {
        const errorMsg = error.message || 'Error desconocido';
        results.errors.push(`Línea ${i + 2}: ${errorMsg}`);
        console.log(`❌ Línea ${i + 2}: ${errorMsg}`);
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`   ✅ Importados: ${results.success}`);
    console.log(`   ⏭️  Omitidos: ${results.skipped}`);
    console.log(`   ❌ Errores: ${results.errors.length}\n`);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('❌ ERROR CRÍTICO:', error);
    return NextResponse.json({ 
      error: 'Error al importar', 
      details: error.message 
    }, { status: 500 });
  }
}
