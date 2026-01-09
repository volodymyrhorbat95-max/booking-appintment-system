interface CancelledConfirmationProps {
  onGoHome: () => void;
}

const CancelledConfirmation = ({ onGoHome }: CancelledConfirmationProps) => {
  return (
    <div className="mx-auto max-w-lg zoom-in-normal">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 zoom-in-fast">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
        <button
          type="button"
          onClick={onGoHome}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default CancelledConfirmation;
