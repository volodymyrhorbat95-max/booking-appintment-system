import { google, calendar_v3 } from 'googleapis';
import prisma from '../config/database';
import { logger, ServiceLogger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption';

// ============================================
// GOOGLE CALENDAR SERVICE
// Two-way sync: Platform ↔ Google Calendar
// ============================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:5000/api/professional/google-calendar/callback';

// Scopes required for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Create OAuth2 client
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

// Get authenticated client for a professional
const getAuthenticatedClient = async (professionalId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId }
  });

  if (!professional?.googleRefreshToken) {
    throw new Error('Google Calendar not connected');
  }

  // SECURITY FIX: Decrypt Google refresh token before use
  const decryptedRefreshToken = decrypt(professional.googleRefreshToken);

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: decryptedRefreshToken
  });

  // Auto-refresh token if needed
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // SECURITY FIX: Encrypt refresh token before storing
      const encryptedRefreshToken = encrypt(tokens.refresh_token);
      await prisma.professional.update({
        where: { id: professionalId },
        data: { googleRefreshToken: encryptedRefreshToken }
      });
    }
  });

  return oauth2Client;
};

// ============================================
// OAUTH FLOW
// ============================================

// Generate authorization URL
export const getAuthUrl = (professionalId: string): string => {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: professionalId // Pass professional ID for callback
  });
};

// Handle OAuth callback and save tokens
export const handleOAuthCallback = async (code: string, professionalId: string): Promise<boolean> => {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      logger.error('No refresh token received');
      return false;
    }

    // Get user's primary calendar ID
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);
    const calendarId = primaryCalendar?.id || 'primary';

    // SECURITY FIX: Encrypt refresh token before storing in database
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // Save to database
    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        googleCalendarConnected: true,
        googleRefreshToken: encryptedRefreshToken,
        googleCalendarId: calendarId
      }
    });

    return true;
  } catch (error) {
    logger.error('OAuth callback error:', error);
    return false;
  }
};

// Disconnect Google Calendar
export const disconnectCalendar = async (professionalId: string): Promise<boolean> => {
  try {
    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        googleCalendarConnected: false,
        googleRefreshToken: null,
        googleCalendarId: null
      }
    });

    // Delete all synced external events
    await prisma.externalCalendarEvent.deleteMany({
      where: { professionalId }
    });

    return true;
  } catch (error) {
    logger.error('Disconnect calendar error:', error);
    return false;
  }
};

// ============================================
// EVENT COLORS
// ============================================

// Google Calendar color IDs
// https://developers.google.com/calendar/api/v3/reference/colors/get
const EVENT_COLORS = {
  CONFIRMED: '10',    // Green (Basil)
  PENDING: '5',       // Yellow (Banana)
  REMINDER_SENT: '5', // Yellow (Banana)
  PENDING_PAYMENT: '6', // Orange (Tangerine)
  CANCELLED: '11',    // Red (Tomato)
  COMPLETED: '8',     // Gray (Graphite)
  NO_SHOW: '8'        // Gray (Graphite)
};

// ============================================
// CREATE EVENT
// ============================================

interface CreateEventParams {
  professionalId: string;
  appointmentId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  patientName: string;
  patientEmail?: string;
  status: string;
  bookingReference: string;
}

export const createCalendarEvent = async (params: CreateEventParams): Promise<string | null> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: params.professionalId },
      include: { user: true }
    });

    if (!professional?.googleCalendarConnected || !professional.googleCalendarId) {
      return null;
    }

    const oauth2Client = await getAuthenticatedClient(params.professionalId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Format date and times
    const dateStr = params.date.toISOString().split('T')[0];
    const startTimeStr = params.startTime instanceof Date
      ? params.startTime.toISOString().split('T')[1].substring(0, 5)
      : String(params.startTime).substring(0, 5);
    const endTimeStr = params.endTime instanceof Date
      ? params.endTime.toISOString().split('T')[1].substring(0, 5)
      : String(params.endTime).substring(0, 5);

    // Create event
    const event: calendar_v3.Schema$Event = {
      summary: `Cita: ${params.patientName}`,
      description: `Código de reserva: ${params.bookingReference}\nPaciente: ${params.patientName}`,
      start: {
        dateTime: `${dateStr}T${startTimeStr}:00`,
        timeZone: professional.timezone || 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: `${dateStr}T${endTimeStr}:00`,
        timeZone: professional.timezone || 'America/Argentina/Buenos_Aires'
      },
      colorId: EVENT_COLORS[params.status as keyof typeof EVENT_COLORS] || EVENT_COLORS.PENDING,
      reminders: {
        useDefault: false,
        overrides: []
      }
    };

    // Add patient email as attendee if provided
    if (params.patientEmail) {
      event.attendees = [{ email: params.patientEmail }];
    }

    const response = await calendar.events.insert({
      calendarId: professional.googleCalendarId,
      requestBody: event,
      sendUpdates: 'none' // Don't send email notifications
    });

    const googleEventId = response.data.id;

    // Save event ID to appointment
    if (googleEventId) {
      await prisma.appointment.update({
        where: { id: params.appointmentId },
        data: { googleEventId }
      });
    }

    return googleEventId || null;
  } catch (error) {
    logger.error('Create calendar event error:', error);
    return null;
  }
};

// ============================================
// UPDATE EVENT
// ============================================

interface UpdateEventParams {
  professionalId: string;
  googleEventId: string;
  status?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
}

