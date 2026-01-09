// ============================================
// SCHEDULED REMINDERS SEEDERS
// Creates scheduled reminders for future appointments
// ============================================

import prisma from '../../src/config/database';

export const seedScheduledReminders = async () => {
  console.log('🌱 Seeding scheduled reminders...');

  const createdReminders: any[] = [];

  // Get all future appointments that are not cancelled
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date()
      },
      status: {
        notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW']
      }
    },
    include: {
      professional: {
        include: {
          reminderSettings: {
            where: { isActive: true },
            orderBy: { hoursBefore: 'desc' }
          }
        }
      }
    }
  });

  for (const appointment of futureAppointments) {
    const reminderSettings = appointment.professional.reminderSettings;

    if (reminderSettings.length === 0) continue;

    // Create scheduled reminders based on professional's settings
    for (const setting of reminderSettings) {
      // Calculate when to send the reminder
      const appointmentDateTime = new Date(appointment.date);
      const [hours, minutes] = [
        appointment.startTime.getHours(),
        appointment.startTime.getMinutes()
      ];
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const scheduledFor = new Date(appointmentDateTime);
      scheduledFor.setHours(scheduledFor.getHours() - setting.hoursBefore);

      // Handle early morning appointments with night-before option
      if (setting.enableNightBefore && hours < 9) {
        const nightBefore = new Date(appointmentDateTime);
        nightBefore.setDate(nightBefore.getDate() - 1);
        nightBefore.setHours(20, 0, 0, 0); // 8 PM the night before

        // Create night-before reminder
        const nightReminder = await prisma.scheduledReminder.create({
          data: {
            appointmentId: appointment.id,
            scheduledFor: nightBefore,
            status: nightBefore < new Date() ? 'sent' : 'pending'
          }
        });
        createdReminders.push(nightReminder);
      }

      // Check if reminder should already have been sent
      const status = scheduledFor < new Date() ? 'sent' : 'pending';
      const sentAt = status === 'sent' ? scheduledFor : null;

      const reminder = await prisma.scheduledReminder.create({
        data: {
          appointmentId: appointment.id,
          scheduledFor,
          status,
          sentAt
        }
      });
      createdReminders.push(reminder);
    }
  }

  // Also create some cancelled reminders for past appointments
  const cancelledAppointments = await prisma.appointment.findMany({
    where: {
      status: 'CANCELLED'
    },
    take: 5
  });

  for (const appointment of cancelledAppointments) {
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(9, 0, 0, 0);

    const scheduledFor = new Date(appointmentDateTime);
    scheduledFor.setHours(scheduledFor.getHours() - 24);

    const reminder = await prisma.scheduledReminder.create({
      data: {
        appointmentId: appointment.id,
        scheduledFor,
        status: 'cancelled'
      }
    });
    createdReminders.push(reminder);
  }

  console.log(`✅ Scheduled reminders seeded: ${createdReminders.length} reminders\n`);

  return createdReminders;
};
