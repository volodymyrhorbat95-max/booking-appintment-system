// ============================================
// APPOINTMENTS SEEDERS
// Creates test appointments with various statuses
// Covers all AppointmentStatus values
// ============================================

import { AppointmentStatus } from '@prisma/client';
import prisma from '../../src/config/database';

// Helper to generate booking reference
const generateBookingReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper to get a date offset from today
const getDateOffset = (daysOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper to create time
const createTime = (hours: number, minutes: number): Date => {
  const time = new Date(1970, 0, 1, hours, minutes, 0, 0);
  return time;
};

// Appointment times throughout the day
const appointmentTimes = [
  { start: { h: 9, m: 0 }, end: { h: 9, m: 30 } },
  { start: { h: 9, m: 30 }, end: { h: 10, m: 0 } },
  { start: { h: 10, m: 0 }, end: { h: 10, m: 30 } },
  { start: { h: 10, m: 30 }, end: { h: 11, m: 0 } },
  { start: { h: 11, m: 0 }, end: { h: 11, m: 30 } },
  { start: { h: 11, m: 30 }, end: { h: 12, m: 0 } },
  { start: { h: 14, m: 0 }, end: { h: 14, m: 30 } },
  { start: { h: 14, m: 30 }, end: { h: 15, m: 0 } },
  { start: { h: 15, m: 0 }, end: { h: 15, m: 30 } },
  { start: { h: 15, m: 30 }, end: { h: 16, m: 0 } },
  { start: { h: 16, m: 0 }, end: { h: 16, m: 30 } },
  { start: { h: 16, m: 30 }, end: { h: 17, m: 0 } }
];

export const seedAppointments = async (professionals: any[], patients: any[]) => {
  console.log('🌱 Seeding appointments...');

  const createdAppointments: any[] = [];

  for (let profIndex = 0; profIndex < professionals.length; profIndex++) {
    const professional = professionals[profIndex];
    const profPatients = patients.filter(p => p.professionalId === professional.id);

    if (profPatients.length === 0) continue;

    let appointmentCount = 0;
    let timeSlotIndex = 0;

    // === PAST APPOINTMENTS (last 2 weeks) ===

    // 5 COMPLETED appointments (past week)
    for (let i = 0; i < 5; i++) {
      const dayOffset = -(7 - i); // -7 to -3 days
      const patient = profPatients[i % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.COMPLETED,
          bookingReference: generateBookingReference(),
          depositRequired: professional.depositEnabled,
          depositAmount: professional.depositEnabled ? 2000 : null,
          depositPaid: professional.depositEnabled,
          depositPaidAt: professional.depositEnabled ? getDateOffset(dayOffset - 2) : null
        }
      });
      appointmentCount++;
    }

    // 2 NO_SHOW appointments (past week)
    for (let i = 0; i < 2; i++) {
      const dayOffset = -(6 - i); // -6 to -5 days
      const patient = profPatients[(5 + i) % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.NO_SHOW,
          bookingReference: generateBookingReference()
        }
      });
      appointmentCount++;
    }

    // 3 CANCELLED appointments (past week)
    for (let i = 0; i < 3; i++) {
      const dayOffset = -(4 - i); // -4 to -2 days
      const patient = profPatients[(7 + i) % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];
      const cancelledBy = i === 0 ? 'patient' : i === 1 ? 'professional' : 'system';
      const reasons = [
        'No puedo asistir por motivos personales',
        'Reagendado por el profesional',
        'Cancelado automáticamente por falta de pago'
      ];

      await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.CANCELLED,
          bookingReference: generateBookingReference(),
          cancelledAt: getDateOffset(dayOffset - 1),
          cancellationReason: reasons[i],
          cancelledBy
        }
      });
      appointmentCount++;
    }

    // === FUTURE APPOINTMENTS (next 2 weeks) ===

    // 3 CONFIRMED appointments (this week)
    for (let i = 0; i < 3; i++) {
      const dayOffset = 1 + i; // +1 to +3 days
      const patient = profPatients[i % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      const appt = await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.CONFIRMED,
          bookingReference: generateBookingReference(),
          depositRequired: professional.depositEnabled,
          depositAmount: professional.depositEnabled ? 2000 : null,
          depositPaid: professional.depositEnabled,
          depositPaidAt: professional.depositEnabled ? new Date() : null
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    // 2 REMINDER_SENT appointments (this week)
    for (let i = 0; i < 2; i++) {
      const dayOffset = 2 + i; // +2 to +3 days
      const patient = profPatients[(3 + i) % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      const appt = await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.REMINDER_SENT,
          bookingReference: generateBookingReference(),
          depositRequired: professional.depositEnabled,
          depositAmount: professional.depositEnabled ? 2000 : null,
          depositPaid: professional.depositEnabled,
          depositPaidAt: professional.depositEnabled ? new Date() : null
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    // 4 PENDING appointments (next week)
    for (let i = 0; i < 4; i++) {
      const dayOffset = 7 + i; // +7 to +10 days
      const patient = profPatients[(5 + i) % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      const appt = await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.PENDING,
          bookingReference: generateBookingReference()
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    // 2 PENDING_PAYMENT appointments (next week) - only for professionals with deposit enabled
    if (professional.depositEnabled) {
      for (let i = 0; i < 2; i++) {
        const dayOffset = 8 + i; // +8 to +9 days
        const patient = profPatients[(9 + i) % profPatients.length];
        const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

        const appt = await prisma.appointment.create({
          data: {
            professionalId: professional.id,
            patientId: patient.id,
            date: getDateOffset(dayOffset),
            startTime: createTime(timeSlot.start.h, timeSlot.start.m),
            endTime: createTime(timeSlot.end.h, timeSlot.end.m),
            status: AppointmentStatus.PENDING_PAYMENT,
            bookingReference: generateBookingReference(),
            depositRequired: true,
            depositAmount: 2000,
            depositPaid: false
          }
        });
        createdAppointments.push(appt);
        appointmentCount++;
      }
    }

    console.log(`  ✓ Created ${appointmentCount} appointments for ${professional.firstName} ${professional.lastName}`);
  }

  console.log(`✅ Appointments seeded: ${createdAppointments.length} future + past appointments\n`);

  return createdAppointments;
};
