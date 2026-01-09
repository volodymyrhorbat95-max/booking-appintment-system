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
      <label className="block text-sm font-medium text-gray-700 fade-down-fast">
        Duración de cada cita
      </label>
      <select
        value={duration}
        onChange={(e) => onDurationChange(Number(e.target.value))}
        className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-48 zoom-in-fast"
      >
        {APPOINTMENT_DURATIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DurationSelector;
