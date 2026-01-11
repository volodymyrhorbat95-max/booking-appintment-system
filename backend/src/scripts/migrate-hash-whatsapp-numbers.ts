/**
 * DATA MIGRATION SCRIPT - Backfill WhatsApp Number Hashes
 *
 * This script creates SHA-256 hashes for existing patient WhatsApp numbers.
 * The hash is needed for fast lookups when processing incoming WhatsApp messages.
 *
 * CONTEXT:
 * - WhatsApp numbers are encrypted (AES-256-GCM) and cannot be searched with 'contains'
 * - We need a searchable hash to match incoming messages to patients
 * - This script decrypts existing numbers, creates hashes, and updates records
 *
 * IMPORTANT:
 * - Run this script ONCE after deploying the whatsappNumberHash column
 * - Requires ENCRYPTION_KEY environment variable to decrypt existing numbers
 *
 * Usage:
 *   npm run migrate:hash-phones
 *   or
 *   ts-node src/scripts/migrate-hash-whatsapp-numbers.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../config/database';
import { decrypt, hashForLookup } from '../utils/encryption';
import { logger } from '../utils/logger';

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function backfillWhatsAppHashes(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        whatsappNumber: true,
        whatsappNumberHash: true
      }
    });

    stats.total = patients.length;
    logger.info(`[Migration] Found ${patients.length} patients to process`);

    for (const patient of patients) {
      try {
        // Skip if already has hash (non-empty)
        if (patient.whatsappNumberHash && patient.whatsappNumberHash.length > 0) {
          logger.info(`[Migration] Patient ${patient.id} (${patient.firstName} ${patient.lastName}): Already has hash, skipping`);
          stats.skipped++;
          continue;
        }

        // Decrypt the WhatsApp number if it's encrypted, otherwise use as-is
        // Check if it's encrypted by looking for the "iv:authTag:ciphertext" format
        let decryptedNumber: string;
        const parts = patient.whatsappNumber.split(':');

        if (parts.length === 3 && /^[a-f0-9]+$/i.test(parts[0])) {
          // Looks encrypted - decrypt it
          decryptedNumber = decrypt(patient.whatsappNumber);
        } else {
          // Plaintext - use as-is
          decryptedNumber = patient.whatsappNumber;
        }

        // Create hash
        const hash = hashForLookup(decryptedNumber);

        // Update record
        await prisma.patient.update({
          where: { id: patient.id },
          data: { whatsappNumberHash: hash }
        });

        logger.info(`[Migration] Patient ${patient.id} (${patient.firstName} ${patient.lastName}): Hash created`);
        stats.updated++;
      } catch (error: any) {
        logger.error(`[Migration] Patient ${patient.id}: ERROR - ${error.message}`);
        stats.errors++;
      }
    }

    return stats;
  } catch (error: any) {
    logger.error('[Migration] CRITICAL ERROR:', error);
    throw error;
  }
}

async function verifyMigration(): Promise<boolean> {
  logger.info('[Migration] Verifying hash creation...');

  const patientsWithoutHash = await prisma.patient.count({
    where: {
      whatsappNumberHash: ''
    }
  });

  if (patientsWithoutHash > 0) {
    logger.error(`[Migration] VERIFICATION FAILED: ${patientsWithoutHash} patients still missing hash`);
    return false;
  }

  logger.info('[Migration] Verification passed - all patients have hashes');
  return true;
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('DATA MIGRATION: Backfill WhatsApp Hashes');
  console.log('========================================');
  console.log('');

  logger.info('[Migration] Starting WhatsApp number hash backfill...');

  const stats = await backfillWhatsAppHashes();

  console.log('');
  console.log('========================================');
  console.log('MIGRATION SUMMARY');
  console.log('========================================');
  console.log('');
  console.log(`Total patients:   ${stats.total}`);
  console.log(`Hashes created:   ${stats.updated}`);
  console.log(`Skipped:          ${stats.skipped} (already had hash)`);
  console.log(`Errors:           ${stats.errors}`);
  console.log('');

  if (stats.errors > 0) {
    logger.error('[Migration] Migration completed with errors. Review logs above.');
    process.exit(1);
  }

  // Verify
  const verificationPassed = await verifyMigration();

  if (!verificationPassed) {
    logger.error('[Migration] Verification failed. Some patients may be missing hashes.');
    process.exit(1);
  }

  logger.info('[Migration] ✓ Migration completed successfully');
  process.exit(0);
}

// Run migration
main();
