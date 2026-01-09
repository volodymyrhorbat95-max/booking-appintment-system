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
        <button
          type="button"
          onClick={onNewPlan}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 zoom-in-fast"
        >
          + Nuevo Plan
        </button>
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
