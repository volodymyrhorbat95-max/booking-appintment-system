interface SettingsHeaderProps {
  error: string | null;
  successMessage: string | null;
}

const SettingsHeader = ({ error, successMessage }: SettingsHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6 fade-down-fast">
        <h1 className="text-2xl font-bold text-gray-900 fade-left-fast">Configuración de Plataforma</h1>
        <p className="mt-1 text-sm text-gray-600 fade-up-normal">
          Ajustes generales de la plataforma
        </p>
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

export default SettingsHeader;
