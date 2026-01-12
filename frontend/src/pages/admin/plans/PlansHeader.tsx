import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface PlansHeaderProps {
  error: string | null;
  successMessage: string | null;
  onNewPlan: () => void;
}

const PlansHeader = ({ error, successMessage, onNewPlan }: PlansHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between fade-down-fast">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 fade-left-fast">Gestionar Planes</h1>
          <p className="mt-1 text-sm text-gray-600 fade-up-normal">
            Crear y editar planes de suscripción
          </p>
        </div>
        <Button
          variant="contained"
          onClick={onNewPlan}
          startIcon={<AddIcon />}
          className="zoom-in-fast"
          sx={{ textTransform: 'none' }}
        >
          Nuevo Plan
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 fade-right-fast">{error}</div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 fade-left-fast">{successMessage}</div>
      )}
    </>
  );
};

export default PlansHeader;
