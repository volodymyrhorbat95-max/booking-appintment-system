interface DashboardHeaderProps {
  error: string | null;
}

const DashboardHeader = ({ error }: DashboardHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 fade-down-fast">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 fade-up-normal">
          Resumen general de la plataforma
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">{error}</div>
      )}
    </>
  );
};

export default DashboardHeader;
