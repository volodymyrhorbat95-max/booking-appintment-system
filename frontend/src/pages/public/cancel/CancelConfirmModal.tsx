interface CancelConfirmModalProps {
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelConfirmModal = ({
  reason,
  onReasonChange,
  onConfirm,
  onClose
}: CancelConfirmModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl zoom-in-fast">
        <h3 className="text-lg font-semibold text-gray-900 fade-down-fast">Confirmar cancelación</h3>
        <p className="mt-2 text-sm text-gray-600 fade-up-normal">
          ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
        </p>

        <div className="mt-4 fade-up-normal">
          <label className="block text-sm font-medium text-gray-700">
            Motivo de cancelación (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Cuéntanos por qué cancelas..."
          />
        </div>

        <div className="mt-6 flex gap-3 fade-up-slow">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 fade-left-fast"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 fade-right-fast"
          >
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmModal;
