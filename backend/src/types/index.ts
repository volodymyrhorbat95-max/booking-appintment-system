// ============================================
// Type definitions matching Prisma schema exactly
// Used across: Backend → API Response → Redux → Components
// ============================================

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  REMINDER_SENT = 'REMINDER_SENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE'
}

export enum PaymentType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  DEPOSIT = 'DEPOSIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum MessageTemplateType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  REMINDER = 'REMINDER',
  CANCELLATION = 'CANCELLATION'
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  DROPDOWN = 'DROPDOWN'
}

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  email: string;
  password?: string | null;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  professional?: Professional | null;
}

// ============================================
// PROFESSIONAL
// ============================================

export interface Professional {
  id: string;
  userId: string;
  user?: User;
  firstName: string;
  lastName: string;
  slug: string;
  phone?: string | null;
  timezone: string;
  googleCalendarConnected: boolean;
  googleRefreshToken?: string | null;
  googleCalendarId?: string | null;
  subscriptionId?: string | null;
  subscription?: Subscription | null;
  depositEnabled: boolean;
  depositAmount?: number | null;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
  availabilities?: Availability[];
  blockedDates?: BlockedDate[];
  appointments?: Appointment[];
  reminderSettings?: ReminderSetting[];
  messageTemplates?: MessageTemplate[];
  customFormFields?: CustomFormField[];
  patients?: Patient[];
}

// ============================================
// PATIENT
// ============================================

export interface Patient {
  id: string;
  professionalId: string;
  professional?: Professional;
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
  appointments?: Appointment[];
}

// ============================================
// APPOINTMENT
// ============================================

export interface Appointment {
  id: string;
  professionalId: string;
  professional?: Professional;
  patientId: string;
  patient?: Patient;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  bookingReference: string;
  googleEventId?: string | null;
  depositRequired: boolean;
  depositAmount?: number | null;
  depositPaid: boolean;
  depositPaidAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customFieldValues?: AppointmentCustomFieldValue[];
  scheduledReminders?: ScheduledReminder[];
}

// ============================================
// AVAILABILITY
// ============================================

export interface Availability {
  id: string;
  professionalId: string;
  professional?: Professional;
  dayOfWeek: number;
  slotNumber: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionalSettings {
  id: string;
  professionalId: string;
  appointmentDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BLOCKED DATE
// ============================================

export interface BlockedDate {
  id: string;
  professionalId: string;
  professional?: Professional;
  date: Date;
  reason?: string | null;
  createdAt: Date;
}

// ============================================
// SUBSCRIPTION PLAN
// ============================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  subscriptions?: Subscription[];
}

// ============================================
// SUBSCRIPTION
// ============================================

export interface Subscription {
  id: string;
  professionalId: string;
  professional?: Professional;
  planId: string;
  plan?: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date | null;
  nextBillingDate?: Date | null;
  mercadoPagoSubscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  payments?: Payment[];
}

// ============================================
// PAYMENT
// ============================================

export interface Payment {
  id: string;
  subscriptionId?: string | null;
  subscription?: Subscription | null;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  mercadoPagoPaymentId?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// REMINDER SETTING
// ============================================

export interface ReminderSetting {
  id: string;
  professionalId: string;
  professional?: Professional;
  reminderNumber: number;
  hoursBefore: number;
  enableNightBefore: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReminder {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  scheduledFor: Date;
  sentAt?: Date | null;
  status: string;
  createdAt: Date;
}

// ============================================
// MESSAGE TEMPLATE
// ============================================

export interface MessageTemplate {
  id: string;
  professionalId: string;
  professional?: Professional;
  type: MessageTemplateType;
  messageText: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CUSTOM FORM FIELD
// ============================================

export interface CustomFormField {
  id: string;
  professionalId: string;
  professional?: Professional;
  fieldName: string;
  fieldType: FieldType;
  isRequired: boolean;
  displayOrder: number;
  options: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  values?: AppointmentCustomFieldValue[];
}

export interface AppointmentCustomFieldValue {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  customFieldId: string;
  customField?: CustomFormField;
  value: string;
}

// ============================================
// PLATFORM SETTING
// ============================================

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// EXTERNAL CALENDAR EVENT
// ============================================

export interface ExternalCalendarEvent {
  id: string;
  professionalId: string;
  googleEventId: string;
  title?: string | null;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface GoogleAuthResponse {
  user: Omit<User, 'password'>;
  professional: Professional;
  token: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
