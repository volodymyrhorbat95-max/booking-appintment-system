// ============================================
// Type definitions matching Prisma schema exactly
// Used across: Backend → API Response → Redux → Components
// ============================================

// ============================================
// ENUMS (as const objects for erasableSyntaxOnly compatibility)
// ============================================

export const UserRole = {
  ADMIN: 'ADMIN',
  PROFESSIONAL: 'PROFESSIONAL'
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const AppointmentStatus = {
  PENDING: 'PENDING',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  REMINDER_SENT: 'REMINDER_SENT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW'
} as const;
export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const BillingPeriod = {
  MONTHLY: 'MONTHLY',
  ANNUAL: 'ANNUAL'
} as const;
export type BillingPeriod = typeof BillingPeriod[keyof typeof BillingPeriod];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  PAST_DUE: 'PAST_DUE'
} as const;
export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export const PaymentType = {
  SUBSCRIPTION: 'SUBSCRIPTION',
  DEPOSIT: 'DEPOSIT'
} as const;
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const MessageTemplateType = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  REMINDER: 'REMINDER',
  CANCELLATION: 'CANCELLATION'
} as const;
export type MessageTemplateType = typeof MessageTemplateType[keyof typeof MessageTemplateType];

export const FieldType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  DROPDOWN: 'DROPDOWN'
} as const;
export type FieldType = typeof FieldType[keyof typeof FieldType];

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

// ============================================
// PUBLIC BOOKING PAGE TYPES
// ============================================

export interface BookingFormField {
  id: string;
  fieldName: string;
  fieldType: FieldType;
  isRequired: boolean;
  displayOrder: number;
  options: string[];
  isFixed: boolean;
}

export interface BookingAvailabilitySlot {
  dayOfWeek: number;
  slotNumber: number;
  startTime: string;
  endTime: string;
}

export interface BookingPageData {
  professional: {
    firstName: string;
    lastName: string;
    fullName: string;
    slug: string;
    timezone: string;
  };
  availability: {
    appointmentDuration: number;
    slots: BookingAvailabilitySlot[];
  };
  blockedDates: string[];
  deposit: {
    enabled: boolean;
    amount: number | null;
  };
  formFields: BookingFormField[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlotsData {
  date: string;
  isBlocked: boolean;
  appointmentDuration?: number;
  slots: TimeSlot[];
}

// ============================================
// PROFESSIONAL CALENDAR/APPOINTMENTS TYPES
// ============================================

export interface ProfessionalAppointment {
  id: string;
  bookingReference: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    whatsappNumber: string;
    countryCode: string;
  };
  deposit: {
    required: boolean;
    amount: number | null;
    paid: boolean;
    paidAt: string | null;
  };
  cancellation: {
    cancelledAt: string;
    reason: string | null;
    cancelledBy: string;
  } | null;
  createdAt: string;
}

export interface ProfessionalAppointmentDetail extends ProfessionalAppointment {
  customFields: {
    fieldId: string;
    fieldName: string;
    fieldType: FieldType;
    value: string;
  }[];
  googleEventId: string | null;
}

export interface AppointmentsSummary {
  today: number;
  thisWeek: number;
  pending: number;
  confirmed: number;
}

export interface TodayAppointment {
  id: string;
  bookingReference: string;
  time: string;
  patientName: string;
  status: AppointmentStatus;
}

export interface AppointmentsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AppointmentsListResponse {
  appointments: ProfessionalAppointment[];
  pagination: AppointmentsPagination;
}

export interface AppointmentsSummaryResponse {
  summary: AppointmentsSummary;
  todayAppointments: TodayAppointment[];
}

// ============================================
// GOOGLE CALENDAR TYPES
// ============================================

export interface GoogleCalendarStatus {
  connected: boolean;
  calendarId: string | null;
  error?: string;
}

export interface ExternalCalendarEventResponse {
  id: string;
  googleEventId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export interface SyncResult {
  syncedEvents: number;
  message: string;
}

// ============================================
// WHATSAPP REMINDER/TEMPLATE TYPES
// ============================================

export interface ReminderSettingInput {
  reminderNumber: number;
  hoursBefore: number;
  enableNightBefore: boolean;
  isActive: boolean;
}

export interface ReminderSettingsResponse {
  reminders: ReminderSettingInput[];
}

export interface MessageTemplateVariable {
  key: string;
  description: string;
}

export interface MessageTemplateData {
  type: MessageTemplateType;
  messageText: string;
  isCustom: boolean;
  isActive: boolean;
}

export interface MessageTemplatesResponse {
  templates: MessageTemplateData[];
  availableVariables: MessageTemplateVariable[];
}

// ============================================
// ADMIN TYPES
// ============================================

export interface AdminDashboardStats {
  professionals: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  appointments: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  subscriptions: {
    active: number;
  };
}

export interface AdminProfessional {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  slug: string;
  isActive: boolean;
  isSuspended: boolean;
  appointmentsCount: number;
  subscription: {
    planName: string;
    status: SubscriptionStatus;
    billingPeriod: BillingPeriod;
  } | null;
  createdAt: string;
}

export interface AdminProfessionalDetail extends AdminProfessional {
  phone: string | null;
  timezone: string;
  googleCalendarConnected: boolean;
  depositEnabled: boolean;
  depositAmount: number | null;
  counts: {
    appointments: number;
    patients: number;
  };
  appointmentStats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

export interface AdminProfessionalsResponse {
  professionals: AdminProfessional[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminPlan {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  subscribersCount: number;
  createdAt: string;
}

export interface AdminPlatformSettings {
  defaultTimezone: string;
  defaultCountryCode: string;
  platformName: string;
  supportEmail: string;
}

export interface AdminStatistics {
  period: {
    start: string;
    end: string;
  };
  appointments: {
    byStatus: Record<string, number>;
  };
  professionals: {
    newInPeriod: number;
  };
  revenue: {
    estimatedMonthly: number;
  };
}

// ============================================
// PROFESSIONAL SUBSCRIPTION TYPES
// ============================================

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  displayOrder: number;
}

export interface CurrentSubscription {
  id: string;
  plan: {
    id: string;
    name: string;
    description: string | null;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
  };
  billingPeriod: BillingPeriod;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string | null;
  recentPayments: {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paidAt: string | null;
    createdAt: string;
  }[];
}

export interface SubscriptionPreference {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

// ============================================
// PROFESSIONAL STATISTICS TYPES
// ============================================

export interface ProfessionalStatistics {
  period: {
    start: string;
    end: string;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  rates: {
    confirmationRate: number;
    cancellationRate: number;
    noShowRate: number;
    completionRate: number;
  };
  byMonth: {
    month: string;
    total: number;
    completed: number;
    cancelled: number;
  }[];
}
