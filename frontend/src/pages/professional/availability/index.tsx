import { useState, useEffect, useCallback } from 'react';
import { Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAppDispatch, useAppSelector } from '../../../store';
import { getAvailability, saveAvailability, clearError } from '../../../store/slices/availabilitySlice';
import AvailabilityHeader from './AvailabilityHeader';
import DurationSelector from './DurationSelector';
import DayCard, { type DayConfig } from './DayCard';
import HelpSection from './HelpSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: Save → dispatch action → backend updates → state updates → component re-renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

// Days of week (Sunday = 0, Saturday = 6)
const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

const AvailabilityPage = () => {
  const dispatch = useAppDispatch();
  const { availabilities, appointmentDuration: savedDuration, error } = useAppSelector(
    (state) => state.availability
  );

  // Local state for form
  const [days, setDays] = useState<DayConfig[]>([]);
  const [duration, setDuration] = useState(30);
  const [saveMessage, setSaveMessage] = useState('');

  // Initialize days configuration
  const initializeDays = useCallback(() => {
    const initialDays: DayConfig[] = DAYS_OF_WEEK.map((day) => {
      // Find existing slots for this day
      const daySlots = availabilities
        .filter((a) => a.dayOfWeek === day.value)
        .map((a) => ({
          slotNumber: a.slotNumber,
          startTime: a.startTime,
          endTime: a.endTime
        }))
        .sort((a, b) => a.slotNumber - b.slotNumber);

      return {
        dayOfWeek: day.value,
        enabled: daySlots.length > 0,
        slots: daySlots.length > 0 ? daySlots : [{ slotNumber: 1, startTime: '09:00', endTime: '18:00' }]
      };
    });

    setDays(initialDays);
    setDuration(savedDuration || 30);
  }, [availabilities, savedDuration]);

  // Load availability on mount
  useEffect(() => {
    dispatch(getAvailability());
  }, [dispatch]);

  // Initialize form when data loads
  useEffect(() => {
    initializeDays();
  }, [initializeDays]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Toggle day enabled/disabled
  const toggleDay = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, enabled: !day.enabled }
          : day
      )
    );
    setSaveMessage('');
  };

  // Update slot time
  const updateSlotTime = (
    dayOfWeek: number,
    slotNumber: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        return {
          ...day,
          slots: day.slots.map((slot) =>
            slot.slotNumber === slotNumber ? { ...slot, [field]: value } : slot
          )
        };
      })
    );
    setSaveMessage('');
  };

  // Add new slot to a day
  const addSlot = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        const newSlotNumber = Math.max(...day.slots.map((s) => s.slotNumber)) + 1;
        return {
          ...day,
          slots: [...day.slots, { slotNumber: newSlotNumber, startTime: '14:00', endTime: '18:00' }]
        };
      })
    );
    setSaveMessage('');
  };

  // Remove slot from a day
  const removeSlot = (dayOfWeek: number, slotNumber: number) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        if (day.slots.length <= 1) return day; // Keep at least one slot
        return {
          ...day,
          slots: day.slots.filter((s) => s.slotNumber !== slotNumber)
        };
      })
    );
    setSaveMessage('');
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setSaveMessage('');
  };

  // Handle save
  const handleSave = async () => {
    setSaveMessage('');

    // Build availability data
    const availabilityData: { dayOfWeek: number; slotNumber: number; startTime: string; endTime: string }[] = [];

    for (const day of days) {
      if (!day.enabled) continue;

      for (const slot of day.slots) {
        // Validate times
        if (slot.startTime >= slot.endTime) {
          setSaveMessage(`Error: La hora de fin debe ser posterior a la hora de inicio (${DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label})`);
          return;
        }

        availabilityData.push({
          dayOfWeek: day.dayOfWeek,
          slotNumber: slot.slotNumber,
          startTime: slot.startTime,
          endTime: slot.endTime
        });
      }
    }

    // Dispatch save action
    const result = await dispatch(
      saveAvailability({
        availabilities: availabilityData,
        appointmentDuration: duration
      })
    );

    if (saveAvailability.fulfilled.match(result)) {
      setSaveMessage('Disponibilidad guardada correctamente');
    }
  };

  return (
    <div className="mx-auto max-w-4xl zoom-in-normal">
      {/* Header Section */}
      <AvailabilityHeader error={error} saveMessage={saveMessage} />

      {/* Duration Selector Section */}
      <DurationSelector duration={duration} onDurationChange={handleDurationChange} />

      {/* Days Configuration Section */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((dayInfo, index) => {
          const dayConfig = days.find((d) => d.dayOfWeek === dayInfo.value);
          if (!dayConfig) return null;

          return (
            <DayCard
              key={dayInfo.value}
              dayLabel={dayInfo.label}
              dayValue={dayInfo.value}
              dayConfig={dayConfig}
              onToggleDay={toggleDay}
              onUpdateSlotTime={updateSlotTime}
              onAddSlot={addSlot}
              onRemoveSlot={removeSlot}
              animationIndex={index}
            />
          );
        })}
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end fade-up-normal">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          className="zoom-in-fast"
        >
          Guardar Disponibilidad
        </Button>
      </div>

      {/* Help Section */}
      <HelpSection />
    </div>
  );
};

export default AvailabilityPage;