export const updateCalendarEvent = async (params: UpdateEventParams): Promise<boolean> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: params.professionalId }
    });

    if (!professional?.googleCalendarConnected || !professional.googleCalendarId) {
      return false;
    }

    const oauth2Client = await getAuthenticatedClient(params.professionalId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: professional.googleCalendarId,
      eventId: params.googleEventId
    });

    const updateData: calendar_v3.Schema$Event = {
      ...existingEvent.data
    };

    // Update color if status changed
    if (params.status) {
      updateData.colorId = EVENT_COLORS[params.status as keyof typeof EVENT_COLORS] || EVENT_COLORS.PENDING;

      // Update description for cancelled
      if (params.status === 'CANCELLED') {
        updateData.summary = `[CANCELADA] ${existingEvent.data.summary?.replace('[CANCELADA] ', '')}`;
      }
    }

    // Update times if provided
    if (params.date && params.startTime && params.endTime) {
      const dateStr = params.date.toISOString().split('T')[0];
      const startTimeStr = params.startTime instanceof Date
        ? params.startTime.toISOString().split('T')[1].substring(0, 5)
        : String(params.startTime).substring(0, 5);
      const endTimeStr = params.endTime instanceof Date
        ? params.endTime.toISOString().split('T')[1].substring(0, 5)
        : String(params.endTime).substring(0, 5);

      updateData.start = {
        dateTime: `${dateStr}T${startTimeStr}:00`,
        timeZone: professional.timezone || 'America/Argentina/Buenos_Aires'
      };
      updateData.end = {
        dateTime: `${dateStr}T${endTimeStr}:00`,
        timeZone: professional.timezone || 'America/Argentina/Buenos_Aires'
      };
    }

    await calendar.events.update({
      calendarId: professional.googleCalendarId,
      eventId: params.googleEventId,
      requestBody: updateData,
      sendUpdates: 'none'
    });

    return true;
  } catch (error) {
    logger.error('Update calendar event error:', error);
    return false;
  }
};

// ============================================
// DELETE EVENT
// ============================================

export const deleteCalendarEvent = async (
  professionalId: string,
  googleEventId: string
): Promise<boolean> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId }
    });

    if (!professional?.googleCalendarConnected || !professional.googleCalendarId) {
      return false;
    }

    const oauth2Client = await getAuthenticatedClient(professionalId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: professional.googleCalendarId,
      eventId: googleEventId,
      sendUpdates: 'none'
    });

    return true;
  } catch (error) {
    logger.error('Delete calendar event error:', error);
    return false;
  }
};

// ============================================
// SYNC FROM GOOGLE CALENDAR
// Fetch events from Google and block those times on platform
// ============================================

export const syncFromGoogleCalendar = async (professionalId: string): Promise<number> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId }
    });

    if (!professional?.googleCalendarConnected || !professional.googleCalendarId) {
      return 0;
    }

    const oauth2Client = await getAuthenticatedClient(professionalId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from now to 3 months ahead
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const response = await calendar.events.list({
      calendarId: professional.googleCalendarId,
      timeMin: now.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];
    let syncedCount = 0;

    // Get existing platform appointments' Google event IDs
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        googleEventId: { not: null }
      },
      select: { googleEventId: true }
    });
    const platformEventIds = new Set(existingAppointments.map(a => a.googleEventId));

    // Process each event
    for (const event of events) {
      if (!event.id || !event.start?.dateTime || !event.end?.dateTime) continue;

      // Skip events created by our platform
      if (platformEventIds.has(event.id)) continue;

      // Upsert external event
      await prisma.externalCalendarEvent.upsert({
        where: {
          professionalId_googleEventId: {
            professionalId,
            googleEventId: event.id
          }
        },
        create: {
          professionalId,
          googleEventId: event.id,
          title: event.summary || 'Evento sin título',
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime)
        },
        update: {
          title: event.summary || 'Evento sin título',
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime)
        }
      });

      syncedCount++;
    }

    // Clean up deleted events
    const currentGoogleEventIds = events.map(e => e.id).filter(Boolean) as string[];
    await prisma.externalCalendarEvent.deleteMany({
      where: {
        professionalId,
        googleEventId: { notIn: currentGoogleEventIds }
      }
    });

    return syncedCount;
  } catch (error) {
    logger.error('Sync from Google Calendar error:', error);
    return 0;
  }
};

// ============================================
// CHECK CONNECTION STATUS
// ============================================

export const checkConnectionStatus = async (professionalId: string): Promise<{
  connected: boolean;
  calendarId: string | null;
  error?: string;
}> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId }
    });

    if (!professional?.googleCalendarConnected || !professional.googleRefreshToken) {
      return { connected: false, calendarId: null };
    }

    // Try to access calendar to verify token is still valid
    const oauth2Client = await getAuthenticatedClient(professionalId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.calendarList.list({ maxResults: 1 });

    return {
      connected: true,
      calendarId: professional.googleCalendarId
    };
  } catch (error) {
    logger.error('Check connection status error:', error);

    // If token is invalid, disconnect
    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        googleCalendarConnected: false,
        googleRefreshToken: null,
        googleCalendarId: null
      }
    });

    return {
      connected: false,
      calendarId: null,
      error: 'Token expired or revoked'
    };
  }
};

// ============================================
// GET BUSY TIMES (for availability calculation)
// ============================================

export const getBusyTimes = async (
  professionalId: string,
  startDate: Date,
  endDate: Date
): Promise<{ start: Date; end: Date }[]> => {
  try {
    // Get external calendar events
    const externalEvents = await prisma.externalCalendarEvent.findMany({
      where: {
        professionalId,
        startTime: { gte: startDate },
        endTime: { lte: endDate }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    return externalEvents.map(e => ({
      start: e.startTime,
      end: e.endTime
    }));
  } catch (error) {
    logger.error('Get busy times error:', error);
    return [];
  }
};
