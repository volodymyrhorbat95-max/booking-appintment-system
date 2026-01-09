import type { AdminDashboardStats } from '../../../types';

interface SummaryCardsSectionProps {
  stats: AdminDashboardStats | null;
}

const SummaryCardsSection = ({ stats }: SummaryCardsSectionProps) => {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Appointments Summary */}
      <div className="rounded-lg bg-white p-6 shadow-sm fade-left-normal">
        <h3 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Resumen de Citas</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center fade-right-fast">
            <span className="text-gray-600">Total de citas</span>
            <span className="font-medium text-gray-900">{stats?.appointments.total || 0}</span>
          </div>
          <div className="flex justify-between items-center fade-left-fast">
            <span className="text-gray-600">Citas hoy</span>
            <span className="font-medium text-gray-900">{stats?.appointments.today || 0}</span>
          </div>
          <div className="flex justify-between items-center fade-right-normal">
            <span className="text-gray-600">Esta semana</span>
            <span className="font-medium text-gray-900">{stats?.appointments.thisWeek || 0}</span>
          </div>
          <div className="flex justify-between items-center fade-left-normal">
            <span className="text-gray-600">Este mes</span>
            <span className="font-medium text-gray-900">{stats?.appointments.thisMonth || 0}</span>
          </div>
        </div>
      </div>

      {/* Professionals Summary */}
      <div className="rounded-lg bg-white p-6 shadow-sm fade-right-normal">
        <h3 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Resumen de Profesionales</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center fade-left-fast">
            <span className="text-gray-600">Total registrados</span>
            <span className="font-medium text-gray-900">{stats?.professionals.total || 0}</span>
          </div>
          <div className="flex justify-between items-center fade-right-fast">
            <span className="text-gray-600">Activos</span>
            <span className="font-medium text-green-600">{stats?.professionals.active || 0}</span>
          </div>
          <div className="flex justify-between items-center fade-left-normal">
            <span className="text-gray-600">Nuevos este mes</span>
            <span className="font-medium text-blue-600">{stats?.professionals.newThisMonth || 0}</span>
          </div>
          <div className="flex justify-between items-center fade-right-normal">
            <span className="text-gray-600">Con suscripción activa</span>
            <span className="font-medium text-purple-600">{stats?.subscriptions.active || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCardsSection;
