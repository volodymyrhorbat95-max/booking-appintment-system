/**
 * Mock Prisma Client for Testing
 * Provides a mock implementation of Prisma client with all models
 */

export const mockPrismaClient: any = {
  // User operations
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Professional operations
  professional: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Patient operations
  patient: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },

  // Appointment operations
  appointment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Payment operations
  payment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },

  // Subscription operations
  subscription: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Subscription Plan operations
  subscriptionPlan: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },

  // Availability operations
  availability: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },

  // Blocked Date operations
  blockedDate: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },

  // Reminder operations
  reminder: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },

  // Webhook Event operations
  webhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },

  // Slot Hold operations
  slotHold: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },

  // Google Calendar Token operations
  googleCalendarToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // Transaction support
  $transaction: jest.fn((callback: any) => callback(mockPrismaClient)),

  // Connect/Disconnect
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

/**
 * Reset all mock functions
 * Call this in beforeEach() to ensure clean state between tests
 */
export function resetPrismaMocks() {
  Object.values(mockPrismaClient).forEach((model: any) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method: any) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
}
