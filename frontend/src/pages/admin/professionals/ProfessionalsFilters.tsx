interface ProfessionalsFiltersProps {
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProfessionalsFilters = ({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onSubmit
}: ProfessionalsFiltersProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-up-fast">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 fade-right-fast">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, email o slug..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-40 fade-left-fast">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 zoom-in-fast"
        >
          Buscar
        </button>
      </form>
    </div>
  );
};

export default ProfessionalsFilters;
