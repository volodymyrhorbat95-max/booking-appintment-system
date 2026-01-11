/**
 * DATA MIGRATION SCRIPT - Encrypt Existing Sensitive Data
 *
 * This script encrypts existing sensitive data in the database:
 * - Google OAuth refresh tokens (Professional table)
 * - Patient email addresses (Patient table)
 * - Patient WhatsApp numbers (Patient table)
 *
 * IMPORTANT:
 * - Backup your database before running this script
 * - Set ENCRYPTION_KEY environment variable before running
 * - Run this script only ONCE after deploying encryption code
 * - This script is idempotent - it detects and skips already-encrypted data
 *
 * Usage:
 *   npm run migrate:encrypt
 *   or
 *   ts-node src/scripts/migrate-encrypt-sensitive-data.ts
 */

import prisma from '../config/database';
import { encrypt, isEncrypted, testEncryption } from '../utils/encryption';
import { logger } from '../utils/logger';

interface MigrationStats {
  professionalsTotal: number;
  professionalsEncrypted: number;
  professionalsSkipped: number;
  professionalsErrors: number;
  patientsTotal: number;
  patientsEncrypted: number;
  patientsSkipped: number;
  patientsErrors: number;
}

async function migrateGoogleRefreshTokens(): Promise<{
  encrypted: number;
  skipped: number;
  errors: number;
}> {
  logger.info('[Migration] Starting Google refresh token encryption...');

  let encrypted = 0;
  let skipped = 0;
  let errors = 0;

  // Get all professionals with Google Calendar connected
  const professionals = await prisma.professional.findMany({
    where: {
      googleRefreshToken: { not: null }
    },
    select: {
      id: true,
      googleRefreshToken: true,
      firstName: true,
      lastName: true
    }
  });

  logger.info(`[Migration] Found ${professionals.length} professionals with Google refresh tokens`);

  for (const professional of professionals) {
    try {
      if (!professional.googleRefreshToken) {
        skipped++;
        continue;
      }

      // Check if already encrypted
      if (isEncrypted(professional.googleRefreshToken)) {
        logger.info(`[Migration] Professional ${professional.id} (${professional.firstName} ${professional.lastName}): Already encrypted, skipping`);
        skipped++;
        continue;
      }

      // Encrypt the token
      const encryptedToken = encrypt(professional.googleRefreshToken);

      // Update in database
      await prisma.professional.update({
        where: { id: professional.id },
        data: { googleRefreshToken: encryptedToken }
      });

      logger.info(`[Migration] Professional ${professional.id} (${professional.firstName} ${professional.lastName}): Encrypted refresh token`);
      encrypted++;
    } catch (error: any) {
      logger.error(`[Migration] Professional ${professional.id}: ERROR - ${error.message}`);
      errors++;
    }
  }

  return { encrypted, skipped, errors };
}

async function migratePatientPII(): Promise<{
  encrypted: number;
  skipped: number;
  errors: number;
}> {
  logger.info('[Migration] Starting patient PII encryption...');

  let encrypted = 0;
  let skipped = 0;
  let errors = 0;

  // Get all patients
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      whatsappNumber: true,
      professionalId: true
    }
  });

  logger.info(`[Migration] Found ${patients.length} patients to process`);

  for (const patient of patients) {
    try {
      const emailAlreadyEncrypted = isEncrypted(patient.email);
      const phoneAlreadyEncrypted = isEncrypted(patient.whatsappNumber);

      if (emailAlreadyEncrypted && phoneAlreadyEncrypted) {
        logger.info(`[Migration] Patient ${patient.id} (${patient.firstName} ${patient.lastName}): Already encrypted, skipping`);
        skipped++;
        continue;
      }

      // Prepare encrypted data
      const encryptedEmail = emailAlreadyEncrypted ? patient.email : encrypt(patient.email);
      const encryptedPhone = phoneAlreadyEncrypted ? patient.whatsappNumber : encrypt(patient.whatsappNumber);

      // Update in database
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          email: encryptedEmail,
          whatsappNumber: encryptedPhone
        }
      });

      logger.info(`[Migration] Patient ${patient.id} (${patient.firstName} ${patient.lastName}): Encrypted PII (email: ${!emailAlreadyEncrypted}, phone: ${!phoneAlreadyEncrypted})`);
      encrypted++;
    } catch (error: any) {
      logger.error(`[Migration] Patient ${patient.id}: ERROR - ${error.message}`);
      errors++;
    }
  }

  return { encrypted, skipped, errors };
}

