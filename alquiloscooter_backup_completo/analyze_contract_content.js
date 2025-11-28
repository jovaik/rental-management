require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeContractContent() {
  try {
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: 57 }
    });

    if (!contract) {
      console.log('❌ Contrato #57 no encontrado');
      return;
    }

    const html = contract.contract_text;
    console.log('🔍 ANÁLISIS DE CONTENIDO DEL CONTRATO\n');
    console.log('════════════════════════════════════════\n');
    
    console.log('📏 Tamaño total:', (html.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('📝 Caracteres:', html.length.toLocaleString());
    console.log('');

    // Contar imágenes base64
    const base64Images = html.match(/data:image\/[^;]+;base64,[^"']+/g) || [];
    console.log('🖼️  Imágenes base64:', base64Images.length);
    
    let totalBase64Size = 0;
    base64Images.forEach((img, idx) => {
      const size = img.length / 1024;
      totalBase64Size += size;
      if (idx < 5) {
        console.log('  ' + (idx + 1) + '.', size.toFixed(0), 'KB');
      }
    });
    if (base64Images.length > 5) {
      console.log('  ... (' + (base64Images.length - 5) + ' más)');
    }
    console.log('  📊 Total base64:', (totalBase64Size / 1024).toFixed(2), 'MB');
    console.log('');

    // Texto HTML sin imágenes
    const htmlWithoutImages = html.replace(/data:image\/[^;]+;base64,[^"']+/g, 'IMAGE_REMOVED');
    console.log('📄 Tamaño HTML sin imágenes:', (htmlWithoutImages.length / 1024).toFixed(0), 'KB');
    console.log('');

    // Buscar repeticiones sospechosas
    const lopd = (html.match(/INFORMACIÓN SOBRE PROTECCIÓN DE DATOS/g) || []).length;
    const clausulas = (html.match(/CLÁUSULAS/g) || []).length;
    const header = (html.match(/<header/g) || []).length;
    const footer = (html.match(/<footer/g) || []).length;
    
    console.log('🔁 REPETICIONES:');
    console.log('  - "INFORMACIÓN SOBRE PROTECCIÓN DE DATOS":', lopd, 'veces');
    console.log('  - "CLÁUSULAS":', clausulas, 'veces');
    console.log('  - <header>:', header, 'veces');
    console.log('  - <footer>:', footer, 'veces');
    console.log('');

    // Buscar estilos CSS
    const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
    let totalStyleSize = 0;
    styleBlocks.forEach(style => {
      totalStyleSize += style.length;
    });
    console.log('🎨 CSS:');
    console.log('  - Bloques <style>:', styleBlocks.length);
    console.log('  - Tamaño total CSS:', (totalStyleSize / 1024).toFixed(0), 'KB');
    console.log('');

    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeContractContent();
