import { Button } from '@mui/material';

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
          <Button
            variant={dateRange === '3m' ? 'contained' : 'outlined'}
            onClick={() => onDateRangeChange('3m')}
          >
            3 meses
          </Button>
          <Button
            variant={dateRange === '6m' ? 'contained' : 'outlined'}
            onClick={() => onDateRangeChange('6m')}
          >
            6 meses
          </Button>
          <Button
            variant={dateRange === '12m' ? 'contained' : 'outlined'}
            onClick={() => onDateRangeChange('12m')}
          >
            12 meses
          </Button>
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
