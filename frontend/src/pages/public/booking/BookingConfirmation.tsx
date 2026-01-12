import { useEffect } from 'react';
import { Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  createDepositPayment,
  clearDepositPaymentError,
  clearDepositPaymentPreference
} from '../../../store/slices/publicBookingSlice';

interface BookingConfirmationProps {
  bookingReference: string;
  professionalName: string;
  date: string;
  time: string;
  patientName: string;
  patientEmail: string;
  depositRequired: boolean;
  depositAmount?: number;
  status: string;
  onNewBooking: () => void;
}

const BookingConfirmation = ({
  bookingReference,
  professionalName,
  date,
  time,
  patientName,
  patientEmail,
  depositRequired,
  depositAmount,
  status,
  onNewBooking
}: BookingConfirmationProps) => {
  const dispatch = useAppDispatch();
  const { depositPaymentPreference, depositPaymentError } = useAppSelector(
    (state) => state.publicBooking
  );

  const isPendingPayment = status === 'PENDING_PAYMENT';

  // Handle redirect to Mercado Pago when preference is created
  useEffect(() => {
    if (depositPaymentPreference?.initPoint) {
      // Redirect to Mercado Pago payment page
      window.location.href = depositPaymentPreference.initPoint;
    }
  }, [depositPaymentPreference]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearDepositPaymentError());
      dispatch(clearDepositPaymentPreference());
    };
  }, [dispatch]);

  // Handle pay deposit button click
  const handlePayDeposit = async () => {
    await dispatch(
      createDepositPayment({
        bookingReference,
        email: patientEmail
      })
    );
  };

  return (
    <div className="container-narrow safe-area-bottom">
      {/* Success header */}
      <div className="mb-4 sm:mb-6 text-center fade-down-normal">
        <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100 zoom-in-fast">
          <CheckIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'rgb(22, 163, 74)' }} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fade-up-fast">
          {isPendingPayment ? 'Reserva pendiente de pago' : 'Reserva confirmada'}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 fade-up-normal">
          {isPendingPayment
            ? 'Tu reserva está pendiente de pago para ser confirmada'
            : 'Tu cita ha sido reservada exitosamente'}
        </p>
      </div>

      {/* Booking reference */}
      <div className="mb-4 sm:mb-6 rounded-lg bg-blue-50 p-3 sm:p-4 text-center zoom-in-normal">
        <p className="text-xs sm:text-sm text-blue-700 fade-down-fast">Código de reserva</p>
        <p className="mt-1 text-xl sm:text-2xl font-bold tracking-wider text-blue-900 flip-up-fast">
          {bookingReference}
        </p>
        <p className="mt-2 text-xs text-blue-600 fade-up-fast">
          Guarda este código para consultar o cancelar tu cita
        </p>
      </div>

      {/* Appointment details */}
      <div className="mb-4 sm:mb-6 rounded-lg bg-white p-3 sm:p-4 shadow-sm fade-right-normal">
        <h3 className="mb-3 text-sm sm:text-base font-semibold text-gray-900 fade-left-fast">Detalles de tu cita</h3>
        <dl className="space-y-2 sm:space-y-3">
          <div className="flex justify-between gap-2 fade-right-fast">
            <dt className="text-xs sm:text-sm text-gray-500">Profesional</dt>
            <dd className="text-xs sm:text-sm font-medium text-gray-900 text-right">{professionalName}</dd>
          </div>
          <div className="flex justify-between gap-2 fade-left-fast">
            <dt className="text-xs sm:text-sm text-gray-500">Fecha</dt>
            <dd className="text-xs sm:text-sm font-medium text-gray-900">{date}</dd>
          </div>
          <div className="flex justify-between gap-2 fade-right-fast">
            <dt className="text-xs sm:text-sm text-gray-500">Hora</dt>
            <dd className="text-xs sm:text-sm font-medium text-gray-900">{time}</dd>
          </div>
          <div className="flex justify-between gap-2 fade-left-fast">
            <dt className="text-xs sm:text-sm text-gray-500">Paciente</dt>
            <dd className="text-xs sm:text-sm font-medium text-gray-900 text-right truncate max-w-[60%]">{patientName}</dd>
          </div>
        </dl>
      </div>

      {/* Deposit payment (if required) */}
      {isPendingPayment && depositRequired && depositAmount && (
        <div className="mb-4 sm:mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4 zoom-out-normal">
          <h3 className="mb-2 text-sm sm:text-base font-semibold text-yellow-900 fade-down-fast">
            Pago de depósito requerido
          </h3>
          <p className="mb-3 text-xs sm:text-sm text-yellow-700 fade-up-fast">
            Para confirmar tu reserva, debes pagar un depósito de{' '}
            <strong>
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS'
              }).format(depositAmount)}
            </strong>
          </p>
          {depositPaymentError && (
            <div className="mb-3 rounded-md bg-red-100 p-2 text-xs sm:text-sm text-red-700">
              {depositPaymentError}
            </div>
          )}
          <Button
            variant="contained"
            onClick={handlePayDeposit}
            fullWidth
            sx={{
              textTransform: 'none',
              minHeight: { xs: 48, sm: 40 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              bgcolor: 'warning.main',
              '&:hover': {
                bgcolor: 'warning.dark',
              },
            }}
            className="flip-up-normal"
          >
            Pagar depósito con Mercado Pago
          </Button>
          <p className="mt-2 text-xs text-yellow-600 text-center">
            Serás redirigido a Mercado Pago para completar el pago
          </p>
        </div>
      )}

      {/* Confirmation message */}
      <div className="mb-4 sm:mb-6 rounded-lg bg-gray-50 p-3 sm:p-4 fade-left-normal">
        <h3 className="mb-2 text-sm sm:text-base font-semibold text-gray-900 fade-right-fast">¿Qué sigue?</h3>
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
          <li className="flex items-start gap-2 fade-up-fast">
            <span className="text-green-500 mt-0.5 font-medium">1.</span>
            <span>
              Recibirás una confirmación por WhatsApp y email a <span className="font-medium break-all">{patientEmail}</span>
            </span>
          </li>
          <li className="flex items-start gap-2 fade-up-normal">
            <span className="text-green-500 mt-0.5 font-medium">2.</span>
            <span>Te enviaremos recordatorios antes de tu cita</span>
          </li>
          <li className="flex items-start gap-2 fade-up-slow">
            <span className="text-green-500 mt-0.5 font-medium">3.</span>
            <span>
              Si necesitas cancelar, puedes hacerlo desde el enlace en tu confirmación
            </span>
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="space-y-3 zoom-in-slow">
        <Button
          variant="contained"
          onClick={onNewBooking}
          fullWidth
          sx={{
            textTransform: 'none',
            minHeight: { xs: 56, sm: 48 },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Hacer otra reserva
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
