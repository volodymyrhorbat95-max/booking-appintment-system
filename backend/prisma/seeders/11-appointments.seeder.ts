// ============================================
// APPOINTMENTS SEEDERS
// Creates comprehensive test appointments with various statuses
// Covers all AppointmentStatus values with realistic scenarios
// ============================================

import { AppointmentStatus } from '@prisma/client';
import prisma from '../../src/config/database';

// Helper to generate unique booking reference
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

// Comprehensive appointment times throughout the day
const appointmentTimes = [
  { start: { h: 8, m: 0 }, end: { h: 8, m: 30 } },
  { start: { h: 8, m: 30 }, end: { h: 9, m: 0 } },
  { start: { h: 9, m: 0 }, end: { h: 9, m: 30 } },
  { start: { h: 9, m: 30 }, end: { h: 10, m: 0 } },
  { start: { h: 10, m: 0 }, end: { h: 10, m: 30 } },
  { start: { h: 10, m: 30 }, end: { h: 11, m: 0 } },
  { start: { h: 11, m: 0 }, end: { h: 11, m: 30 } },
  { start: { h: 11, m: 30 }, end: { h: 12, m: 0 } },
  { start: { h: 12, m: 0 }, end: { h: 12, m: 30 } },
  { start: { h: 14, m: 0 }, end: { h: 14, m: 30 } },
  { start: { h: 14, m: 30 }, end: { h: 15, m: 0 } },
  { start: { h: 15, m: 0 }, end: { h: 15, m: 30 } },
  { start: { h: 15, m: 30 }, end: { h: 16, m: 0 } },
  { start: { h: 16, m: 0 }, end: { h: 16, m: 30 } },
  { start: { h: 16, m: 30 }, end: { h: 17, m: 0 } },
  { start: { h: 17, m: 0 }, end: { h: 17, m: 30 } },
  { start: { h: 17, m: 30 }, end: { h: 18, m: 0 } },
  { start: { h: 18, m: 0 }, end: { h: 18, m: 30 } },
  { start: { h: 18, m: 30 }, end: { h: 19, m: 0 } },
  { start: { h: 19, m: 0 }, end: { h: 19, m: 30 } }
];

// Realistic cancellation reasons
const cancellationReasons = [
  'No puedo asistir por motivos personales',
  'Surgió un imprevisto laboral',
  'Reagendado por el profesional',
  'Cancelado automáticamente por falta de pago',
  'Me enfermé y no puedo asistir',
  'Tuve un problema familiar',
  'No consigo transporte',
  'Cambio de planes de último momento',
  'El profesional tuvo una emergencia',
  'Feriado no previsto'
];

