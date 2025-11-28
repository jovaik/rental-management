require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('PrismaClient creado');
console.log('Prisma object:', Object.keys(prisma));
console.log('Prisma.contract:', prisma.contract);
