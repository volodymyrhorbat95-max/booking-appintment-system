# Database Seeders

Comprehensive database seeders for the Appointment Booking Platform.

## Overview

The seeders create a complete test environment with:
- 1 Admin user
- 3 Professionals with different configurations
- 3 Subscription plans (Basic, Professional, Premium)
- 8 Patients across all professionals
- 9 Appointments (various statuses)
- Availabilities, reminders, message templates, and more

## Running Seeders

### First Time Setup

1. **Run migrations** (creates database schema):
   ```bash
   npx prisma migrate dev
   ```

2. **Run seeders** (populates data):
   ```bash
   npm run prisma:seed
   ```
   or
   ```bash
   npx prisma db seed
   ```

### Reset Database and Reseed

To completely reset the database and run seeders again:

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Automatically run seeders

## Seeder Execution Order

The seeders run in this specific order to respect database relationships:

1. **01-users.seeder.ts** - Creates admin and professional users
2. **02-subscription-plans.seeder.ts** - Creates subscription plans
3. **03-professionals.seeder.ts** - Creates professional profiles (linked to users)
4. **04-subscriptions.seeder.ts** - Creates subscriptions (requires professionals + plans)
5. **05-professional-settings.seeder.ts** - Creates appointment duration settings
6. **06-availabilities.seeder.ts** - Creates weekly availability schedules
7. **07-reminder-settings.seeder.ts** - Creates WhatsApp reminder configurations
8. **08-message-templates.seeder.ts** - Creates message templates
9. **09-custom-form-fields.seeder.ts** - Creates custom booking form fields
10. **10-patients.seeder.ts** - Creates test patients
11. **11-appointments.seeder.ts** - Creates appointments (various statuses)
12. **12-blocked-dates.seeder.ts** - Creates blocked dates (vacations, etc.)
13. **13-platform-settings.seeder.ts** - Creates global platform settings

## Test Data Created

### Admin User
- **Email**: `admin@appointmentplatform.com`
- **Password**: `Admin123!`
- **Role**: ADMIN
- **Access**: Admin dashboard at `/admin`

### Professionals

#### Dr. María García (`/dr-garcia`)
- **Email**: `dr.garcia@example.com`
- **Plan**: Professional (monthly)
- **Schedule**: Mon-Fri, 9:00-13:00 and 15:00-19:00
- **Deposit**: Enabled (AR$ 2,000)
- **Custom Fields**: 3 fields (Motivo de consulta, Primera vez, Obra social)
- **Patients**: 3 (Carlos, Laura, Roberto)
- **Appointments**: 4 (3 upcoming + 1 completed)
- **Vacation**: 5 days next month (15-19)

#### Dr. Juan López (`/dr-lopez`)
- **Email**: `dr.lopez@example.com`
- **Plan**: Basic (annual)
- **Schedule**: Mon-Fri, 10:00-18:00 (continuous)
- **Deposit**: Disabled
- **Custom Fields**: None (simple booking)
- **Patients**: 2 (María, Juan)
- **Appointments**: 2 upcoming

#### Lic. Ana Rodríguez (`/lic-rodriguez`)
- **Email**: `lic.rodriguez@example.com`
- **Plan**: Premium (monthly)
- **Schedule**: Mon-Sat, 8:00-12:00 (mornings only, includes Saturday)
- **Deposit**: Disabled
- **Custom Fields**: 2 fields (Tipo de terapia, Cómo nos conociste)
- **Patients**: 3 (Ana, Pedro, Sofía)
- **Appointments**: 3 upcoming
- **Blocked**: 1 personal day next month (20th)

### Appointments Distribution

**By Status**:
- CONFIRMED: 4 appointments
- PENDING: 3 appointments
- REMINDER_SENT: 1 appointment
- COMPLETED: 1 appointment (past)

**By Professional**:
- Dr. García: 4 (including 1 completed)
- Dr. López: 2
- Lic. Rodríguez: 3

All upcoming appointments are scheduled for next week.

### Subscription Plans

1. **Plan Básico**
   - Monthly: AR$ 5,000
   - Annual: AR$ 50,000
   - Features: 50 turnos/mes, calendario, recordatorios, formulario básico

2. **Plan Profesional**
   - Monthly: AR$ 10,000
   - Annual: AR$ 100,000
   - Features: Turnos ilimitados, Google Calendar, campos personalizados, depósitos, estadísticas

3. **Plan Premium**
   - Monthly: AR$ 20,000
   - Annual: AR$ 200,000
   - Features: Todo lo anterior + múltiples profesionales, API, branding, soporte 24/7

## Testing the Seeded Data

### Test Admin Dashboard
1. Login at `/admin/login`
2. Use credentials: `admin@appointmentplatform.com` / `Admin123!`
3. View all professionals, appointments, statistics

### Test Public Booking
Visit any professional's booking page:
- http://localhost:5173/dr-garcia
- http://localhost:5173/dr-lopez
- http://localhost:5173/lic-rodriguez

### Test Professional OAuth
Use Google OAuth with any professional email to simulate login

## Database Schema

All seeders respect the Prisma schema relationships defined in `schema.prisma`:

- Users → Professionals (1:1)
- Professionals → Subscriptions (1:1)
- Professionals → Patients (1:N)
- Professionals → Appointments (1:N)
- Patients → Appointments (1:N)
- Subscription Plans → Subscriptions (1:N)
- Appointments → Custom Field Values (1:N)
- Appointments → Scheduled Reminders (1:N)

## Modifying Seeders

Each seeder file is independent and can be modified to add more test data:

- Add more professionals in `01-users.seeder.ts` and `03-professionals.seeder.ts`
- Adjust appointment dates in `11-appointments.seeder.ts`
- Change schedules in `06-availabilities.seeder.ts`
- Add more custom fields in `09-custom-form-fields.seeder.ts`

All seeders use `upsert` operations, so they can be run multiple times safely without creating duplicates.

## Troubleshooting

### Error: "Unique constraint failed"
This usually means the database already has data. Use `npx prisma migrate reset` to start fresh.

### Error: "Cannot find module"
Make sure you've run `npm install` and the Prisma client is generated:
```bash
npm install
npx prisma generate
```

### Error: "JWT_SECRET environment variable is not set"
Create a `.env` file in the backend directory with:
```
JWT_SECRET=your-secret-key-min-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Notes

- All passwords are hashed using bcrypt with 12 salt rounds
- Professional users don't have passwords (Google OAuth only)
- Booking references are randomly generated 6-character codes
- Appointments are scheduled for next week to ensure they're in the future
- Patient WhatsApp numbers are unique per professional
