interface SubscriptionHeaderProps {
  paymentStatus: string | null;
  error: string | null;
  successMessage: string | null;
}

const SubscriptionHeader = ({
  paymentStatus,
  error,
  successMessage
}: SubscriptionHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 fade-down-fast">Mi Suscripción</h1>
        <p className="mt-1 text-sm text-gray-600 fade-up-normal">
          Gestiona tu plan de suscripción
        </p>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === 'success' && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700 zoom-in-fast">
          <p className="font-medium fade-down-fast">¡Pago exitoso!</p>
          <p className="text-sm fade-up-normal">Tu suscripción ha sido activada correctamente.</p>
        </div>
      )}
      {paymentStatus === 'failure' && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 zoom-in-fast">
          <p className="font-medium fade-down-fast">Error en el pago</p>
          <p className="text-sm fade-up-normal">No se pudo procesar el pago. Por favor, intenta nuevamente.</p>
        </div>
      )}
      {paymentStatus === 'pending' && (
        <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-yellow-700 zoom-in-fast">
          <p className="font-medium fade-down-fast">Pago pendiente</p>
          <p className="text-sm fade-up-normal">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">{error}</div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 zoom-in-fast">{successMessage}</div>
      )}
    </>
  );
};

export default SubscriptionHeader;
