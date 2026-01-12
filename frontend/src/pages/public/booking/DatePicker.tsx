import { useMemo } from 'react';
import { Button } from '@mui/material';
import type { BookingAvailabilitySlot } from '../../../types';

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  availabilitySlots: BookingAvailabilitySlot[];
  blockedDates: string[];
  timezone: string;
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DatePicker = ({
  selectedDate,
  onDateSelect,
  availabilitySlots,
  blockedDates
}: DatePickerProps) => {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Get days that have availability configured
  const availableDaysOfWeek = useMemo(() => {
    const days = new Set<number>();
    availabilitySlots.forEach((slot) => days.add(slot.dayOfWeek));
    return days;
  }, [availabilitySlots]);

  // Generate calendar for current month + next month
  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    const startDate = new Date(today);
    startDate.setDate(1); // Start of current month

    // Go back to find the Sunday of the first week
    const firstDayOfMonth = startDate.getDay();
    startDate.setDate(startDate.getDate() - firstDayOfMonth);

    // Generate 6 weeks (covers current month + overflow)
    for (let week = 0; week < 8; week++) {
      const weekDays: Date[] = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
      }
      weeks.push(weekDays);
    }

    return weeks;
  }, [today]);

  // Get current displayed month
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Check if a date is available for booking
  const isDateAvailable = (date: Date): boolean => {
    // Past dates are not available
    if (date < today) return false;

    // Check if day of week has availability
    if (!availableDaysOfWeek.has(date.getDay())) return false;

    // Check if date is blocked
    const dateStr = date.toISOString().split('T')[0];
    if (blockedDates.includes(dateStr)) return false;

    return true;
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    return date.getTime() === today.getTime();
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      onDateSelect(date.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm zoom-in-normal">
      {/* Month header */}
      <div className="mb-4 text-center fade-down-fast">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 fade-up-fast">Selecciona una fecha disponible</p>
      </div>

      {/* Days of week header */}
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2 fade-left-normal">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-1 sm:py-2 text-center text-xs sm:text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - touch-friendly on mobile */}
      <div className="space-y-1 sm:space-y-2 flip-up-normal">
        {calendarWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
            {week.map((date, dayIndex) => {
              const available = isDateAvailable(date);
              const selected = isSelected(date);
              const todayDate = isToday(date);
              const isCurrentMonth = date.getMonth() === currentMonth;

              return (
                <Button
                  key={dayIndex}
                  onClick={() => handleDateClick(date)}
                  disabled={!available}
                  variant={selected ? 'contained' : 'text'}
                  sx={{
                    aspectRatio: '1',
                    minWidth: 0,
                    p: { xs: 0.5, sm: 1 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 'medium',
                    borderRadius: '8px',
                    color: !isCurrentMonth ? 'text.disabled' : selected ? 'white' : 'text.primary',
                    bgcolor: selected ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: selected ? 'primary.dark' : 'action.hover',
                    },
                    '&.Mui-disabled': {
                      color: 'text.disabled',
                    },
                    ...(todayDate && !selected && {
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }),
                    ...(selected && {
                      boxShadow: '0 0 0 2px',
                      boxShadowColor: 'primary.main',
                    }),
                  }}
                >
                  {date.getDate()}
                </Button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 fade-up-slow">
        <div className="flex items-center gap-1 fade-right-fast">
          <div className="h-3 w-3 rounded-full ring-2 ring-blue-500" />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-1 zoom-in-fast">
          <div className="h-3 w-3 rounded-full bg-blue-600" />
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-1 fade-left-fast">
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <span>No disponible</span>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
