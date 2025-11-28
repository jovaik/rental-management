require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInspectionEmail() {
  try {
    console.log('🔍 Buscando reserva 130...');
    
    // Buscar la reserva 130
    const booking = await prisma.carRentalBookings.findFirst({
      where: {
        OR: [
          { id: 130 },
          { booking_number: { contains: '130' } }
        ]
      },
      include: {
        customer: true,
        vehicles: {
          include: {
            car: true
          }
        },
        inspections: {
          orderBy: {
            inspection_date: 'desc'
          }
        }
      }
    });

    if (!booking) {
      console.log('❌ No se encontró la reserva 130');
      return;
    }

    console.log('\n📋 DATOS DE LA RESERVA:');
    console.log('ID:', booking.id);
    console.log('Número:', booking.booking_number);
    console.log('Cliente:', booking.customer?.first_name, booking.customer?.last_name);
    console.log('Email:', booking.customer?.email);
    console.log('Vehículos:', booking.vehicles.length);
    console.log('Inspecciones:', booking.inspections.length);
    
    if (booking.inspections.length > 0) {
      console.log('\n📸 INSPECCIONES:');
      booking.inspections.forEach((insp, idx) => {
        console.log(`  ${idx + 1}. ID: ${insp.id} | Tipo: ${insp.inspection_type} | Fecha: ${insp.inspection_date}`);
        console.log(`     Fotos: ${insp.front_photo ? '✓' : '✗'} Frontal, ${insp.left_photo ? '✓' : '✗'} Izq, ${insp.rear_photo ? '✓' : '✗'} Tras, ${insp.right_photo ? '✓' : '✗'} Der, ${insp.odometer_photo ? '✓' : '✗'} Odóm`);
      });
    }

    console.log('\n📧 CONFIGURACIÓN SMTP:');
    console.log('Host:', process.env.SMTP_HOST || 'NO CONFIGURADO');
    console.log('Port:', process.env.SMTP_PORT || 'NO CONFIGURADO');
    console.log('User:', process.env.SMTP_USER || 'NO CONFIGURADO');
    console.log('From:', process.env.SMTP_FROM || 'NO CONFIGURADO');
    console.log('Admin:', process.env.ADMIN_EMAIL || 'NO CONFIGURADO');

    // Prueba de envío
    if (booking.inspections.length > 0 && booking.customer?.email) {
      console.log('\n🚀 Probando envío de email...');
      
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('🔌 Verificando conexión SMTP...');
      await transporter.verify();
      console.log('✅ Conexión SMTP exitosa');

      const testMail = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: booking.customer.email,
        subject: 'PRUEBA - Sistema de inspecciones',
        html: `
          <h2>Prueba de envío de email</h2>
          <p>Este es un email de prueba para la reserva ${booking.booking_number}</p>
          <p>Si recibe este mensaje, el sistema de email está funcionando correctamente.</p>
        `
      };

      console.log('📤 Enviando email de prueba a:', booking.customer.email);
      const info = await transporter.sendMail(testMail);
      console.log('✅ Email enviado:', info.messageId);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testInspectionEmail();
