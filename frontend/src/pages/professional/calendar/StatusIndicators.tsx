const StatusIndicators = () => {
  return (
    <div className="rounded-lg bg-gray-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">Indicadores de estado</h3>
      <div className="mt-3 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 fade-right-fast">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Confirmada</span>
        </div>
        <div className="flex items-center gap-2 zoom-in-fast">
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="text-sm text-gray-600">Pendiente/Recordatorio</span>
        </div>
        <div className="flex items-center gap-2 fade-left-fast">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">Cancelada</span>
        </div>
      </div>
    </div>
  );
};

export default StatusIndicators;
