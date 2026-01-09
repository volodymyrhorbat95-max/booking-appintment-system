interface StatsRateCardsProps {
  confirmationRate: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

const StatsRateCards = ({
  confirmationRate,
  completionRate,
  cancellationRate,
  noShowRate
}: StatsRateCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <div className="rounded-lg bg-white p-4 shadow-sm fade-right-fast">
        <p className="text-sm text-gray-500">Tasa de confirmación</p>
        <p className="text-xl font-bold text-green-600">{confirmationRate}%</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm fade-left-fast">
        <p className="text-sm text-gray-500">Tasa de completadas</p>
        <p className="text-xl font-bold text-blue-600">{completionRate}%</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm fade-right-normal">
        <p className="text-sm text-gray-500">Tasa de cancelación</p>
        <p className="text-xl font-bold text-red-600">{cancellationRate}%</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm fade-left-normal">
        <p className="text-sm text-gray-500">Tasa de no asistencia</p>
        <p className="text-xl font-bold text-yellow-600">{noShowRate}%</p>
      </div>
    </div>
  );
};

export default StatsRateCards;
