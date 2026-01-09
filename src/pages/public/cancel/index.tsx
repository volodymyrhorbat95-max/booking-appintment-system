import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getAppointmentByReference,
  cancelAppointment,
  clearCancelBookingState
} from '../../../store/slices/cancelBookingSlice';
import CancelledConfirmation from './CancelledConfirmation';
import AppointmentDetails from './AppointmentDetails';
import LookupForm from './LookupForm';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const CancelBookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Form state for lookup
  const [reference, setReference] = useState(searchParams.get('ref') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [lookupError, setLookupError] = useState('');

  // Cancellation reason
  const [reason, setReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { appointment, cancelled, error, notFound } = useAppSelector(
    (state) => state.cancelBooking
  );

  // Auto-search if params are provided
  useEffect(() => {
    const ref = searchParams.get('ref');
    const emailParam = searchParams.get('email');

    if (ref && emailParam) {
      dispatch(getAppointmentByReference({ reference: ref, email: emailParam }));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCancelBookingState());
    };
  }, [dispatch, searchParams]);

  // Handle lookup form submit
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');

    if (!reference.trim()) {
      setLookupError('Ingresa el código de reserva');
      return;
    }

    if (!email.trim()) {
      setLookupError('Ingresa tu email');
      return;
    }

    dispatch(getAppointmentByReference({ reference: reference.trim(), email: email.trim() }));
  };

  // Handle cancellation
  const handleCancel = async () => {
    if (!appointment) return;

    await dispatch(
      cancelAppointment({
        reference: appointment.bookingReference,
        email: appointment.patient.email,
        reason: reason || undefined
      })
    );

    setShowConfirmDialog(false);
  };

  // Handle go home
  const handleGoHome = () => {
    navigate('/');
  };

  // Handle reschedule
  const handleReschedule = () => {
    if (appointment) {
      navigate(`/booking/${appointment.professional.slug}`);
    }
  };

  // Handle search another
  const handleSearchAnother = () => {
    dispatch(clearCancelBookingState());
  };

  // Cancelled confirmation view
  if (cancelled) {
    return <CancelledConfirmation onGoHome={handleGoHome} />;
  }

  // Appointment details view
  if (appointment) {
    return (
      <AppointmentDetails
        appointment={appointment}
        error={error}
        reason={reason}
        showConfirmDialog={showConfirmDialog}
        onReasonChange={setReason}
        onShowConfirmDialog={() => setShowConfirmDialog(true)}
        onCloseConfirmDialog={() => setShowConfirmDialog(false)}
        onConfirmCancel={handleCancel}
        onReschedule={handleReschedule}
        onSearchAnother={handleSearchAnother}
      />
    );
  }

  // Lookup form view
  return (
    <LookupForm
      reference={reference}
      email={email}
      lookupError={lookupError}
      error={error}
      notFound={notFound}
      onReferenceChange={setReference}
      onEmailChange={setEmail}
      onSubmit={handleLookup}
      onGoHome={handleGoHome}
    />
  );
};

export default CancelBookingPage;
