import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ProfessionalAppointment, AppointmentStatus } from '../../../types';

// Status display configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  PENDING_PAYMENT: { label: 'Pago pendiente', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  REMINDER_SENT: { label: 'Recordatorio enviado', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  CONFIRMED: { label: 'Confirmada', color: 'text-green-800', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-800', bgColor: 'bg-red-100' },
  COMPLETED: { label: 'Completada', color: 'text-gray-800', bgColor: 'bg-gray-100' },
  NO_SHOW: { label: 'No asistió', color: 'text-gray-800', bgColor: 'bg-gray-200' }
};

interface AppointmentDetailModalProps {
  appointment: ProfessionalAppointment;
  onClose: () => void;
}

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

const AppointmentDetailModal = ({ appointment, onClose }: AppointmentDetailModalProps) => {
  const getStatusDisplay = (status: AppointmentStatus) => {
    return STATUS_CONFIG[status] || { label: status, color: 'text-gray-800', bgColor: 'bg-gray-100' };
  };

  const statusInfo = getStatusDisplay(appointment.status);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalles de la cita</DialogTitle>
      <DialogContent>
        <dl className="space-y-3">
          <div className="flex justify-between fade-right-fast">
            <dt className="text-sm text-gray-500">Código</dt>
            <dd className="text-sm font-medium text-gray-900">{appointment.bookingReference}</dd>
          </div>
          <div className="flex justify-between fade-left-fast">
            <dt className="text-sm text-gray-500">Fecha</dt>
            <dd className="text-sm font-medium text-gray-900">{formatDate(appointment.date)}</dd>
          </div>
          <div className="flex justify-between fade-right-fast">
            <dt className="text-sm text-gray-500">Hora</dt>
            <dd className="text-sm font-medium text-gray-900">{appointment.startTime} - {appointment.endTime}</dd>
          </div>
          <div className="flex justify-between fade-left-fast">
            <dt className="text-sm text-gray-500">Estado</dt>
            <dd>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </dd>
          </div>

          <div className="border-t pt-3 fade-up-fast">
            <p className="text-sm font-medium text-gray-900">Paciente</p>
          </div>
          <div className="flex justify-between fade-right-fast">
            <dt className="text-sm text-gray-500">Nombre</dt>
            <dd className="text-sm font-medium text-gray-900">{appointment.patient.fullName}</dd>
          </div>
          <div className="flex justify-between fade-left-fast">
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="text-sm font-medium text-gray-900">{appointment.patient.email}</dd>
          </div>
          <div className="flex justify-between fade-right-fast">
            <dt className="text-sm text-gray-500">WhatsApp</dt>
            <dd className="text-sm font-medium text-gray-900">
              {appointment.patient.countryCode} {appointment.patient.whatsappNumber}
            </dd>
          </div>

          {appointment.deposit.required && (
            <>
              <div className="border-t pt-3 fade-up-normal">
                <p className="text-sm font-medium text-gray-900">Depósito</p>
              </div>
              <div className="flex justify-between fade-left-fast">
                <dt className="text-sm text-gray-500">Monto</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {appointment.deposit.amount
                    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(appointment.deposit.amount)
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between fade-right-fast">
                <dt className="text-sm text-gray-500">Estado</dt>
                <dd className={`text-sm font-medium ${appointment.deposit.paid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {appointment.deposit.paid ? 'Pagado' : 'Pendiente'}
                </dd>
              </div>
            </>
          )}

          {appointment.cancellation && (
            <>
              <div className="border-t pt-3 zoom-out-fast">
                <p className="text-sm font-medium text-red-600">Cancelación</p>
              </div>
              <div className="flex justify-between fade-left-fast">
                <dt className="text-sm text-gray-500">Cancelado por</dt>
                <dd className="text-sm font-medium text-gray-900">{appointment.cancellation.cancelledBy}</dd>
              </div>
              {appointment.cancellation.reason && (
                <div className="fade-right-fast">
                  <dt className="text-sm text-gray-500">Motivo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{appointment.cancellation.reason}</dd>
                </div>
              )}
            </>
          )}
        </dl>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<CloseIcon />}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentDetailModal;
