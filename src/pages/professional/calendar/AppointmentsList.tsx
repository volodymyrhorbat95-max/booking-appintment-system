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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AppointmentsListProps {
  appointments: ProfessionalAppointment[];
  pagination: PaginationInfo | null;
  onViewDetails: (appointment: ProfessionalAppointment) => void;
  onCancelClick: (appointment: ProfessionalAppointment) => void;
  onStatusUpdate: (appointmentId: string, status: 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW') => void;
  onPageChange: (page: number) => void;
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

const AppointmentsList = ({
  appointments,
  pagination,
  onViewDetails,
  onCancelClick,
  onStatusUpdate,
  onPageChange
}: AppointmentsListProps) => {
  const getStatusDisplay = (status: AppointmentStatus) => {
    return STATUS_CONFIG[status] || { label: status, color: 'text-gray-800', bgColor: 'bg-gray-100' };
  };

  return (
    <div className="space-y-4">
      {/* Results info */}
      {pagination && (
        <p className="text-sm text-gray-500 fade-up-fast">
          Mostrando {appointments.length} de {pagination.total} citas
        </p>
      )}

      {/* Appointments list */}
      {appointments.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm zoom-in-fast">
          <p className="text-gray-500">No se encontraron citas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, index) => {
            const statusInfo = getStatusDisplay(apt.status);
            const canCancel = !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(apt.status);
            const canMarkComplete = apt.status === 'CONFIRMED';
            const canConfirm = ['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT'].includes(apt.status);

            return (
              <div
                key={apt.id}
                className={`rounded-lg bg-white p-4 shadow-sm ${
                  index % 3 === 0 ? 'fade-right-fast' : index % 3 === 1 ? 'fade-left-fast' : 'zoom-in-fast'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Appointment info */}
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <div className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${STATUS_INDICATOR[apt.status]}`} />

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {formatDate(apt.date)} - {apt.startTime}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {apt.patient.fullName} • {apt.patient.whatsappNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        Código: {apt.bookingReference}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onViewDetails(apt)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Ver detalles
                    </button>

                    {canConfirm && (
                      <button
                        type="button"
                        onClick={() => onStatusUpdate(apt.id, 'CONFIRMED')}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
                      >
                        Confirmar
                      </button>
                    )}

                    {canMarkComplete && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusUpdate(apt.id, 'COMPLETED')}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Completada
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusUpdate(apt.id, 'NO_SHOW')}
                          className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-500"
                        >
                          No asistió
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => onCancelClick(apt)}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 fade-up-normal">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`rounded-lg px-3 py-1 text-sm ${
                page === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
