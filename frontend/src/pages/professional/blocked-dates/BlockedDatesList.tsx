import type { BlockedDate } from '../../../types';

// Format date for display (e.g., "Lunes, 15 de Enero 2024")
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface BlockedDatesListProps {
  blockedDates: BlockedDate[];
  onRemove: (id: string) => void;
}

const BlockedDatesList = ({ blockedDates, onRemove }: BlockedDatesListProps) => {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm fade-left-normal">
      <h2 className="mb-4 text-lg font-medium text-gray-900 fade-down-fast">
        Fechas Bloqueadas ({blockedDates.length})
      </h2>

      {blockedDates.length === 0 ? (
        <p className="text-sm text-gray-500 fade-up-fast">No hay fechas bloqueadas</p>
      ) : (
        <div className="space-y-3">
          {blockedDates.map((blockedDate, index) => (
            <div
              key={blockedDate.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 ${
                index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
              }`}
            >
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {formatDate(blockedDate.date)}
                </p>
                {blockedDate.reason && (
                  <p className="text-sm text-gray-500">{blockedDate.reason}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(blockedDate.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 zoom-out-fast"
              >
                Desbloquear
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedDatesList;
