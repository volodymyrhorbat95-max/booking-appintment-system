export interface TimeSlot {
  slotNumber: number;
  startTime: string;
  endTime: string;
}

export interface DayConfig {
  dayOfWeek: number;
  enabled: boolean;
  slots: TimeSlot[];
}

interface DayCardProps {
  dayLabel: string;
  dayValue: number;
  dayConfig: DayConfig;
  onToggleDay: (dayOfWeek: number) => void;
  onUpdateSlotTime: (
    dayOfWeek: number,
    slotNumber: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => void;
  onAddSlot: (dayOfWeek: number) => void;
  onRemoveSlot: (dayOfWeek: number, slotNumber: number) => void;
  animationIndex: number;
}

const DayCard = ({
  dayLabel,
  dayValue,
  dayConfig,
  onToggleDay,
  onUpdateSlotTime,
  onAddSlot,
  onRemoveSlot,
  animationIndex
}: DayCardProps) => {
  // Alternate animation directions based on index
  const getCardAnimation = () => {
    const animations = ['fade-left-fast', 'fade-right-fast', 'fade-left-normal', 'fade-right-normal', 'zoom-in-fast', 'fade-up-fast', 'fade-down-fast'];
    return animations[animationIndex % animations.length];
  };

  return (
    <div
      className={`rounded-lg bg-white p-4 shadow-sm ${getCardAnimation()} ${
        !dayConfig.enabled ? 'opacity-60' : ''
      }`}
    >
      {/* Day header with toggle */}
      <div className="flex items-center justify-between fade-up-fast">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={dayConfig.enabled}
            onChange={() => onToggleDay(dayValue)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-base font-medium text-gray-900">{dayLabel}</span>
        </label>

        {dayConfig.enabled && dayConfig.slots.length < 5 && (
          <button
            type="button"
            onClick={() => onAddSlot(dayValue)}
            className="text-sm text-blue-600 hover:text-blue-500 zoom-in-fast"
          >
            + Agregar horario
          </button>
        )}
      </div>

      {/* Time slots */}
      {dayConfig.enabled && (
        <div className="mt-4 space-y-3">
          {dayConfig.slots.map((slot, index) => (
            <div
              key={slot.slotNumber}
              className={`flex flex-wrap items-center gap-2 sm:gap-4 ${
                index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
              }`}
            >
              <span className="text-sm text-gray-500 w-20">
                Horario {index + 1}:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    onUpdateSlotTime(dayValue, slot.slotNumber, 'startTime', e.target.value)
                  }
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    onUpdateSlotTime(dayValue, slot.slotNumber, 'endTime', e.target.value)
                  }
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {dayConfig.slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSlot(dayValue, slot.slotNumber)}
                  className="text-sm text-red-600 hover:text-red-500 zoom-out-fast"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayCard;
