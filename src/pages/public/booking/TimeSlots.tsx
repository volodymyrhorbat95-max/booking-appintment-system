import type { TimeSlot } from '../../../types';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isBlocked: boolean;
  appointmentDuration?: number;
}

const TimeSlots = ({
  slots,
  selectedTime,
  onTimeSelect,
  isBlocked,
  appointmentDuration = 30
}: TimeSlotsProps) => {
  if (isBlocked) {
    return (
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm zoom-in-normal">
        <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900 fade-down-fast">Horarios Disponibles</h3>
        <div className="rounded-lg bg-yellow-50 p-3 sm:p-4 text-center fade-up-normal">
          <p className="text-sm sm:text-base text-yellow-700">Esta fecha no tiene disponibilidad</p>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm zoom-in-normal">
        <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900 fade-down-fast">Horarios Disponibles</h3>
        <div className="rounded-lg bg-gray-50 p-3 sm:p-4 text-center fade-up-normal">
          <p className="text-sm sm:text-base text-gray-500">No hay horarios disponibles para esta fecha</p>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);
  const bookedSlots = slots.filter((slot) => !slot.available);

  return (
    <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm zoom-in-normal">
      <div className="mb-4 fade-down-fast">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Horarios Disponibles</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 fade-right-fast">
          Duración de la cita: {appointmentDuration} minutos
        </p>
      </div>

      {availableSlots.length === 0 ? (
        <div className="rounded-lg bg-yellow-50 p-3 sm:p-4 text-center fade-up-normal">
          <p className="text-sm sm:text-base text-yellow-700">Todos los horarios están ocupados</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 flip-up-normal">
          {slots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              onClick={() => slot.available && onTimeSelect(slot.time)}
              disabled={!slot.available}
              className={`
                rounded-lg px-2 sm:px-3 py-3 sm:py-2.5 text-sm sm:text-base font-medium transition-all touch-target no-select
                ${slot.available && slot.time !== selectedTime ? 'bg-gray-100 text-gray-900 hover:bg-blue-50 hover:text-blue-600 active:scale-95' : ''}
                ${slot.available && slot.time === selectedTime ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : ''}
                ${!slot.available ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through' : ''}
              `}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 flex justify-between text-xs sm:text-sm text-gray-500 fade-up-slow">
        <span className="fade-left-fast">{availableSlots.length} disponible{availableSlots.length !== 1 ? 's' : ''}</span>
        <span className="fade-right-fast">{bookedSlots.length} ocupado{bookedSlots.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default TimeSlots;
