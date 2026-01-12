import { Checkbox, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

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
          <Checkbox
            checked={dayConfig.enabled}
            onChange={() => onToggleDay(dayValue)}
            color="primary"
          />
          <span className="text-base font-medium text-gray-900">{dayLabel}</span>
        </label>

        {dayConfig.enabled && dayConfig.slots.length < 5 && (
          <Button
            size="small"
            onClick={() => onAddSlot(dayValue)}
            startIcon={<AddIcon />}
            className="zoom-in-fast"
          >
            Agregar horario
          </Button>
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
                <TextField
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    onUpdateSlotTime(dayValue, slot.slotNumber, 'startTime', e.target.value)
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <span className="text-gray-500">a</span>
                <TextField
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    onUpdateSlotTime(dayValue, slot.slotNumber, 'endTime', e.target.value)
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </div>
              {dayConfig.slots.length > 1 && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => onRemoveSlot(dayValue, slot.slotNumber)}
                  startIcon={<DeleteIcon />}
                  className="zoom-out-fast"
                >
                  Eliminar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayCard;
