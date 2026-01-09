// Filter options
const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'COMPLETED', label: 'Completadas' }
];

interface FiltersState {
  status: string;
  startDate: string;
  endDate: string;
}

interface AppointmentFiltersProps {
  filters: FiltersState;
  onFilterChange: (key: string, value: string) => void;
}

const AppointmentFilters = ({ filters, onFilterChange }: AppointmentFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm fade-down-normal">
      <div className="fade-left-fast">
        <label className="block text-sm font-medium text-gray-700">Estado</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="zoom-in-fast">
        <label className="block text-sm font-medium text-gray-700">Desde</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="fade-right-fast">
        <label className="block text-sm font-medium text-gray-700">Hasta</label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default AppointmentFilters;