async function verifyMigration(): Promise<boolean> {
  logger.info('[Migration] Verifying encryption...');

  let allValid = true;

  // Verify professionals
  const professionals = await prisma.professional.findMany({
    where: { googleRefreshToken: { not: null } },
    select: { id: true, googleRefreshToken: true, firstName: true, lastName: true }
  });

  for (const professional of professionals) {
    if (!professional.googleRefreshToken) continue;

    if (!isEncrypted(professional.googleRefreshToken)) {
      logger.error(`[Migration] VERIFICATION FAILED: Professional ${professional.id} has unencrypted token`);
      allValid = false;
    }
  }

  // Verify patients
  const patients = await prisma.patient.findMany({
    select: { id: true, email: true, whatsappNumber: true, firstName: true, lastName: true }
  });

  for (const patient of patients) {
    if (!isEncrypted(patient.email)) {
      logger.error(`[Migration] VERIFICATION FAILED: Patient ${patient.id} has unencrypted email`);
      allValid = false;
    }
    if (!isEncrypted(patient.whatsappNumber)) {
      logger.error(`[Migration] VERIFICATION FAILED: Patient ${patient.id} has unencrypted phone`);
      allValid = false;
    }
  }

  return allValid;
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('DATA MIGRATION: Encrypt Sensitive Data');
  console.log('========================================');
  console.log('');

  // Test encryption first
  logger.info('[Migration] Testing encryption utility...');
  const encryptionWorking = testEncryption();

  if (!encryptionWorking) {
    logger.error('[Migration] CRITICAL: Encryption test failed. Check ENCRYPTION_KEY configuration.');
    process.exit(1);
  }

  logger.info('[Migration] Encryption test passed ✓');
  console.log('');

  // Confirm before proceeding
  logger.warn('[Migration] This script will encrypt sensitive data in the database.');
  logger.warn('[Migration] Make sure you have backed up your database before proceeding.');
  logger.warn('[Migration] Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  console.log('');

  await new Promise(resolve => setTimeout(resolve, 5000));

  const stats: MigrationStats = {
    professionalsTotal: 0,
    professionalsEncrypted: 0,
    professionalsSkipped: 0,
    professionalsErrors: 0,
    patientsTotal: 0,
    patientsEncrypted: 0,
    patientsSkipped: 0,
    patientsErrors: 0
  };

  try {
    // Step 1: Migrate Google refresh tokens
    const professionalCount = await prisma.professional.count({
      where: { googleRefreshToken: { not: null } }
    });
    stats.professionalsTotal = professionalCount;

    if (professionalCount > 0) {
      const professionalResult = await migrateGoogleRefreshTokens();
      stats.professionalsEncrypted = professionalResult.encrypted;
      stats.professionalsSkipped = professionalResult.skipped;
      stats.professionalsErrors = professionalResult.errors;
    } else {
      logger.info('[Migration] No professionals with Google refresh tokens found');
    }

    console.log('');

    // Step 2: Migrate patient PII
    const patientCount = await prisma.patient.count();
    stats.patientsTotal = patientCount;

    if (patientCount > 0) {
      const patientResult = await migratePatientPII();
      stats.patientsEncrypted = patientResult.encrypted;
      stats.patientsSkipped = patientResult.skipped;
      stats.patientsErrors = patientResult.errors;
    } else {
      logger.info('[Migration] No patients found');
    }

    console.log('');

    // Step 3: Verify migration
    const verificationPassed = await verifyMigration();

    console.log('');
    console.log('========================================');
    console.log('MIGRATION SUMMARY');
    console.log('========================================');
    console.log('');
    console.log('Google Refresh Tokens:');
    console.log(`  Total:     ${stats.professionalsTotal}`);
    console.log(`  Encrypted: ${stats.professionalsEncrypted}`);
    console.log(`  Skipped:   ${stats.professionalsSkipped} (already encrypted)`);
    console.log(`  Errors:    ${stats.professionalsErrors}`);
    console.log('');
    console.log('Patient PII (Email + Phone):');
    console.log(`  Total:     ${stats.patientsTotal}`);
    console.log(`  Encrypted: ${stats.patientsEncrypted}`);
    console.log(`  Skipped:   ${stats.patientsSkipped} (already encrypted)`);
    console.log(`  Errors:    ${stats.patientsErrors}`);
    console.log('');
    console.log(`Verification: ${verificationPassed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('');

    if (stats.professionalsErrors > 0 || stats.patientsErrors > 0) {
      logger.error('[Migration] Migration completed with errors. Review logs above.');
      process.exit(1);
    }

    if (!verificationPassed) {
      logger.error('[Migration] Verification failed. Some data may not be encrypted.');
      process.exit(1);
    }

    logger.info('[Migration] ✓ Migration completed successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error('[Migration] CRITICAL ERROR:', error);
    process.exit(1);
  }
}

// Run migration
main();
