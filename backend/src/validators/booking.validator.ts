// ============================================
// BOOKING INPUT VALIDATION
// Section 13.2: Data Protection - Input validation and sanitization
// ============================================

import { z } from 'zod';

// Phone number regex (international format)
const phoneRegex = /^\d{6,15}$/;

// Date format regex (YYYY-MM-DD)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Time format regex (HH:MM)
const timeRegex = /^\d{2}:\d{2}$/;

/**
 * Booking form validation schema
 * Validates patient information for appointment booking
 */
export const createBookingSchema = z.object({
  // Required patient fields (cannot be removed by professional)
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .transform(val => val.trim()),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .transform(val => val.trim()),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(val => val.toLowerCase().trim()),
  whatsappNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format (digits only, 6-15 characters)')
    .transform(val => val.replace(/\D/g, '')), // Remove non-digits
  countryCode: z
    .string()
    .regex(/^\+\d{1,4}$/, 'Invalid country code format')
    .default('+54'),

  // Appointment details
  date: z
    .string()
    .regex(dateRegex, 'Invalid date format (use YYYY-MM-DD)')
    .refine(val => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Date must be today or in the future'),
  time: z
    .string()
    .regex(timeRegex, 'Invalid time format (use HH:MM)'),

  // Optional session ID for slot hold validation
  sessionId: z
    .string()
    .max(100, 'Session ID too long')
    .optional(),

  // Optional custom fields (validated dynamically as object, not array)
  customFieldValues: z
    .record(z.string(), z.string())
    .optional()
});

/**
 * Cancel booking validation
 */
export const cancelBookingSchema = z.object({
  cancellationReason: z
    .string()
    .max(500, 'Reason too long')
    .optional()
});

/**
 * Slot hold validation
 * Used for both holding and releasing time slots (Requirement 10.1)
 */
export const holdSlotSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, 'Invalid date format (use YYYY-MM-DD)'),
  time: z
    .string()
    .regex(timeRegex, 'Invalid time format (use HH:MM)'),
  sessionId: z
    .string()
    .max(100, 'Session ID too long')
    .optional()
});

/**
 * Get available slots validation
 */
export const getAvailableSlotsSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, 'Invalid date format (use YYYY-MM-DD)')
});

// Export types for use in controllers
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type HoldSlotInput = z.infer<typeof holdSlotSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;
