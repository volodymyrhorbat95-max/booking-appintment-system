import { PrismaClient } from '@prisma/client';

// ============================================
// PRISMA DATABASE CONFIGURATION
// Section 12.2: Concurrent Users - Connection Pooling
// Section 12.3: Scalability - Architecture for Growth
// ============================================

// Connection pool configuration for high concurrency
// Note: Prisma uses connection pooling internally
// For production with thousands of concurrent users, configure via DATABASE_URL:
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"
//
// Connection pool parameters (set in DATABASE_URL query string):
// - connection_limit: Maximum connections in pool (default: 3 per CPU core)
//   Recommended for production: 20-50 depending on database server capacity
// - pool_timeout: Timeout to acquire connection from pool in seconds (default: 10)
//   Recommended: 30 for high concurrency to allow connection reuse
// - connect_timeout: Timeout to establish connection in seconds (default: 5)
// - idle_in_transaction_session_timeout: Time idle transaction before terminated (milliseconds)
//   Recommended: 60000 (1 minute) to prevent connection leaks

const prisma = new PrismaClient({
  // Log configuration for monitoring performance
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],

  // Transaction configuration for high concurrency
  transactionOptions: {
    // Maximum time to wait for a transaction to start
    maxWait: 10000, // 10 seconds
    // Maximum time a transaction can run before being cancelled
    timeout: 30000, // 30 seconds
    // Isolation level for transactions
    isolationLevel: 'ReadCommitted'
  }
});

// Graceful shutdown handler
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export default prisma;
