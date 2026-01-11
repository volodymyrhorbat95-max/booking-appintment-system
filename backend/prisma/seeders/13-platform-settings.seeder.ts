// ============================================
// PLATFORM SETTINGS SEEDERS
// Creates comprehensive global platform settings
// All admin-configurable settings for the platform
// ============================================

import prisma from '../../src/config/database';

export const seedPlatformSettings = async () => {
  console.log('🌱 Seeding platform settings...');

  const settings = [
    // Basic Configuration
    { key: 'platformName', value: 'Agendux' },
    { key: 'platformTagline', value: 'Tu sistema de gestión de turnos profesional' },
    { key: 'supportEmail', value: 'soporte@agendux.com' },
    { key: 'contactPhone', value: '+54 11 1234-5678' },

    // Localization
    { key: 'defaultTimezone', value: 'America/Argentina/Buenos_Aires' },
    { key: 'defaultCountryCode', value: '+54' },
    { key: 'defaultCurrency', value: 'ARS' },
    { key: 'defaultLanguage', value: 'es' },

    // Appointment Defaults
    { key: 'defaultAppointmentDuration', value: '30' },
    { key: 'minAppointmentDuration', value: '5' },
    { key: 'maxAppointmentDuration', value: '180' },
    { key: 'appointmentDurationIncrement', value: '5' },

    // Booking Configuration
    { key: 'slotHoldDurationMinutes', value: '5' },
    { key: 'maxAdvanceBookingDays', value: '90' },
    { key: 'minAdvanceBookingHours', value: '2' },
    { key: 'allowSameDayBooking', value: 'true' },
    { key: 'requirePatientEmail', value: 'true' },
    { key: 'requirePatientPhone', value: 'true' },

    // Deposit Configuration
    { key: 'depositTimeLimitMinutes', value: '30' },
    { key: 'defaultDepositAmount', value: '2000' },
    { key: 'depositCurrency', value: 'ARS' },
    { key: 'enableDepositsByDefault', value: 'false' },

    // Reminder Configuration
    { key: 'defaultReminderHours', value: '24' },
    { key: 'enableReminders', value: 'true' },
    { key: 'maxRemindersPerAppointment', value: '3' },
    { key: 'enableNightBeforeReminder', value: 'true' },
    { key: 'nightBeforeReminderTime', value: '20:00' },

    // WhatsApp Configuration
    { key: 'whatsappEnabled', value: 'true' },
    { key: 'whatsappSenderName', value: 'Agendux' },
    { key: 'whatsappBusinessNumber', value: '+14155238886' },

    // Email Configuration
    { key: 'emailEnabled', value: 'true' },
    { key: 'emailSenderName', value: 'Agendux' },
    { key: 'emailSenderAddress', value: 'noreply@agendux.com' },

    // Payment Configuration (Mercado Pago)
    { key: 'mercadoPagoEnabled', value: 'true' },
    { key: 'paymentProcessorCountry', value: 'AR' },
    { key: 'acceptCreditCards', value: 'true' },
    { key: 'acceptDebitCards', value: 'true' },
    { key: 'acceptBankTransfer', value: 'false' },

    // Google Calendar
    { key: 'googleCalendarEnabled', value: 'true' },
    { key: 'googleCalendarSyncInterval', value: '5' },
    { key: 'googleCalendarAutoBlock', value: 'true' },

    // Security
    { key: 'jwtExpiresIn', value: '7d' },
    { key: 'sessionTimeoutMinutes', value: '60' },
    { key: 'maxLoginAttempts', value: '5' },
    { key: 'lockoutDurationMinutes', value: '15' },
    { key: 'requireStrongPassword', value: 'true' },
    { key: 'minPasswordLength', value: '8' },

    // Rate Limiting
    { key: 'rateLimitWindowMinutes', value: '15' },
    { key: 'rateLimitMaxRequests', value: '100' },
    { key: 'publicBookingRateLimit', value: '10' },

    // Features
    { key: 'enableCustomFormFields', value: 'true' },
    { key: 'enableMultipleTimeSlots', value: 'true' },
    { key: 'enableVacationMode', value: 'true' },
    { key: 'enableStatistics', value: 'true' },
    { key: 'enableExport', value: 'true' },

    // Analytics
    { key: 'googleAnalyticsId', value: '' },
    { key: 'facebookPixelId', value: '' },
    { key: 'enableAnalytics', value: 'false' },

    // Maintenance
    { key: 'maintenanceMode', value: 'false' },
    { key: 'maintenanceMessage', value: 'Estamos realizando mejoras. Volveremos pronto.' },

    // Business Rules
    { key: 'allowCancellationHoursBefore', value: '24' },
    { key: 'allowReschedulingHoursBefore', value: '12' },
    { key: 'autoCompleteAppointmentsAfterHours', value: '2' },
    { key: 'autoMarkNoShowAfterMinutes', value: '15' },

    // Notifications
    { key: 'notifyProfessionalNewBooking', value: 'true' },
    { key: 'notifyProfessionalCancellation', value: 'true' },
    { key: 'notifyPatientConfirmation', value: 'true' },
    { key: 'notifyPatientReminder', value: 'true' },

    // Trial Settings
    { key: 'trialDurationDays', value: '14' },
    { key: 'trialMaxAppointments', value: '10' },
    { key: 'trialRequiresCreditCard', value: 'false' },

    // UI/UX
    { key: 'defaultTheme', value: 'light' },
    { key: 'enableDarkMode', value: 'true' },
    { key: 'dateFormat', value: 'DD/MM/YYYY' },
    { key: 'timeFormat', value: 'HH:mm' },
    { key: 'firstDayOfWeek', value: '1' } // Monday
  ];

  const createdSettings: any[] = [];

  for (const setting of settings) {
    try {
      const platformSetting = await prisma.platformSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
      createdSettings.push(platformSetting);
    } catch (error) {
      console.log(`  ⚠ Failed to create setting ${setting.key}: ${(error as Error).message}`);
    }
  }

  console.log(`✅ Platform settings seeded: ${createdSettings.length} settings\n`);

  return createdSettings;
};
