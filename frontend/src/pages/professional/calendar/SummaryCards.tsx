interface SummaryData {
  today: number;
  thisWeek: number;
  pending: number;
  confirmed: number;
}

interface SummaryCardsProps {
  summary: SummaryData | null;
}

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-lg bg-white p-4 shadow-sm fade-up-fast">
        <p className="text-sm text-gray-500">Hoy</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{summary?.today || 0}</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm fade-down-fast">
        <p className="text-sm text-gray-500">Esta semana</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{summary?.thisWeek || 0}</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm fade-right-fast">
        <p className="text-sm text-gray-500">Pendientes</p>
        <p className="mt-1 text-3xl font-bold text-yellow-600">{summary?.pending || 0}</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm fade-left-fast">
        <p className="text-sm text-gray-500">Confirmadas</p>
        <p className="mt-1 text-3xl font-bold text-green-600">{summary?.confirmed || 0}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
