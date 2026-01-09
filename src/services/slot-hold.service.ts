import prisma from '../config/database';

// ============================================
// SLOT HOLD SERVICE
// Requirement 10.1: Temporary slot holding to prevent double bookings
// "When someone starts booking, that slot should be temporarily held"
// ============================================

// Hold duration in minutes
const HOLD_DURATION_MINUTES = 5;

// ============================================
// CREATE OR EXTEND SLOT HOLD
// ============================================

interface CreateHoldParams {
  professionalId: string;
  date: Date;
  startTime: Date;
  sessionId: string;
}

interface CreateHoldResult {
  success: boolean;
  holdId?: string;
  expiresAt?: Date;
  error?: string;
}

export async function createSlotHold(params: CreateHoldParams): Promise<CreateHoldResult> {
  const { professionalId, date, startTime, sessionId } = params;

  try {
    // Clean up expired holds first
    await cleanupExpiredHolds();

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);

    // Try to create or update the hold
    const hold = await prisma.$transaction(async (tx) => {
      // Check if there's an existing hold
      const existingHold = await tx.slotHold.findUnique({
        where: {
          professionalId_date_startTime: {
            professionalId,
            date,
            startTime
          }
        }
      });

      if (existingHold) {
        // If same session, extend the hold
        if (existingHold.sessionId === sessionId) {
          return await tx.slotHold.update({
            where: { id: existingHold.id },
            data: { expiresAt }
          });
        }

        // If different session and hold hasn't expired, reject
        if (existingHold.expiresAt > new Date()) {
          throw new Error('SLOT_HELD_BY_ANOTHER');
        }

        // Hold has expired, delete it and create new one
        await tx.slotHold.delete({
          where: { id: existingHold.id }
        });
      }

      // Check if slot is already booked (not just held)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          professionalId,
          date,
          startTime,
          status: { notIn: ['CANCELLED'] }
        }
      });

      if (existingAppointment) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // Create new hold
      return await tx.slotHold.create({
        data: {
          professionalId,
          date,
          startTime,
          sessionId,
          expiresAt
        }
      });
    });

    return {
      success: true,
      holdId: hold.id,
      expiresAt: hold.expiresAt
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'SLOT_HELD_BY_ANOTHER') {
        return {
          success: false,
          error: 'Este horario está siendo reservado por otra persona'
        };
      }
      if (error.message === 'SLOT_ALREADY_BOOKED') {
        return {
          success: false,
          error: 'Este horario ya no está disponible'
        };
      }
    }
    console.error('Error creating slot hold:', error);
    return {
      success: false,
      error: 'Error al reservar el horario temporalmente'
    };
  }
}

// ============================================
// RELEASE SLOT HOLD
// ============================================

interface ReleaseHoldParams {
  professionalId: string;
  date: Date;
  startTime: Date;
  sessionId: string;
}

export async function releaseSlotHold(params: ReleaseHoldParams): Promise<boolean> {
  const { professionalId, date, startTime, sessionId } = params;

  try {
    // Only release if the hold belongs to this session
    const result = await prisma.slotHold.deleteMany({
      where: {
        professionalId,
        date,
        startTime,
        sessionId
      }
    });

    return result.count > 0;
  } catch (error) {
    console.error('Error releasing slot hold:', error);
    return false;
  }
}

// ============================================
// CHECK IF SLOT IS HELD
// ============================================

interface CheckHoldParams {
  professionalId: string;
  date: Date;
  startTime: Date;
  sessionId?: string;
}

interface CheckHoldResult {
  isHeld: boolean;
  isHeldByCurrentSession: boolean;
  expiresAt?: Date;
}

export async function checkSlotHold(params: CheckHoldParams): Promise<CheckHoldResult> {
  const { professionalId, date, startTime, sessionId } = params;

  try {
    const hold = await prisma.slotHold.findUnique({
      where: {
        professionalId_date_startTime: {
          professionalId,
          date,
          startTime
        }
      }
    });

    if (!hold || hold.expiresAt <= new Date()) {
      return {
        isHeld: false,
        isHeldByCurrentSession: false
      };
    }

    return {
      isHeld: true,
      isHeldByCurrentSession: sessionId ? hold.sessionId === sessionId : false,
      expiresAt: hold.expiresAt
    };
  } catch (error) {
    console.error('Error checking slot hold:', error);
    return {
      isHeld: false,
      isHeldByCurrentSession: false
    };
  }
}

// ============================================
// GET ALL HELD SLOTS FOR A DATE
// ============================================

interface GetHoldsParams {
  professionalId: string;
  date: Date;
  sessionId?: string;
}

interface HeldSlot {
  startTime: string;
  isHeldByCurrentSession: boolean;
}

export async function getHeldSlotsForDate(params: GetHoldsParams): Promise<HeldSlot[]> {
  const { professionalId, date, sessionId } = params;

  try {
    const holds = await prisma.slotHold.findMany({
      where: {
        professionalId,
        date,
        expiresAt: { gt: new Date() }
      }
    });

    return holds.map((hold) => ({
      startTime: hold.startTime instanceof Date
        ? `${hold.startTime.getHours().toString().padStart(2, '0')}:${hold.startTime.getMinutes().toString().padStart(2, '0')}`
        : String(hold.startTime).substring(0, 5),
      isHeldByCurrentSession: sessionId ? hold.sessionId === sessionId : false
    }));
  } catch (error) {
    console.error('Error getting held slots:', error);
    return [];
  }
}

// ============================================
// CLEANUP EXPIRED HOLDS
// ============================================

export async function cleanupExpiredHolds(): Promise<number> {
  try {
    const result = await prisma.slotHold.deleteMany({
      where: {
        expiresAt: { lte: new Date() }
      }
    });

    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} expired slot holds`);
    }

    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired holds:', error);
    return 0;
  }
}

// ============================================
// VALIDATE HOLD BEFORE BOOKING
// Ensures the session has a valid hold before creating appointment
// ============================================

interface ValidateHoldParams {
  professionalId: string;
  date: Date;
  startTime: Date;
  sessionId: string;
}

export async function validateHoldForBooking(params: ValidateHoldParams): Promise<boolean> {
  const { professionalId, date, startTime, sessionId } = params;

  try {
    const hold = await prisma.slotHold.findUnique({
      where: {
        professionalId_date_startTime: {
          professionalId,
          date,
          startTime
        }
      }
    });

    // Accept if: no hold exists OR hold belongs to this session and hasn't expired
    if (!hold) {
      return true; // No hold, slot is free
    }

    if (hold.sessionId === sessionId && hold.expiresAt > new Date()) {
      return true; // Valid hold by this session
    }

    if (hold.expiresAt <= new Date()) {
      // Expired hold, clean it up
      await prisma.slotHold.delete({ where: { id: hold.id } });
      return true;
    }

    return false; // Hold by another session that hasn't expired
  } catch (error) {
    console.error('Error validating hold for booking:', error);
    return false;
  }
}

// ============================================
// CONSUME HOLD (delete after successful booking)
// ============================================

export async function consumeSlotHold(params: ReleaseHoldParams): Promise<void> {
  const { professionalId, date, startTime, sessionId } = params;

  try {
    await prisma.slotHold.deleteMany({
      where: {
        professionalId,
        date,
        startTime,
        sessionId
      }
    });
  } catch (error) {
    // Non-critical, just log
    console.error('Error consuming slot hold:', error);
  }
}
