interface CancelSubscriptionModalProps {
  nextBillingDate: string | null;
  formatDate: (dateStr: string | null) => string;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelSubscriptionModal = ({
  nextBillingDate,
  formatDate,
  onClose,
  onConfirm
}: CancelSubscriptionModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl zoom-in-fast">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 fade-down-fast">¿Cancelar suscripción?</h3>
          <p className="mt-2 text-sm text-gray-500 fade-up-normal">
            Tu suscripción permanecerá activa hasta el{' '}
            <span className="font-medium fade-right-fast">{formatDate(nextBillingDate)}</span>.
            Después de esa fecha, perderás acceso a las funciones premium.
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 fade-left-normal"
            >
              Mantener suscripción
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 fade-right-normal"
            >
              Sí, cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;
