import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getBookingPageData,
  getAvailableSlots,
  createAppointment,
  setSelectedDate,
  setSelectedTime,
  clearBookingState,
  resetBookingForm,
  holdSlot,
  releaseHold,
  refreshAvailableSlots,
  clearHoldError
} from '../../../store/slices/publicBookingSlice';
import DatePicker from './DatePicker';
import TimeSlots from './TimeSlots';
import BookingForm from './BookingForm';
import BookingConfirmation from './BookingConfirmation';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const BookingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    pageData,
    selectedDate,
    selectedTime,
    availableSlots,
    bookingConfirmation,
    bookingError,
    error,
    notFound,
    sessionId,
    holdError
  } = useAppSelector((state) => state.publicBooking);

  // Ref to track previous time selection for releasing holds
  const previousTimeRef = useRef<string | null>(null);
  // Ref for polling interval
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load booking page data on mount
  useEffect(() => {
    if (slug) {
      dispatch(getBookingPageData(slug));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearBookingState());
    };
  }, [dispatch, slug]);

  // Load available slots when date is selected
  useEffect(() => {
    if (slug && selectedDate) {
      dispatch(getAvailableSlots({ slug, date: selectedDate }));
    }
  }, [dispatch, slug, selectedDate]);

  // ============================================
  // POLLING FOR REAL-TIME AVAILABILITY (Requirement 10.2)
  // "Available time slots must update immediately when changes happen"
  // ============================================
  useEffect(() => {
    // Start polling when date is selected and slots are loaded
    if (slug && selectedDate && availableSlots && !bookingConfirmation) {
      // Poll every 10 seconds for availability updates
      pollingIntervalRef.current = setInterval(() => {
        dispatch(refreshAvailableSlots({ slug, date: selectedDate }));
      }, 10000);
    }

    // Cleanup on unmount or when date changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [dispatch, slug, selectedDate, availableSlots, bookingConfirmation]);

  // ============================================
  // SLOT HOLD MANAGEMENT (Requirement 10.1)
  // "When someone starts booking, that slot should be temporarily held"
  // ============================================

  // Release previous hold when time selection changes
  const handleReleaseHold = useCallback((time: string) => {
    if (slug && selectedDate) {
      dispatch(releaseHold({ slug, date: selectedDate, time }));
    }
  }, [dispatch, slug, selectedDate]);

  // Hold the new slot when time is selected
  const handleHoldSlot = useCallback((time: string) => {
    if (slug && selectedDate) {
      dispatch(holdSlot({ slug, date: selectedDate, time }));
    }
  }, [dispatch, slug, selectedDate]);

  // Clear hold error after showing
  useEffect(() => {
    if (holdError) {
      const timer = setTimeout(() => {
        dispatch(clearHoldError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [holdError, dispatch]);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    // Release any existing hold when changing date
    if (selectedTime && selectedDate) {
      handleReleaseHold(selectedTime);
    }
    previousTimeRef.current = null;
    dispatch(setSelectedDate(date));
  };

  // Handle time selection with slot hold (Requirement 10.1)
  const handleTimeSelect = (time: string) => {
    // Release previous hold if exists
    if (previousTimeRef.current && previousTimeRef.current !== time) {
      handleReleaseHold(previousTimeRef.current);
    }

    // Update selection
    dispatch(setSelectedTime(time));
    previousTimeRef.current = time;

    // Create hold for new selection
    handleHoldSlot(time);
  };

  // Handle form submit
  const handleFormSubmit = async (formData: Record<string, string>) => {
    if (!slug || !selectedDate || !selectedTime) return;

    // Extract fixed fields and custom fields
    const { countryCode, ...restFormData } = formData;

    // Filter out fixed fields from custom fields (only send actual custom fields)
    const actualCustomFields = Object.fromEntries(
      Object.entries(restFormData).filter(([key]) => !key.startsWith('fixed-'))
    );

    await dispatch(
      createAppointment({
        slug,
        firstName: restFormData['fixed-firstName'] || '',
        lastName: restFormData['fixed-lastName'] || '',
        email: restFormData['fixed-email'] || '',
        whatsappNumber: restFormData['fixed-whatsappNumber'] || '',
        countryCode: countryCode || '+54',
        date: selectedDate,
        time: selectedTime,
        sessionId, // Include sessionId for slot hold validation (Requirement 10.1)
        customFieldValues: actualCustomFields
      })
    );
  };

  // Handle new booking after confirmation
  const handleNewBooking = () => {
    dispatch(resetBookingForm());
  };

  // Not found state
  if (notFound) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <div className="text-center zoom-in-normal">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fade-down-fast">Página no encontrada</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 fade-up-normal">
            El profesional que buscas no existe o no está disponible.
          </p>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            className="mt-4 zoom-in-slow"
            sx={{ textTransform: 'none', minHeight: { xs: 48, sm: 40 } }}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !notFound) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <div className="text-center zoom-in-normal">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 fade-down-fast">Error</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 fade-up-normal">{error}</p>
          <Button
            variant="contained"
            onClick={() => slug && dispatch(getBookingPageData(slug))}
            className="mt-4 zoom-in-slow"
            sx={{ textTransform: 'none', minHeight: { xs: 48, sm: 40 } }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Loading state (handled by GlobalLoadingSpinner)
  if (!pageData) {
    return null;
  }

  // Show confirmation if booking was successful
  if (bookingConfirmation) {
    return (
      <BookingConfirmation
        bookingReference={bookingConfirmation.bookingReference}
        professionalName={bookingConfirmation.professional.fullName}
        date={bookingConfirmation.appointment.date}
        time={bookingConfirmation.appointment.time}
        patientName={`${bookingConfirmation.patient.firstName} ${bookingConfirmation.patient.lastName}`}
        patientEmail={bookingConfirmation.patient.email}
        depositRequired={bookingConfirmation.deposit.required}
        depositAmount={bookingConfirmation.deposit.amount}
        status={bookingConfirmation.appointment.status}
        onNewBooking={handleNewBooking}
      />
    );
  }

  return (
    <div className="container-narrow safe-area-top safe-area-bottom">
      {/* Professional header */}
      <div className="mb-4 sm:mb-6 text-center fade-down-normal">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 zoom-in-fast">
          Reservar cita con {pageData.professional.fullName}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 fade-up-normal">
          Selecciona una fecha y horario disponible para agendar tu cita
        </p>
      </div>

      {/* Booking error */}
      {bookingError && (
        <div className="mb-4 sm:mb-6 rounded-lg bg-red-50 p-3 sm:p-4 text-center zoom-in-fast">
          <p className="text-sm sm:text-base text-red-700">{bookingError}</p>
        </div>
      )}

      {/* Hold error (Requirement 10.1) */}
      {holdError && (
        <div className="mb-4 sm:mb-6 rounded-lg bg-yellow-50 p-3 sm:p-4 text-center zoom-in-fast">
          <p className="text-sm sm:text-base text-yellow-700">{holdError}</p>
        </div>
      )}

      {/* Booking flow */}
      <div className="space-y-4 sm:space-y-6">
        {/* Step 1: Date selection */}
        <div className="fade-right-normal">
          <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900 fade-left-fast">
            1. Selecciona una fecha
          </h2>
          <DatePicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availabilitySlots={pageData.availability.slots}
            blockedDates={pageData.blockedDates}
            timezone={pageData.professional.timezone}
          />
        </div>

        {/* Step 2: Time selection (shown only when date is selected) */}
        {selectedDate && (
          <div className="fade-up-normal">
            <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900 fade-right-fast">
              2. Selecciona un horario
            </h2>
            {availableSlots ? (
              <TimeSlots
                slots={availableSlots.slots}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                isBlocked={availableSlots.isBlocked}
                appointmentDuration={availableSlots.appointmentDuration}
              />
            ) : (
              <div className="rounded-lg bg-white p-4 shadow-sm zoom-in-fast">
                <p className="text-center text-sm sm:text-base text-gray-500">Cargando horarios...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Booking form (shown only when date and time are selected) */}
        {selectedDate && selectedTime && (
          <div className="fade-left-normal">
            <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900 fade-up-fast">
              3. Completa tus datos
            </h2>
            <BookingForm
              formFields={pageData.formFields}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              professionalName={pageData.professional.fullName}
              depositEnabled={pageData.deposit.enabled}
              depositAmount={pageData.deposit.amount}
              onSubmit={handleFormSubmit}
            />
          </div>
        )}
      </div>

      {/* Timezone notice */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 fade-up-slow">
        <p>
          Los horarios se muestran en zona horaria: {pageData.professional.timezone}
        </p>
      </div>
    </div>
  );
};

export default BookingPage;