export const seedAppointments = async (professionals: any[], patients: any[]) => {
  console.log('🌱 Seeding appointments...');

  const createdAppointments: any[] = [];

  for (let profIndex = 0; profIndex < professionals.length; profIndex++) {
    const professional = professionals[profIndex];
    const profPatients = patients.filter((p: any) => p.professionalId === professional.id);

    if (profPatients.length === 0) {
      console.log(`  ⚠ No patients found for ${professional.firstName} ${professional.lastName}, skipping`);
      continue;
    }

    let appointmentCount = 0;
    let timeSlotIndex = 0;
    let patientIndex = 0;

    // === PAST APPOINTMENTS (last 4 weeks) ===

    // 10 COMPLETED appointments (last 3 weeks)
    for (let i = 0; i < 10; i++) {
      const dayOffset = -(21 - i * 2); // -21 to -3 days
      const patient = profPatients[patientIndex++ % profPatients.length];
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
          depositAmount: professional.depositEnabled ? professional.depositAmount : null,
          depositPaid: professional.depositEnabled,
          depositPaidAt: professional.depositEnabled ? getDateOffset(dayOffset - 2) : null
        }
      });
      appointmentCount++;
    }

    // 5 NO_SHOW appointments (last 2 weeks)
    for (let i = 0; i < 5; i++) {
      const dayOffset = -(14 - i * 2); // -14 to -6 days
      const patient = profPatients[patientIndex++ % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.NO_SHOW,
          bookingReference: generateBookingReference(),
          depositRequired: false
        }
      });
      appointmentCount++;
    }

    // 8 CANCELLED appointments (last 3 weeks) - various scenarios
    for (let i = 0; i < 8; i++) {
      const dayOffset = -(20 - i * 2); // -20 to -6 days
      const patient = profPatients[patientIndex++ % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      // Vary who cancelled
      let cancelledBy: string;
      if (i < 3) cancelledBy = 'patient';
      else if (i < 6) cancelledBy = 'professional';
      else cancelledBy = 'system';

      const reason = cancellationReasons[i % cancellationReasons.length];

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
          cancellationReason: reason,
          cancelledBy,
          depositRequired: i < 2 ? professional.depositEnabled : false,
          depositAmount: i < 2 && professional.depositEnabled ? professional.depositAmount : null,
          depositPaid: false
        }
      });
      appointmentCount++;
    }

    // === FUTURE APPOINTMENTS (next 4 weeks) ===

    // 8 CONFIRMED appointments (next 2 weeks)
    for (let i = 0; i < 8; i++) {
      const dayOffset = 1 + i; // +1 to +8 days
      const patient = profPatients[patientIndex++ % profPatients.length];
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
          depositAmount: professional.depositEnabled ? professional.depositAmount : null,
          depositPaid: professional.depositEnabled,
          depositPaidAt: professional.depositEnabled ? new Date() : null
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    // 6 REMINDER_SENT appointments (next 2 weeks)
    for (let i = 0; i < 6; i++) {
      const dayOffset = 2 + i; // +2 to +7 days
      const patient = profPatients[patientIndex++ % profPatients.length];
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
          depositAmount: professional.depositEnabled ? professional.depositAmount : null,
          depositPaid: professional.depositEnabled,
          depositPaidAt: professional.depositEnabled ? new Date() : null
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    // 10 PENDING appointments (next 2-3 weeks)
    for (let i = 0; i < 10; i++) {
      const dayOffset = 7 + i; // +7 to +16 days
      const patient = profPatients[patientIndex++ % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      const appt = await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.PENDING,
          bookingReference: generateBookingReference(),
          depositRequired: i < 3 ? professional.depositEnabled : false,
          depositAmount: i < 3 && professional.depositEnabled ? professional.depositAmount : null,
          depositPaid: i < 3 && professional.depositEnabled
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    // PENDING_PAYMENT appointments - only for professionals with deposit enabled
    if (professional.depositEnabled) {
      // 4 PENDING_PAYMENT appointments (next 2 weeks)
      for (let i = 0; i < 4; i++) {
        const dayOffset = 8 + i; // +8 to +11 days
        const patient = profPatients[patientIndex++ % profPatients.length];
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
            depositAmount: professional.depositAmount,
            depositPaid: false
          }
        });
        createdAppointments.push(appt);
        appointmentCount++;
      }
    }

    // Additional PENDING appointments for next month (week 3-4)
    for (let i = 0; i < 8; i++) {
      const dayOffset = 17 + i; // +17 to +24 days
      const patient = profPatients[patientIndex++ % profPatients.length];
      const timeSlot = appointmentTimes[timeSlotIndex++ % appointmentTimes.length];

      const appt = await prisma.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          date: getDateOffset(dayOffset),
          startTime: createTime(timeSlot.start.h, timeSlot.start.m),
          endTime: createTime(timeSlot.end.h, timeSlot.end.m),
          status: AppointmentStatus.PENDING,
          bookingReference: generateBookingReference(),
          depositRequired: false
        }
      });
      createdAppointments.push(appt);
      appointmentCount++;
    }

    console.log(`  ✓ Created ${appointmentCount} appointments for ${professional.firstName} ${professional.lastName}`);
  }

  console.log(`✅ Appointments seeded: total appointments created across all professionals\n`);

  return createdAppointments;
};
