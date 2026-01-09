interface CancelAppointmentModalProps {
  patientName: string;
  cancelReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CancelAppointmentModal = ({
  patientName,
  cancelReason,
  onReasonChange,
  onConfirm,
  onCancel
}: CancelAppointmentModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl zoom-in-fast">
        <h3 className="text-lg font-semibold text-gray-900 fade-down-fast">Cancelar cita</h3>
        <p className="mt-2 text-sm text-gray-600 fade-up-fast">
          ¿Estás seguro de que deseas cancelar la cita de {patientName}?
        </p>

        <div className="mt-4 fade-right-normal">
          <label className="block text-sm font-medium text-gray-700">
            Motivo de cancelación (opcional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Ingresa el motivo..."
          />
        </div>

        <div className="mt-6 flex gap-3 fade-up-normal">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
