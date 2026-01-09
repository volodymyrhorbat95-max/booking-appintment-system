const StatsInfoBox = () => {
  return (
    <div className="mt-6 rounded-lg bg-blue-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-blue-900 fade-down-fast">Nota</h3>
      <p className="mt-1 text-sm text-blue-700 fade-up-normal">
        Estas estadísticas te ayudan a comprender los patrones de reserva de tus pacientes.
        Puedes usar esta información para optimizar tu disponibilidad y reducir las cancelaciones.
      </p>
    </div>
  );
};

export default StatsInfoBox;
