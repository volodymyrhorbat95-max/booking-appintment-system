import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// Generate appointment durations: 5 to 180 minutes in 5-minute increments
const APPOINTMENT_DURATIONS = Array.from({ length: 36 }, (_, i) => {
  const minutes = (i + 1) * 5; // 5, 10, 15, ... 180
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let label: string;
  if (hours === 0) {
    label = `${minutes} minutos`;
  } else if (mins === 0) {
    label = hours === 1 ? `${hours} hora` : `${hours} horas`;
  } else {
    label = `${hours}h ${mins}min`;
  }
  return { value: minutes, label };
});

interface DurationSelectorProps {
  duration: number;
  onDurationChange: (duration: number) => void;
}

const DurationSelector = ({ duration, onDurationChange }: DurationSelectorProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-right-normal">
      <FormControl size="small" className="mt-2 sm:w-48 zoom-in-fast">
        <InputLabel id="duration-label">Duración de cada cita</InputLabel>
        <Select
          labelId="duration-label"
          value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          label="Duración de cada cita"
        >
          {APPOINTMENT_DURATIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default DurationSelector;
