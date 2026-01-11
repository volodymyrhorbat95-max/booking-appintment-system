/**
 * Unit Tests for Google Calendar Service
 * Tests critical Google Calendar integration functionality
 *
 * Coverage:
 * - OAuth flow (authorization URL, callback, token handling)
 * - Calendar connection and disconnection
 * - Event creation with appointment details
 * - Event updates (status changes, time changes)
 * - Event deletion
 * - Two-way sync from Google Calendar
 * - Connection status verification
 * - Busy times calculation
 * - Error handling and resilience
 */

// Set environment variables BEFORE any imports
process.env.GOOGLE_CLIENT_ID = 'test_client_id_123';
process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret_456';
process.env.GOOGLE_CALENDAR_REDIRECT_URI = 'http://localhost:5000/api/callback';

// Mock googleapis FIRST
const mockGenerateAuthUrl = jest.fn();
const mockGetToken = jest.fn();
const mockSetCredentials = jest.fn();
const mockOnTokens = jest.fn();
const mockEventsInsert = jest.fn();
const mockEventsUpdate = jest.fn();
const mockEventsDelete = jest.fn();
const mockEventsGet = jest.fn();
const mockEventsList = jest.fn();
const mockCalendarListList = jest.fn();

// Create fresh mock OAuth2 client for each invocation
const createMockOAuth2Client = () => ({
  generateAuthUrl: mockGenerateAuthUrl,
  getToken: mockGetToken,
  setCredentials: mockSetCredentials,
  on: mockOnTokens,
});

const mockCalendar = {
  events: {
    insert: mockEventsInsert,
    update: mockEventsUpdate,
    delete: mockEventsDelete,
    get: mockEventsGet,
    list: mockEventsList,
  },
  calendarList: {
    list: mockCalendarListList,
  },
};

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => createMockOAuth2Client()),
    },
    calendar: jest.fn(() => mockCalendar),
  },
}));

// Mock Prisma client
const mockPrisma: any = {
  professional: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  externalCalendarEvent: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  default: mockPrisma,
  __esModule: true,
}));

// Mock logger
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../utils/logger', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
  },
  ServiceLogger: jest.fn(),
}));

// NOW import the service (after mocks are defined)
import {
  getAuthUrl,
  handleOAuthCallback,
  disconnectCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncFromGoogleCalendar,
  checkConnectionStatus,
  getBusyTimes,
} from '../../services/google-calendar.service';

