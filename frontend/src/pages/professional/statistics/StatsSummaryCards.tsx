import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
            <CalendarMonthIcon sx={{ fontSize: 24 }} />
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
            <CheckIcon sx={{ fontSize: 24 }} />
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
            <CloseIcon sx={{ fontSize: 24 }} />
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
            <ErrorOutlineIcon sx={{ fontSize: 24 }} />
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
