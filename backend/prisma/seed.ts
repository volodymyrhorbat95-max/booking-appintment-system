// ============================================
// MAIN SEED FILE
// Orchestrates all seeders in correct order
// Run with: npx prisma db seed
// ============================================

import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeders/01-users.seeder';
import { seedSubscriptionPlans } from './seeders/02-subscription-plans.seeder';
import { seedProfessionals } from './seeders/03-professionals.seeder';
import { seedSubscriptions } from './seeders/04-subscriptions.seeder';
import { seedProfessionalSettings } from './seeders/05-professional-settings.seeder';
import { seedAvailabilities } from './seeders/06-availabilities.seeder';
import { seedReminderSettings } from './seeders/07-reminder-settings.seeder';
import { seedMessageTemplates } from './seeders/08-message-templates.seeder';
import { seedCustomFormFields } from './seeders/09-custom-form-fields.seeder';
import { seedPatients } from './seeders/10-patients.seeder';
import { seedAppointments } from './seeders/11-appointments.seeder';
import { seedBlockedDates } from './seeders/12-blocked-dates.seeder';
import { seedPlatformSettings } from './seeders/13-platform-settings.seeder';
import { seedPayments } from './seeders/14-payments.seeder';
import { seedScheduledReminders } from './seeders/15-scheduled-reminders.seeder';
import { seedAppointmentCustomFieldValues } from './seeders/16-appointment-custom-field-values.seeder';
import { seedExternalCalendarEvents } from './seeders/17-external-calendar-events.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🚀 Starting database seeding...\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // 1. Create users (admin + professionals)
    const { admin, professionals: professionalUsers } = await seedUsers();

    // 2. Create subscription plans
    const plans = await seedSubscriptionPlans();

    // 3. Create professional profiles
    const professionals = await seedProfessionals(professionalUsers);

    // 4. Create subscriptions (requires professionals and plans)
    const subscriptions = await seedSubscriptions(professionals, plans);

    // 5. Create professional settings
    await seedProfessionalSettings(professionals);

    // 6. Create availabilities
    await seedAvailabilities(professionals);

    // 7. Create reminder settings
    await seedReminderSettings(professionals);

    // 8. Create message templates
    await seedMessageTemplates(professionals);

    // 9. Create custom form fields
    await seedCustomFormFields(professionals);

    // 10. Create patients (10 per professional)
    const patients = await seedPatients(professionals);

    // 11. Create appointments (various statuses)
    const appointments = await seedAppointments(professionals, patients);

    // 12. Create blocked dates
    await seedBlockedDates(professionals);

    // 13. Create platform settings
    await seedPlatformSettings();

    // 14. Create payments (subscription and deposit payments)
    const payments = await seedPayments(subscriptions);

    // 15. Create scheduled reminders for appointments
    const reminders = await seedScheduledReminders();

    // 16. Create custom field values for appointments
    const customFieldValues = await seedAppointmentCustomFieldValues();

    // 17. Create external calendar events
    const externalEvents = await seedExternalCalendarEvents(professionals);

    console.log('='.repeat(60));
    console.log('\n');
    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - 1 Admin user');
    console.log(`  - ${professionals.length} Professionals`);
    console.log(`  - ${plans.length} Subscription plans`);
    console.log(`  - ${subscriptions.length} Subscriptions`);
    console.log(`  - ${patients.length} Patients (${Math.round(patients.length / professionals.length)} per professional)`);
    console.log(`  - ${appointments.length} Appointments (all statuses covered)`);
    console.log(`  - ${payments.length} Payments`);
    console.log(`  - ${reminders.length} Scheduled reminders`);
    console.log(`  - ${customFieldValues.length} Custom field values`);
    console.log(`  - ${externalEvents.length} External calendar events`);
    console.log('  - Availabilities, reminder settings, message templates');
    console.log('  - Custom form fields, blocked dates, platform settings\n');
    console.log('🔐 Admin Login:');
    console.log('  Email: admin@appointmentplatform.com');
    console.log('  Password: Admin123!\n');
    console.log('👨‍⚕️ Professional Login (all use password: Prof123!):');
    console.log('  - dr.garcia@example.com');
    console.log('  - dr.lopez@example.com');
    console.log('  - lic.rodriguez@example.com\n');
    console.log('📅 Professional Booking Pages:');
    console.log('  - http://localhost:5173/dr-garcia');
    console.log('  - http://localhost:5173/dr-lopez');
    console.log('  - http://localhost:5173/lic-rodriguez\n');
    console.log('='.repeat(60));
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Error seeding database:');
    console.error(error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
