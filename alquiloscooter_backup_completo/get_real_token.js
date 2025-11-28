require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getRealToken() {
  try {
    const contract = await prisma.carRentalContracts.findFirst({
      where: {
        contract_number: '202510270002'
      },
      select: {
        id: true,
        contract_number: true,
        remote_signature_token: true,
        remote_signature_token_expires: true,
        signed_at: true
      }
    });
    
    if (!contract) {
      console.log('❌ Contrato no encontrado');
      return;
    }
    
    console.log('📋 CONTRATO:', contract.contract_number);
    console.log('🔑 TOKEN COMPLETO:');
    console.log(contract.remote_signature_token);
    console.log('');
    console.log('📏 Longitud del token:', contract.remote_signature_token?.length);
    console.log('📅 Expira:', contract.remote_signature_token_expires);
    console.log('✍️ Firmado:', contract.signed_at || 'NO');
    console.log('');
    
    // Generar URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://alqm.abacusai.app';
    const signatureUrl = `${baseUrl}/sign/${contract.remote_signature_token}`;
    console.log('🔗 URL COMPLETA:');
    console.log(signatureUrl);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getRealToken();
