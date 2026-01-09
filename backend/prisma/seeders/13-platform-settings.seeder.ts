// ============================================
// PLATFORM SETTINGS SEEDERS
// Creates global platform settings
// ============================================

import prisma from '../../src/config/database';

export const seedPlatformSettings = async () => {
  console.log('🌱 Seeding platform settings...');

  const settings = [
    { key: 'defaultTimezone', value: 'America/Argentina/Buenos_Aires' },
    { key: 'defaultCountryCode', value: '+54' },
    { key: 'platformName', value: 'Appointment Platform' },
    { key: 'supportEmail', value: 'support@appointmentplatform.com' },
    { key: 'defaultAppointmentDuration', value: '30' },
    { key: 'slotHoldDurationMinutes', value: '5' }
  ];

  const createdSettings: any[] = [];

  for (const setting of settings) {
    const platformSetting = await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
    createdSettings.push(platformSetting);
    console.log(`  ✓ Set ${setting.key} = ${setting.value}`);
  }

  console.log(`✅ Platform settings seeded: ${createdSettings.length} settings\n`);

  return createdSettings;
};
