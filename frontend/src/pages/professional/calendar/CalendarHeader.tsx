import { Button, ButtonGroup } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListIcon from '@mui/icons-material/List';

type ViewMode = 'dashboard' | 'list';

interface CalendarHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  error: string | null;
  successMessage: string | null;
}

const CalendarHeader = ({
  viewMode,
  onViewModeChange,
  error,
  successMessage
}: CalendarHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-down-normal">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 fade-right-fast">Calendario de Citas</h1>
          <p className="mt-1 text-sm text-gray-600 fade-up-fast">
            Gestiona tus citas y ve el estado de cada una
          </p>
        </div>

        {/* View toggle */}
        <ButtonGroup variant="contained" className="zoom-in-normal">
          <Button
            onClick={() => onViewModeChange('dashboard')}
            variant={viewMode === 'dashboard' ? 'contained' : 'outlined'}
            startIcon={<DashboardIcon />}
          >
            Resumen
          </Button>
          <Button
            onClick={() => onViewModeChange('list')}
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ListIcon />}
          >
            Lista
          </Button>
        </ButtonGroup>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">{error}</div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 zoom-in-fast">{successMessage}</div>
      )}
    </>
  );
};

export default CalendarHeader;
