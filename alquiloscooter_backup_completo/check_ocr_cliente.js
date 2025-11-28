// Verificar si el endpoint de OCR existe y funciona
const fs = require('fs');
const path = require('path');

console.log('\n========== VERIFICACIÓN OCR ==========\n');

// Verificar archivos
const files = [
  'components/customers/customer-form-dialog.tsx',
  'app/api/customers/extract-document-data/route.ts'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (file.includes('customer-form-dialog')) {
      const hasExtractCall = content.includes('extract-document-data');
      const hasHandleFileChange = content.includes('extractDocumentData');
      console.log(`   - Llama a extract-document-data: ${hasExtractCall ? '✅' : '❌'}`);
      console.log(`   - Función extractDocumentData: ${hasHandleFileChange ? '✅' : '❌'}`);
    } else if (file.includes('extract-document-data')) {
      const hasVisionAPI = content.includes('ABACUSAI_API_KEY') || content.includes('vision');
      console.log(`   - Usa API de visión: ${hasVisionAPI ? '✅' : '❌'}`);
    }
  }
});

console.log('\n========================================\n');
