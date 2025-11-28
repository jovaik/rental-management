require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function setupTestUser() {
  const prisma = new PrismaClient();
  try {
    console.log('Checking existing users...');
    const users = await prisma.carRentalUsers.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstname: true,
        lastname: true,
        role: true,
      },
      take: 5
    });
    
    console.log('\nExisting users:');
    users.forEach(u => {
      console.log(`- ${u.email} (${u.firstname} ${u.lastname}, role: ${u.role})`);
    });
    
    // Check if test user exists
    const testUser = await prisma.carRentalUsers.findUnique({
      where: { email: 'admin@carrental.com' }
    });
    
    if (!testUser) {
      console.log('\nCreating test user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newUser = await prisma.carRentalUsers.create({
        data: {
          email: 'admin@carrental.com',
          password: hashedPassword,
          username: 'admin',
          firstname: 'Admin',
          lastname: 'User',
          role: 'admin',
          status: 'T',
        }
      });
      
      console.log('Test user created:', newUser.email);
    } else {
      console.log('\nTest user already exists:', testUser.email);
      console.log('Updating password to admin123...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.carRentalUsers.update({
        where: { email: 'admin@carrental.com' },
        data: { password: hashedPassword }
      });
      console.log('Password updated successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();
