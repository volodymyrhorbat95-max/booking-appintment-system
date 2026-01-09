// ============================================
// EXTERNAL CALENDAR EVENTS SEEDERS
// Creates external Google Calendar events for professionals
// These represent events that exist in the professional's Google Calendar
// that block time slots for appointments
// ============================================

import prisma from '../../src/config/database';

// Helper to get a date offset from today
const getDateOffset = (daysOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Sample external event titles
const eventTitles = [
  'Reunión de equipo',
  'Almuerzo con colega',
  'Conferencia médica',
  'Capacitación online',
  'Cita personal',
  'Trámite bancario',
  'Consulta externa',
  'Evento familiar',
  'Mantenimiento consultorio',
  'Descanso programado'
];

export const seedExternalCalendarEvents = async (professionals: any[]) => {
  console.log('🌱 Seeding external calendar events...');

  const createdEvents: any[] = [];

  for (const professional of professionals) {
    // Only create events for professionals with Google Calendar connected
    if (!professional.googleCalendarConnected) continue;

    // Create 5-8 external events per professional spread over the next 2 weeks
    const numEvents = 5 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numEvents; i++) {
      const dayOffset = 1 + Math.floor(Math.random() * 14); // 1-14 days from now
      const eventDate = getDateOffset(dayOffset);

      // Random start hour between 9 and 16
      const startHour = 9 + Math.floor(Math.random() * 8);
      const startMinutes = Math.random() > 0.5 ? 0 : 30;

      // Event duration: 30 min to 2 hours
      const durationMinutes = [30, 60, 90, 120][Math.floor(Math.random() * 4)];

      const startTime = new Date(eventDate);
      startTime.setHours(startHour, startMinutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      const title = eventTitles[Math.floor(Math.random() * eventTitles.length)];
      const googleEventId = `gcal_${professional.id.substring(0, 8)}_${Date.now()}_${i}`;

      try {
        const event = await prisma.externalCalendarEvent.upsert({
          where: {
            professionalId_googleEventId: {
              professionalId: professional.id,
              googleEventId
            }
          },
          update: {},
          create: {
            professionalId: professional.id,
            googleEventId,
            title,
            startTime,
            endTime
          }
        });
        createdEvents.push(event);
      } catch {
        // Ignore duplicate errors
      }
    }

    console.log(`  ✓ Created ${numEvents} external events for ${professional.firstName} ${professional.lastName}`);
  }

  console.log(`✅ External calendar events seeded: ${createdEvents.length} events\n`);

  return createdEvents;
};
