const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully to Railway database');

    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query executed successfully:', result);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Prisma connection error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
