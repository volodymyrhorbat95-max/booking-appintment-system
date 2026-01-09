interface StatisticsHeaderProps {
  dateRange: '3m' | '6m' | '12m';
  onDateRangeChange: (range: '3m' | '6m' | '12m') => void;
  error: string | null;
}

const StatisticsHeader = ({ dateRange, onDateRangeChange, error }: StatisticsHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-down-normal">
        <div className="fade-up-fast">
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Resumen de tu actividad de citas
          </p>
        </div>
        <div className="flex gap-2 fade-left-fast">
          <button
            type="button"
            onClick={() => onDateRangeChange('3m')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '3m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            3 meses
          </button>
          <button
            type="button"
            onClick={() => onDateRangeChange('6m')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '6m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            6 meses
          </button>
          <button
            type="button"
            onClick={() => onDateRangeChange('12m')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '12m'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            12 meses
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">{error}</div>
      )}
    </>
  );
};

export default StatisticsHeader;
