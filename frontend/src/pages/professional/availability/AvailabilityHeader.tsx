interface AvailabilityHeaderProps {
  error: string | null;
  saveMessage: string;
}

const AvailabilityHeader = ({ error, saveMessage }: AvailabilityHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6 fade-down-normal">
        <h1 className="text-2xl font-bold text-gray-900 fade-up-fast">Configurar Disponibilidad</h1>
        <p className="mt-1 text-sm text-gray-600 fade-up-normal">
          Define los días y horarios en los que estás disponible para recibir citas
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">{error}</div>
      )}

      {/* Success message */}
      {saveMessage && !error && (
        <div className={`mb-4 rounded-lg p-3 text-sm zoom-in-fast ${
          saveMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {saveMessage}
        </div>
      )}
    </>
  );
};

export default AvailabilityHeader;
