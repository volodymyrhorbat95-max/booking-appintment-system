import { Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CancelledConfirmationProps {
  onGoHome: () => void;
}

const CancelledConfirmation = ({ onGoHome }: CancelledConfirmationProps) => {
  return (
    <div className="mx-auto max-w-lg zoom-in-normal">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 zoom-in-fast">
          <CloseIcon sx={{ fontSize: 32, color: 'rgb(220, 38, 38)' }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 fade-down-fast">Reserva cancelada</h1>
        <p className="mt-2 text-gray-600 fade-up-normal">
          Tu cita ha sido cancelada exitosamente. El horario ahora está disponible para otros
          pacientes.
        </p>
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 fade-up-slow">
        <p className="text-center text-sm text-gray-600">
          Recibirás una confirmación de cancelación por WhatsApp y email.
        </p>
      </div>

      <div className="mt-6 text-center fade-up-slow">
        <Button
          variant="contained"
          onClick={onGoHome}
          sx={{
            textTransform: 'none',
            minHeight: 40,
          }}
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};

export default CancelledConfirmation;
