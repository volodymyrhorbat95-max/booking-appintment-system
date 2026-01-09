// Get today's date formatted for input
const getTodayForInput = (): string => {
  return new Date().toISOString().split('T')[0];
};

interface BlockedDateFormProps {
  mode: 'single' | 'range';
  singleDate: string;
  startDate: string;
  endDate: string;
  reason: string;
  onModeChange: (mode: 'single' | 'range') => void;
  onSingleDateChange: (date: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

const BlockedDateForm = ({
  mode,
  singleDate,
  startDate,
  endDate,
  reason,
  onModeChange,
  onSingleDateChange,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSubmit
}: BlockedDateFormProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-right-normal">
      <h2 className="mb-4 text-lg font-medium text-gray-900 fade-down-fast">Agregar Fecha Bloqueada</h2>

      {/* Mode toggle */}
      <div className="mb-4 flex gap-4 fade-up-fast">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={mode === 'single'}
            onChange={() => onModeChange('single')}
            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Fecha única</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={mode === 'range'}
            onChange={() => onModeChange('range')}
            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Rango de fechas</span>
        </label>
      </div>

      {/* Date inputs */}
      {mode === 'single' ? (
        <div className="mb-4 zoom-in-fast">
          <label className="block text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            value={singleDate}
            min={getTodayForInput()}
            onChange={(e) => onSingleDateChange(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
          />
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-4 zoom-in-fast">
          <div className="fade-left-fast">
            <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
            <input
              type="date"
              value={startDate}
              min={getTodayForInput()}
              onChange={(e) => {
                onStartDateChange(e.target.value);
                if (e.target.value > endDate) {
                  onEndDateChange(e.target.value);
                }
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="fade-right-fast">
            <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
            <input
              type="date"
              value={endDate}
              min={startDate || getTodayForInput()}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Reason input */}
      <div className="mb-4 fade-up-normal">
        <label className="block text-sm font-medium text-gray-700">
          Motivo <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Ej: Vacaciones, Feriado, Congreso médico..."
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={onSubmit}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 zoom-in-normal"
      >
        {mode === 'single' ? 'Bloquear Fecha' : 'Bloquear Rango'}
      </button>
    </div>
  );
};

export default BlockedDateForm;
