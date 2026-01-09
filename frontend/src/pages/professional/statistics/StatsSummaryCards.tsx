interface StatsSummaryCardsProps {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

const StatsSummaryCards = ({ total, completed, cancelled, noShow }: StatsSummaryCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <div className="rounded-lg bg-white p-6 shadow-sm fade-up-fast">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 zoom-in-fast">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500">Total de citas</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm fade-up-normal">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 zoom-in-fast">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{completed}</p>
            <p className="text-sm text-gray-500">Completadas</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm fade-down-fast">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 zoom-in-fast">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{cancelled}</p>
            <p className="text-sm text-gray-500">Canceladas</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm fade-down-normal">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 zoom-in-fast">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{noShow}</p>
            <p className="text-sm text-gray-500">No asistió</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSummaryCards;
