interface BlockedDatesHeaderProps {
  error: string | null;
  successMessage: string;
}

const BlockedDatesHeader = ({ error, successMessage }: BlockedDatesHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6 fade-down-normal">
        <h1 className="text-2xl font-bold text-gray-900 fade-up-fast">Bloquear Fechas</h1>
        <p className="mt-1 text-sm text-gray-600 fade-up-normal">
          Bloquea fechas específicas para vacaciones, feriados u otras ausencias
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">{error}</div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 zoom-in-fast">
          {successMessage}
        </div>
      )}
    </>
  );
};

export default BlockedDatesHeader;
