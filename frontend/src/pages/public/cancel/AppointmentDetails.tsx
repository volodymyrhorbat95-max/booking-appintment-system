import { Button } from '@mui/material';
import CancelConfirmModal from './CancelConfirmModal';

interface CancelBookingAppointment {
  bookingReference: string;
  status: string;
  date: string;
  time: string;
  professional: {
    fullName: string;
    slug: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  canCancel: boolean;
  deposit: {
    required: boolean;
    amount: number | null;
    paid: boolean;
  };
}

interface AppointmentDetailsProps {
  appointment: CancelBookingAppointment;
  error: string | null;
  reason: string;
  showConfirmDialog: boolean;
  onReasonChange: (reason: string) => void;
  onShowConfirmDialog: () => void;
  onCloseConfirmDialog: () => void;
  onConfirmCancel: () => void;
  onReschedule: () => void;
  onSearchAnother: () => void;
}

// Get status display
const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    PENDING_PAYMENT: { label: 'Pendiente de pago', color: 'bg-orange-100 text-orange-800' },
    REMINDER_SENT: { label: 'Recordatorio enviado', color: 'bg-blue-100 text-blue-800' },
    CONFIRMED: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    COMPLETED: { label: 'Completada', color: 'bg-gray-100 text-gray-800' },
    NO_SHOW: { label: 'No asistió', color: 'bg-gray-100 text-gray-800' }
  };

  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

const AppointmentDetails = ({
  appointment,
  error,
  reason,
  showConfirmDialog,
  onReasonChange,
  onShowConfirmDialog,
  onCloseConfirmDialog,
  onConfirmCancel,
  onReschedule,
  onSearchAnother
}: AppointmentDetailsProps) => {
  const statusInfo = getStatusDisplay(appointment.status);

  return (
    <div className="mx-auto max-w-lg zoom-in-normal">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 fade-down-fast">Detalles de tu reserva</h1>
        <p className="mt-2 text-gray-600 fade-up-fast">Código: <span className="font-mono">{appointment.bookingReference}</span></p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 zoom-in-fast">
          {error}
        </div>
      )}

      {/* Appointment details */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-up-normal">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 fade-left-fast">Estado</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color} zoom-in-fast`}>
            {statusInfo.label}
          </span>
        </div>

        <dl className="space-y-3">
          <div className="flex justify-between fade-right-fast">
            <dt className="text-sm text-gray-500">Profesional</dt>
            <dd className="text-sm font-medium text-gray-900">
              {appointment.professional.fullName}
            </dd>
          </div>
          <div className="flex justify-between fade-left-fast">
            <dt className="text-sm text-gray-500">Fecha</dt>
            <dd className="text-sm font-medium text-gray-900">{appointment.date}</dd>
          </div>
          <div className="flex justify-between fade-right-normal">
            <dt className="text-sm text-gray-500">Hora</dt>
            <dd className="text-sm font-medium text-gray-900">{appointment.time}</dd>
          </div>
          <div className="flex justify-between fade-left-normal">
            <dt className="text-sm text-gray-500">Paciente</dt>
            <dd className="text-sm font-medium text-gray-900">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </dd>
          </div>
        </dl>

        {/* Deposit info */}
        {appointment.deposit.required && (
          <div className="mt-4 border-t pt-4 fade-up-slow">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Depósito</span>
              <span
                className={`text-sm font-medium ${
                  appointment.deposit.paid ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {appointment.deposit.paid ? 'Pagado' : 'Pendiente'}
                {appointment.deposit.amount && (
                  <span className="ml-1">
                    (
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS'
                    }).format(appointment.deposit.amount)}
                    )
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cancel button */}
      {appointment.canCancel ? (
        <div className="space-y-4">
          <Button
            variant="contained"
            color="error"
            onClick={onShowConfirmDialog}
            fullWidth
            sx={{
              textTransform: 'none',
              minHeight: 48,
            }}
            className="fade-up-fast"
          >
            Cancelar esta cita
          </Button>

          <Button
            variant="outlined"
            onClick={onReschedule}
            fullWidth
            sx={{
              textTransform: 'none',
              minHeight: 48,
            }}
            className="fade-up-normal"
          >
            Reagendar cita
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-4 text-center fade-up-normal">
          <p className="text-sm text-gray-600">
            Esta cita no puede ser cancelada en su estado actual.
          </p>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirmDialog && (
        <CancelConfirmModal
          reason={reason}
          onReasonChange={onReasonChange}
          onConfirm={onConfirmCancel}
          onClose={onCloseConfirmDialog}
        />
      )}

      {/* Back link */}
      <div className="mt-6 text-center fade-up-slow">
        <Button
          onClick={onSearchAnother}
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
          }}
        >
          Buscar otra reserva
        </Button>
      </div>
    </div>
  );
};

export default AppointmentDetails;