describe('Google Calendar Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate OAuth authorization URL', () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';
      mockGenerateAuthUrl.mockReturnValue(mockUrl);

      const url = getAuthUrl('prof_123');

      expect(url).toBe(mockUrl);
      expect(mockGenerateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: expect.arrayContaining([
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ]),
        prompt: 'consent',
        state: 'prof_123',
      });
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback and save tokens', async () => {
      const mockTokens = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_456',
      };

      mockGetToken.mockResolvedValue({ tokens: mockTokens });
      mockCalendarListList.mockResolvedValue({
        data: {
          items: [
            { id: 'primary@example.com', primary: true },
            { id: 'other@example.com', primary: false },
          ],
        },
      });
      mockPrisma.professional.update.mockResolvedValue({ id: 'prof_123' });

      const result = await handleOAuthCallback('auth_code_123', 'prof_123');

      expect(result).toBe(true);
      expect(mockGetToken).toHaveBeenCalledWith('auth_code_123');
      expect(mockSetCredentials).toHaveBeenCalledWith(mockTokens);
      expect(mockPrisma.professional.update).toHaveBeenCalledWith({
        where: { id: 'prof_123' },
        data: {
          googleCalendarConnected: true,
          googleRefreshToken: 'refresh_token_456',
          googleCalendarId: 'primary@example.com',
        },
      });
    });

    it('should use "primary" as calendar ID if no primary calendar found', async () => {
      const mockTokens = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_456',
      };

      mockGetToken.mockResolvedValue({ tokens: mockTokens });
      mockCalendarListList.mockResolvedValue({
        data: {
          items: [{ id: 'calendar@example.com', primary: false }],
        },
      });
      mockPrisma.professional.update.mockResolvedValue({ id: 'prof_123' });

      const result = await handleOAuthCallback('auth_code_123', 'prof_123');

      expect(result).toBe(true);
      expect(mockPrisma.professional.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleCalendarId: 'primary',
          }),
        })
      );
    });

    it('should return false if no refresh token received', async () => {
      mockGetToken.mockResolvedValue({
        tokens: { access_token: 'access_token_123' }, // No refresh_token
      });

      const result = await handleOAuthCallback('auth_code_123', 'prof_123');

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalledWith('No refresh token received');
      expect(mockPrisma.professional.update).not.toHaveBeenCalled();
    });

    it('should handle OAuth errors gracefully', async () => {
      mockGetToken.mockRejectedValue(new Error('OAuth error'));

      const result = await handleOAuthCallback('invalid_code', 'prof_123');

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('disconnectCalendar', () => {
    it('should disconnect Google Calendar and delete external events', async () => {
      mockPrisma.professional.update.mockResolvedValue({ id: 'prof_123' });
      mockPrisma.externalCalendarEvent.deleteMany.mockResolvedValue({
        count: 5,
      });

      const result = await disconnectCalendar('prof_123');

      expect(result).toBe(true);
      expect(mockPrisma.professional.update).toHaveBeenCalledWith({
        where: { id: 'prof_123' },
        data: {
          googleCalendarConnected: false,
          googleRefreshToken: null,
          googleCalendarId: null,
        },
      });
      expect(mockPrisma.externalCalendarEvent.deleteMany).toHaveBeenCalledWith({
        where: { professionalId: 'prof_123' },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.professional.update.mockRejectedValue(
        new Error('Database error')
      );

      const result = await disconnectCalendar('prof_123');

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('createCalendarEvent', () => {
    it('should create calendar event with appointment details', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
        timezone: 'America/Argentina/Buenos_Aires',
        user: { email: 'prof@example.com' },
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsInsert.mockResolvedValue({
        data: { id: 'google_event_123' },
      });
      mockPrisma.appointment.update.mockResolvedValue({ id: 'apt_123' });

      const params = {
        professionalId: 'prof_123',
        appointmentId: 'apt_123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        endTime: new Date('2026-02-15T11:00:00Z'),
        patientName: 'Juan Pérez',
        patientEmail: 'juan@example.com',
        status: 'CONFIRMED',
        bookingReference: 'ABC123',
      };

      const result = await createCalendarEvent(params);

      expect(result).toBe('google_event_123');
      expect(mockEventsInsert).toHaveBeenCalledWith({
        calendarId: 'calendar@example.com',
        requestBody: expect.objectContaining({
          summary: 'Cita: Juan Pérez',
          description: expect.stringContaining('ABC123'),
          attendees: [{ email: 'juan@example.com' }],
          colorId: '10', // CONFIRMED color
        }),
        sendUpdates: 'none',
      });
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt_123' },
        data: { googleEventId: 'google_event_123' },
      });
    });

    it('should create event without attendees if no patient email', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
        timezone: 'America/Argentina/Buenos_Aires',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsInsert.mockResolvedValue({
        data: { id: 'google_event_123' },
      });
      mockPrisma.appointment.update.mockResolvedValue({ id: 'apt_123' });

      const params = {
        professionalId: 'prof_123',
        appointmentId: 'apt_123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        endTime: new Date('2026-02-15T11:00:00Z'),
        patientName: 'Juan Pérez',
        status: 'PENDING',
        bookingReference: 'ABC123',
      };

      await createCalendarEvent(params);

      const insertCall = mockEventsInsert.mock.calls[0][0];
      expect(insertCall.requestBody.attendees).toBeUndefined();
    });

    it('should return null if calendar not connected', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        googleCalendarConnected: false,
      });

      const params = {
        professionalId: 'prof_123',
        appointmentId: 'apt_123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        endTime: new Date('2026-02-15T11:00:00Z'),
        patientName: 'Juan Pérez',
        status: 'PENDING',
        bookingReference: 'ABC123',
      };

      const result = await createCalendarEvent(params);

      expect(result).toBe(null);
      expect(mockEventsInsert).not.toHaveBeenCalled();
    });

    it('should handle Google Calendar API errors gracefully', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
        timezone: 'America/Argentina/Buenos_Aires',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsInsert.mockRejectedValue(new Error('API error'));

      const params = {
        professionalId: 'prof_123',
        appointmentId: 'apt_123',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00Z'),
        endTime: new Date('2026-02-15T11:00:00Z'),
        patientName: 'Juan Pérez',
        status: 'PENDING',
        bookingReference: 'ABC123',
      };

      const result = await createCalendarEvent(params);

      expect(result).toBe(null);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('updateCalendarEvent', () => {
    it('should update calendar event status', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
        timezone: 'America/Argentina/Buenos_Aires',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsGet.mockResolvedValue({
        data: {
          id: 'google_event_123',
          summary: 'Cita: Juan Pérez',
          start: { dateTime: '2026-02-15T10:00:00Z' },
          end: { dateTime: '2026-02-15T11:00:00Z' },
        },
      });
      mockEventsUpdate.mockResolvedValue({ data: { id: 'google_event_123' } });

      const result = await updateCalendarEvent({
        professionalId: 'prof_123',
        googleEventId: 'google_event_123',
        status: 'CONFIRMED',
      });

      expect(result).toBe(true);
      expect(mockEventsUpdate).toHaveBeenCalledWith({
        calendarId: 'calendar@example.com',
        eventId: 'google_event_123',
        requestBody: expect.objectContaining({
          colorId: '10', // CONFIRMED color
        }),
        sendUpdates: 'none',
      });
    });

    it('should add [CANCELADA] prefix when status is CANCELLED', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
        timezone: 'America/Argentina/Buenos_Aires',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsGet.mockResolvedValue({
        data: {
          id: 'google_event_123',
          summary: 'Cita: Juan Pérez',
        },
      });
      mockEventsUpdate.mockResolvedValue({ data: { id: 'google_event_123' } });

      await updateCalendarEvent({
        professionalId: 'prof_123',
        googleEventId: 'google_event_123',
        status: 'CANCELLED',
      });

      const updateCall = mockEventsUpdate.mock.calls[0][0];
      expect(updateCall.requestBody.summary).toContain('[CANCELADA]');
      expect(updateCall.requestBody.colorId).toBe('11'); // CANCELLED color
    });

    it('should update event date and time', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
        timezone: 'America/Argentina/Buenos_Aires',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsGet.mockResolvedValue({
        data: {
          id: 'google_event_123',
          summary: 'Cita: Juan Pérez',
        },
      });
      mockEventsUpdate.mockResolvedValue({ data: { id: 'google_event_123' } });

      await updateCalendarEvent({
        professionalId: 'prof_123',
        googleEventId: 'google_event_123',
        date: new Date('2026-02-20'),
        startTime: new Date('2026-02-20T14:00:00Z'),
        endTime: new Date('2026-02-20T15:00:00Z'),
      });

      const updateCall = mockEventsUpdate.mock.calls[0][0];
      expect(updateCall.requestBody.start).toBeDefined();
      expect(updateCall.requestBody.end).toBeDefined();
    });

    it('should return false if calendar not connected', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        googleCalendarConnected: false,
      });

      const result = await updateCalendarEvent({
        professionalId: 'prof_123',
        googleEventId: 'google_event_123',
        status: 'CONFIRMED',
      });

      expect(result).toBe(false);
      expect(mockEventsUpdate).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsGet.mockRejectedValue(new Error('API error'));

      const result = await updateCalendarEvent({
        professionalId: 'prof_123',
        googleEventId: 'google_event_123',
        status: 'CONFIRMED',
      });

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('deleteCalendarEvent', () => {
    it('should delete calendar event', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsDelete.mockResolvedValue({});

      const result = await deleteCalendarEvent('prof_123', 'google_event_123');

      expect(result).toBe(true);
      expect(mockEventsDelete).toHaveBeenCalledWith({
        calendarId: 'calendar@example.com',
        eventId: 'google_event_123',
        sendUpdates: 'none',
      });
    });

    it('should return false if calendar not connected', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        googleCalendarConnected: false,
      });

      const result = await deleteCalendarEvent('prof_123', 'google_event_123');

      expect(result).toBe(false);
      expect(mockEventsDelete).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsDelete.mockRejectedValue(new Error('API error'));

      const result = await deleteCalendarEvent('prof_123', 'google_event_123');

      expect(result).toBe(false);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('syncFromGoogleCalendar', () => {
    it('should sync events from Google Calendar', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      const googleEvents = [
        {
          id: 'google_event_1',
          summary: 'External Event 1',
          start: { dateTime: '2026-02-15T10:00:00Z' },
          end: { dateTime: '2026-02-15T11:00:00Z' },
        },
        {
          id: 'google_event_2',
          summary: 'External Event 2',
          start: { dateTime: '2026-02-16T14:00:00Z' },
          end: { dateTime: '2026-02-16T15:00:00Z' },
        },
      ];

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsList.mockResolvedValue({ data: { items: googleEvents } });
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.externalCalendarEvent.upsert.mockResolvedValue({});
      mockPrisma.externalCalendarEvent.deleteMany.mockResolvedValue({ count: 0 });

      const syncedCount = await syncFromGoogleCalendar('prof_123');

      expect(syncedCount).toBe(2);
      expect(mockPrisma.externalCalendarEvent.upsert).toHaveBeenCalledTimes(2);
    });

    it('should skip platform-created events during sync', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      const googleEvents = [
        {
          id: 'platform_event_1',
          summary: 'Platform Event',
          start: { dateTime: '2026-02-15T10:00:00Z' },
          end: { dateTime: '2026-02-15T11:00:00Z' },
        },
        {
          id: 'google_event_2',
          summary: 'External Event',
          start: { dateTime: '2026-02-16T14:00:00Z' },
          end: { dateTime: '2026-02-16T15:00:00Z' },
        },
      ];

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsList.mockResolvedValue({ data: { items: googleEvents } });
      mockPrisma.appointment.findMany.mockResolvedValue([
        { googleEventId: 'platform_event_1' },
      ]);
      mockPrisma.externalCalendarEvent.upsert.mockResolvedValue({});
      mockPrisma.externalCalendarEvent.deleteMany.mockResolvedValue({ count: 0 });

      const syncedCount = await syncFromGoogleCalendar('prof_123');

      expect(syncedCount).toBe(1); // Only external event counted
      expect(mockPrisma.externalCalendarEvent.upsert).toHaveBeenCalledTimes(1);
    });

    it('should clean up deleted events', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsList.mockResolvedValue({
        data: {
          items: [
            {
              id: 'google_event_1',
              summary: 'Active Event',
              start: { dateTime: '2026-02-15T10:00:00Z' },
              end: { dateTime: '2026-02-15T11:00:00Z' },
            },
          ],
        },
      });
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.externalCalendarEvent.upsert.mockResolvedValue({});
      mockPrisma.externalCalendarEvent.deleteMany.mockResolvedValue({ count: 2 });

      await syncFromGoogleCalendar('prof_123');

      expect(mockPrisma.externalCalendarEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          professionalId: 'prof_123',
          googleEventId: { notIn: ['google_event_1'] },
        },
      });
    });

    it('should return 0 if calendar not connected', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        googleCalendarConnected: false,
      });

      const result = await syncFromGoogleCalendar('prof_123');

      expect(result).toBe(0);
      expect(mockEventsList).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleCalendarId: 'calendar@example.com',
        googleRefreshToken: 'refresh_token_123',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockEventsList.mockRejectedValue(new Error('API error'));

      const result = await syncFromGoogleCalendar('prof_123');

      expect(result).toBe(0);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('checkConnectionStatus', () => {
    it('should return connected status with calendar ID', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleRefreshToken: 'refresh_token_123',
        googleCalendarId: 'calendar@example.com',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockCalendarListList.mockResolvedValue({ data: { items: [] } });

      const result = await checkConnectionStatus('prof_123');

      expect(result.connected).toBe(true);
      expect(result.calendarId).toBe('calendar@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return disconnected if not connected', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'prof_123',
        googleCalendarConnected: false,
      });

      const result = await checkConnectionStatus('prof_123');

      expect(result.connected).toBe(false);
      expect(result.calendarId).toBe(null);
    });

    it('should disconnect if token is invalid', async () => {
      const professional = {
        id: 'prof_123',
        googleCalendarConnected: true,
        googleRefreshToken: 'invalid_token',
        googleCalendarId: 'calendar@example.com',
      };

      mockPrisma.professional.findUnique.mockResolvedValue(professional);
      mockCalendarListList.mockRejectedValue(new Error('Token expired'));
      mockPrisma.professional.update.mockResolvedValue({ id: 'prof_123' });

      const result = await checkConnectionStatus('prof_123');

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Token expired or revoked');
      expect(mockPrisma.professional.update).toHaveBeenCalledWith({
        where: { id: 'prof_123' },
        data: {
          googleCalendarConnected: false,
          googleRefreshToken: null,
          googleCalendarId: null,
        },
      });
    });
  });

  describe('getBusyTimes', () => {
    it('should return busy times from external events', async () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      const externalEvents = [
        {
          startTime: new Date('2026-02-15T10:00:00Z'),
          endTime: new Date('2026-02-15T11:00:00Z'),
        },
        {
          startTime: new Date('2026-02-20T14:00:00Z'),
          endTime: new Date('2026-02-20T15:00:00Z'),
        },
      ];

      mockPrisma.externalCalendarEvent.findMany.mockResolvedValue(
        externalEvents
      );

      const busyTimes = await getBusyTimes('prof_123', startDate, endDate);

      expect(busyTimes).toHaveLength(2);
      expect(busyTimes[0].start).toEqual(externalEvents[0].startTime);
      expect(busyTimes[0].end).toEqual(externalEvents[0].endTime);
      expect(busyTimes[1].start).toEqual(externalEvents[1].startTime);
      expect(busyTimes[1].end).toEqual(externalEvents[1].endTime);
    });

    it('should return empty array if no external events', async () => {
      mockPrisma.externalCalendarEvent.findMany.mockResolvedValue([]);

      const busyTimes = await getBusyTimes(
        'prof_123',
        new Date('2026-02-01'),
        new Date('2026-02-28')
      );

      expect(busyTimes).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.externalCalendarEvent.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const busyTimes = await getBusyTimes(
        'prof_123',
        new Date('2026-02-01'),
        new Date('2026-02-28')
      );

      expect(busyTimes).toEqual([]);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });
});
