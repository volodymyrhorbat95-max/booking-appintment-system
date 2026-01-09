import type { AppointmentStatus } from '../../../types';

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

// Status indicator colors (circles)
const STATUS_INDICATOR: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  PENDING_PAYMENT: 'bg-orange-400',
  REMINDER_SENT: 'bg-yellow-400',
  CONFIRMED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  COMPLETED: 'bg-gray-400',
  NO_SHOW: 'bg-gray-500'
};

interface TodayAppointment {
  id: string;
  time: string;
  patientName: string;
  status: AppointmentStatus;
}

interface TodayAppointmentsProps {
  appointments: TodayAppointment[];
  onViewAllClick: () => void;
}

const TodayAppointments = ({ appointments, onViewAllClick }: TodayAppointmentsProps) => {
  const getStatusDisplay = (status: AppointmentStatus) => {
    return STATUS_CONFIG[status] || { label: status, color: 'text-gray-800', bgColor: 'bg-gray-100' };
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm zoom-in-normal">
      <h2 className="text-lg font-semibold text-gray-900 fade-right-fast">Citas de hoy</h2>

      {appointments.length === 0 ? (
        <p className="mt-4 text-center text-gray-500 fade-up-fast">No tienes citas programadas para hoy</p>
      ) : (
        <div className="mt-4 space-y-3">
          {appointments.map((apt, index) => {
            const statusInfo = getStatusDisplay(apt.status);
            return (
              <div
                key={apt.id}
                className={`flex items-center justify-between rounded-lg border border-gray-100 p-3 ${
                  index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className={`h-3 w-3 rounded-full ${STATUS_INDICATOR[apt.status]}`} />

                  {/* Time and patient */}
                  <div>
                    <p className="font-medium text-gray-900">{apt.time}</p>
                    <p className="text-sm text-gray-600">{apt.patientName}</p>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* View all button */}
      <div className="mt-4 text-center fade-up-normal">
        <button
          type="button"
          onClick={onViewAllClick}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Ver todas las citas
        </button>
      </div>
    </div>
  );
};

export default TodayAppointments;
