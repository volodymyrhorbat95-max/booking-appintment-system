# Prisma Database Management

Comprehensive guide for managing the database using Prisma CLI and npm scripts.

## Quick Start

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate

# 5. Seed the database
npm run prisma:seed
```

Or use the all-in-one command:

```bash
npm run db:setup
```

## Available Scripts

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (includes Prisma Client generation) |
| `npm start` | Start production server |

### Database Setup & Management

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Complete database setup (generate + migrate + seed) |
| `npm run db:reset` | Reset database and reseed (⚠️ DESTRUCTIVE) |
| `npm run db:seed` | Run seeders only |

### Prisma Core Commands

| Command | Description |
|---------|-------------|
| `npm run prisma` | Access Prisma CLI directly |
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:validate` | Validate schema.prisma syntax |
| `npm run prisma:format` | Format schema.prisma file |

### Migration Commands

| Command | Description |
|---------|-------------|
| `npm run prisma:migrate` | Create and apply migration (development) |
| `npm run prisma:migrate:create` | Create migration without applying |
| `npm run prisma:migrate:deploy` | Apply migrations (production) |
| `npm run prisma:migrate:status` | Check migration status |
| `npm run prisma:migrate:reset` | Reset database and run all migrations |

### Database Sync Commands

| Command | Description |
|---------|-------------|
| `npm run prisma:push` | Push schema to database (prototyping) |
| `npm run prisma:pull` | Pull schema from database (introspection) |

### Data Management

| Command | Description |
|---------|-------------|
| `npm run prisma:seed` | Run seeders (ts-node) |
| `npm run prisma:seed:force` | Force run seeders via Prisma |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |

## Common Workflows

### 1. Development Workflow

```bash
# Start development server
npm run dev

# In another terminal, open Prisma Studio to view data
npm run prisma:studio
```

### 2. Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Format the schema
npm run prisma:format

# 3. Validate the schema
npm run prisma:validate

# 4. Create migration
npm run prisma:migrate
# Enter migration name when prompted (e.g., "add_user_avatar_field")

# 5. Migration is automatically applied in dev mode
```

### 3. Reset Database (Development)

```bash
# Reset everything and reseed
npm run db:reset

# Or step by step:
npm run prisma:migrate:reset
npm run prisma:seed
```

### 4. Production Deployment

```bash
# 1. Build the application
npm run build

# 2. Apply migrations (no prompts, safe for CI/CD)
npm run prisma:migrate:deploy

# 3. Start the server
npm start
```

### 5. Prototyping (Quick Schema Testing)

```bash
# Push schema changes without creating migration
npm run prisma:push

# When ready, create proper migration
npm run prisma:migrate
```

### 6. Database Introspection

```bash
# Pull existing database schema into Prisma
npm run prisma:pull

# Then generate client
npm run prisma:generate
```

## Prisma Studio

Visual database browser and editor.

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

Features:
- Browse all tables and data
- Edit records directly
- Run queries visually
- Explore relationships
- Perfect for debugging

## Migration Best Practices

### Development

1. ✅ **Use `npm run prisma:migrate`** - Creates migration and applies it
2. ✅ **Name migrations descriptively** - `add_user_role`, `create_appointments_table`
3. ✅ **Review generated SQL** - Check `prisma/migrations/` folder
4. ✅ **Commit migrations to git** - They're part of your schema history

### Production

1. ✅ **Use `npm run prisma:migrate:deploy`** - Only applies migrations
2. ✅ **Never use `prisma:push`** - It's for prototyping only
3. ✅ **Check migration status first** - `npm run prisma:migrate:status`
4. ✅ **Backup before major migrations** - Always have a rollback plan

### DO NOT

❌ **Don't edit migration files** - Once committed, they're immutable
❌ **Don't delete migrations** - This breaks the migration history
❌ **Don't use `db push` in production** - Use proper migrations
❌ **Don't reset in production** - Use `migrate:deploy` instead

## Seeding

Seeders are in `prisma/seeders/` folder.

### Run Seeders

```bash
# Development
npm run prisma:seed

# Or via Prisma directly
npm run prisma:seed:force

# As part of reset
npm run db:reset
```

### Seeder Files

1. `01-users.seeder.ts` - Admin & professional users
2. `02-subscription-plans.seeder.ts` - Subscription plans
3. `03-professionals.seeder.ts` - Professional profiles
4. `04-subscriptions.seeder.ts` - Active subscriptions
5. `05-professional-settings.seeder.ts` - Appointment durations
6. `06-availabilities.seeder.ts` - Weekly schedules
7. `07-reminder-settings.seeder.ts` - WhatsApp reminders
8. `08-message-templates.seeder.ts` - Message templates
9. `09-custom-form-fields.seeder.ts` - Custom fields
10. `10-patients.seeder.ts` - Test patients
11. `11-appointments.seeder.ts` - Sample appointments
12. `12-blocked-dates.seeder.ts` - Vacation days
13. `13-platform-settings.seeder.ts` - Global settings

See [seeders/README.md](seeders/README.md) for details.

## Troubleshooting

### Error: "Prisma Client not generated"

```bash
npm run prisma:generate
```

### Error: "Migration is out of sync"

```bash
# Development - reset and start fresh
npm run db:reset

# Production - check status and apply
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

### Error: "Cannot connect to database"

1. Check `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Verify connection string format:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
   ```

### Error: "Schema validation failed"

```bash
# Validate schema syntax
npm run prisma:validate

# Format schema (may fix minor issues)
npm run prisma:format
```

### Want to see raw SQL?

```bash
# Enable query logging in Prisma Client
# Edit src/config/database.ts:
log: ['query', 'info', 'warn', 'error']
```

## Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/appointment_platform?schema=public"

# Security (required for seeders)
JWT_SECRET="your-secret-key-minimum-32-characters-long"

# Optional: Connection pool size
DATABASE_POOL_SIZE=10
```

## Schema File

Location: `prisma/schema.prisma`

Key sections:
- **Generator**: Prisma Client configuration
- **Datasource**: Database connection
- **Models**: Database tables and relationships
- **Enums**: Enumerated types
- **Indexes**: Performance indexes (Section 12.1 compliance)

## Performance Features

The schema includes:
- ✅ **26+ strategic indexes** for fast queries
- ✅ **Connection pooling** configured
- ✅ **Transaction settings** optimized
- ✅ **Cascading deletes** for data integrity
- ✅ **Unique constraints** for business logic

See Section 12 (Performance Requirements) in schema comments.

## Security Features

- ✅ **No sensitive data in schema** - Uses environment variables
- ✅ **Proper foreign keys** - Enforces referential integrity
- ✅ **Cascading deletes** - Prevents orphaned records
- ✅ **Unique constraints** - Prevents duplicate data
- ✅ **Nullable fields** - Explicit null handling

See Section 13 (Security Requirements) for more.

## Useful Prisma CLI Commands

```bash
# Direct Prisma CLI access
npx prisma --help

# Generate and immediately open Studio
npx prisma studio

# Create migration interactively
npx prisma migrate dev

# View Prisma version
npx prisma --version

# Initialize new Prisma project (already done)
npx prisma init
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Studio](https://www.prisma.io/studio)

## Support

For project-specific questions, see:
- Database schema: `prisma/schema.prisma`
- Seeders: `prisma/seeders/README.md`
- Project requirements: `overview/requirements.md`
