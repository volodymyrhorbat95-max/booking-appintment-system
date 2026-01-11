import prisma from '../config/database';
import { sendReminder, cancelScheduledReminders } from './whatsapp.service';
import { sendReminderEmail } from './email.service';
import { logger, ServiceLogger } from '../utils/logger';

// ============================================
// REMINDER SCHEDULER
// Simple interval-based scheduler (no Redis required)
// ============================================

let schedulerInterval: NodeJS.Timeout | null = null;
let depositCleanupInterval: NodeJS.Timeout | null = null;
let isProcessing = false;
let isCleaningDeposits = false;

// Default time limit for deposit payments (in minutes)
const DEPOSIT_TIME_LIMIT_MINUTES = parseInt(process.env.DEPOSIT_TIME_LIMIT_MINUTES || '30', 10);

// ============================================
// PROCESS SINGLE REMINDER
// ============================================

export async function processReminder(reminder: {
  id: string;
  appointmentId: string;
  appointment: {
    id: string;
    status: string;
    patient: { firstName: string; lastName: string; email: string | null };
    professional: { firstName: string; lastName: string };
  };
}): Promise<boolean> {
  try {
    // Check if appointment is still active
    const validStatuses = ['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT', 'CONFIRMED'];
    if (!validStatuses.includes(reminder.appointment.status)) {
      // Mark reminder as cancelled since appointment is not active
      await prisma.scheduledReminder.update({
        where: { id: reminder.id },
        data: { status: 'cancelled' }
      });
      ServiceLogger.reminder(`Appointment ${reminder.appointmentId} is ${reminder.appointment.status}, cancelling reminder`);
      return false;
    }

    // Send the WhatsApp reminder
    const whatsappSent = await sendReminder({ appointmentId: reminder.appointmentId });

    // Also send email reminder if patient has email
    if (reminder.appointment.patient.email) {
      try {
        await sendReminderEmail({ appointmentId: reminder.appointmentId });
      } catch (emailError) {
        logger.error(`Failed to send email reminder for ${reminder.appointmentId}:`, emailError);
        // Don't fail the whole reminder if email fails
      }
    }

    if (whatsappSent) {
      // Mark reminder as sent
      await prisma.scheduledReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });
      ServiceLogger.reminder(`Reminder sent successfully for appointment ${reminder.appointmentId}`);
      return true;
    } else {
      logger.error(`Failed to send WhatsApp reminder for appointment ${reminder.appointmentId}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error processing reminder ${reminder.id}:`, error);
    return false;
  }
}

// ============================================
// PROCESS ALL DUE REMINDERS
// ============================================

export async function processScheduledReminders(): Promise<void> {
  // Prevent concurrent processing
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = new Date();

    // Find reminders that are due (scheduledFor <= now) and still pending
    const dueReminders = await prisma.scheduledReminder.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: { firstName: true, lastName: true, email: true }
            },
            professional: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      take: 50, // Process up to 50 reminders at a time
      orderBy: { scheduledFor: 'asc' }
    });

    if (dueReminders.length > 0) {
      ServiceLogger.reminder(`Processing ${dueReminders.length} due reminders...`);

      for (const reminder of dueReminders) {
        await processReminder(reminder);
      }

      ServiceLogger.reminder(`Finished processing ${dueReminders.length} reminders`);
    }
  } catch (error) {
    logger.error('Error in reminder scheduler:', error);
  } finally {
    isProcessing = false;
  }
}

// ============================================
// RELEASE UNPAID DEPOSIT APPOINTMENTS
// Requirement 3.6: If deposit is not paid within time limit, slot is released
// ============================================

export async function releaseUnpaidDepositAppointments(): Promise<void> {
  // Prevent concurrent processing
  if (isCleaningDeposits) {
    return;
  }

  isCleaningDeposits = true;

  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - DEPOSIT_TIME_LIMIT_MINUTES * 60 * 1000);

    // Find appointments that:
    // 1. Require deposit (status = PENDING_PAYMENT)
    // 2. Deposit has not been paid
    // 3. Were created more than DEPOSIT_TIME_LIMIT_MINUTES ago
    const expiredAppointments = await prisma.appointment.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        depositRequired: true,
        depositPaid: false,
        createdAt: {
          lt: cutoffTime
        }
      },
      select: {
        id: true,
        bookingReference: true,
        patient: {
          select: { firstName: true, lastName: true }
        }
      },
      take: 50 // Process up to 50 at a time
    });

    if (expiredAppointments.length > 0) {
      ServiceLogger.reminder(`Releasing ${expiredAppointments.length} unpaid deposit appointments...`);

      for (const appointment of expiredAppointments) {
        try {
          // Cancel the appointment to release the slot
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancelledBy: 'system',
              cancellationReason: `Depósito no pagado dentro del límite de ${DEPOSIT_TIME_LIMIT_MINUTES} minutos`
            }
          });

          // Cancel any scheduled reminders for this appointment
          await cancelScheduledReminders(appointment.id);

          ServiceLogger.reminder(`Released appointment ${appointment.bookingReference} - deposit not paid`);
        } catch (error) {
          logger.error(`Error releasing appointment ${appointment.id}:`, error);
        }
      }

      ServiceLogger.reminder(`Finished releasing ${expiredAppointments.length} unpaid deposit appointments`);
    }
  } catch (error) {
    logger.error('Error in deposit cleanup scheduler:', error);
  } finally {
    isCleaningDeposits = false;
  }
}

// ============================================
// START SCHEDULER (runs every 30 seconds)
// ============================================

export function startReminderScheduler(): void {
  if (schedulerInterval) {
    ServiceLogger.reminder('Reminder scheduler already running');
    return;
  }

  // Initial run after 5 seconds (give server time to start)
  setTimeout(() => {
    processScheduledReminders();
    releaseUnpaidDepositAppointments();
  }, 5000);

  // Run reminders every 30 seconds
  schedulerInterval = setInterval(processScheduledReminders, 30 * 1000);

  // Run deposit cleanup every 60 seconds
  depositCleanupInterval = setInterval(releaseUnpaidDepositAppointments, 60 * 1000);

  ServiceLogger.reminder('Reminder scheduler started (interval: 30 seconds)');
  ServiceLogger.reminder(`Deposit cleanup scheduler started (interval: 60 seconds, time limit: ${DEPOSIT_TIME_LIMIT_MINUTES} minutes)`);
}

export function stopReminderScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    ServiceLogger.reminder('Reminder scheduler stopped');
  }
  if (depositCleanupInterval) {
    clearInterval(depositCleanupInterval);
    depositCleanupInterval = null;
    ServiceLogger.reminder('Deposit cleanup scheduler stopped');
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

export async function shutdownWorker(): Promise<void> {
  stopReminderScheduler();

  // Wait for any in-progress processing to complete
  let waitCount = 0;
  while ((isProcessing || isCleaningDeposits) && waitCount < 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    waitCount++;
  }

  ServiceLogger.reminder('Reminder worker shut down');
}
