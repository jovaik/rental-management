const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContract() {
  try {
    const contract = await prisma.carRentalContracts.findUnique({
      where: { id: 59 },
      include: {
        booking: {
          include: {
            vehicles: {
              include: {
                car: true
              }
            },
            inspections: true
          }
        }
      }
    });
    
    if (!contract) {
      console.log('Contrato 59 no encontrado');
      return;
    }
    
    console.log('=== CONTRATO 59 ===');
    console.log('ID Contrato:', contract.id);
    console.log('ID Reserva:', contract.booking_id);
    console.log('Número Reserva:', contract.booking.booking_number);
    console.log('Creado:', contract.created_at);
    console.log('Actualizado:', contract.updated_at);
    console.log('Tiene HTML:', contract.contract_html ? 'Sí' : 'No');
    console.log('Tamaño HTML:', contract.contract_html ? (contract.contract_html.length / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
    
    console.log('\n=== VEHÍCULOS E INSPECCIONES ===');
    for (const bv of contract.booking.vehicles) {
      console.log(`\nVehículo: ${bv.car.make} ${bv.car.model} (${bv.car.registration})`);
      
      // Buscar inspecciones de este vehículo
      const deliveryInsp = contract.booking.inspections.find(
        i => i.vehicle_id === bv.car_id && i.inspection_type === 'delivery'
      );
      const returnInsp = contract.booking.inspections.find(
        i => i.vehicle_id === bv.car_id && i.inspection_type === 'return'
      );
      
      console.log('Inspección Entrega:', deliveryInsp ? 'Sí' : 'No');
      console.log('Inspección Devolución:', returnInsp ? 'Sí' : 'No');
      
      if (deliveryInsp) {
        const fotosEntrega = 
          (deliveryInsp.front_photo ? 1 : 0) +
          (deliveryInsp.left_photo ? 1 : 0) +
          (deliveryInsp.rear_photo ? 1 : 0) +
          (deliveryInsp.right_photo ? 1 : 0) +
          (deliveryInsp.odometer_photo ? 1 : 0);
        console.log('  - Fotos entrega:', fotosEntrega);
      }
      
      if (returnInsp) {
        const fotosDev =
          (returnInsp.front_photo ? 1 : 0) +
          (returnInsp.left_photo ? 1 : 0) +
          (returnInsp.rear_photo ? 1 : 0) +
          (returnInsp.right_photo ? 1 : 0) +
          (returnInsp.odometer_photo ? 1 : 0);
        console.log('  - Fotos devolución:', fotosDev);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContract();
