require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyToken() {
  try {
    // Token del último contrato
    const token = '77ad27ef75a905abe8f29e7e5a25bc3ca69aca8a4cc2e4d0b4e6d0c4c6b6ec83';
    
    console.log('🔍 Buscando contrato con token:', token.substring(0, 20) + '...');
    console.log('');
    
    // Buscar exactamente como lo hace la API
    const contract = await prisma.carRentalContracts.findUnique({
      where: { remote_signature_token: token },
      include: {
        booking: {
          include: {
            customer: true,
            car: true
          }
        }
      }
    });
    
    if (!contract) {
      console.log('❌ NO SE ENCONTRÓ el contrato con ese token');
      return;
    }
    
    console.log('✅ CONTRATO ENCONTRADO:');
    console.log(`ID: ${contract.id}`);
    console.log(`Número: ${contract.contract_number}`);
    console.log(`Token en BD: ${contract.remote_signature_token?.substring(0, 20)}...`);
    console.log('');
    
    // Verificar expiración
    const now = new Date();
    const expires = contract.remote_signature_token_expires ? new Date(contract.remote_signature_token_expires) : null;
    
    console.log('🕐 VERIFICACIÓN DE EXPIRACIÓN:');
    console.log(`Fecha actual: ${now}`);
    console.log(`Token expira: ${expires}`);
    
    if (expires && expires < now) {
      console.log('❌ EL TOKEN HA EXPIRADO');
    } else {
      console.log('✅ EL TOKEN ES VÁLIDO');
    }
    console.log('');
    
    // Verificar si ya está firmado
    console.log('✍️ VERIFICACIÓN DE FIRMA:');
    if (contract.signed_at) {
      console.log(`❌ YA ESTÁ FIRMADO (firmado: ${contract.signed_at})`);
    } else {
      console.log('✅ NO ESTÁ FIRMADO - PUEDE FIRMARSE');
    }
    console.log('');
    
    // Mostrar URL de firma
    const baseUrl = process.env.NEXTAUTH_URL || 'https://alqm.abacusai.app';
    const signatureUrl = `${baseUrl}/sign/${token}`;
    console.log('🔗 URL DE FIRMA:');
    console.log(signatureUrl);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyToken();
