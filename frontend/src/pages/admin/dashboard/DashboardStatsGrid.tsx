import type { AdminDashboardStats } from '../../../types';

interface DashboardStatsGridProps {
  stats: AdminDashboardStats | null;
}

const DashboardStatsGrid = ({ stats }: DashboardStatsGridProps) => {
  const statItems = [
    {
      label: 'Profesionales Totales',
      value: stats?.professionals.total || 0,
      subLabel: `${stats?.professionals.active || 0} activos`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      animation: 'fade-up-fast'
    },
    {
      label: 'Citas Este Mes',
      value: stats?.appointments.thisMonth || 0,
      subLabel: `${stats?.appointments.today || 0} hoy`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-green-500',
      animation: 'fade-down-fast'
    },
    {
      label: 'Suscripciones Activas',
      value: stats?.subscriptions.active || 0,
      subLabel: 'planes activos',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'bg-purple-500',
      animation: 'fade-up-normal'
    },
    {
      label: 'Nuevos Este Mes',
      value: stats?.professionals.newThisMonth || 0,
      subLabel: 'profesionales registrados',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'bg-yellow-500',
      animation: 'fade-down-normal'
    }
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat, index) => (
        <div key={index} className={`rounded-lg bg-white p-6 shadow-sm ${stat.animation}`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white zoom-in-fast`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 fade-right-fast">{stat.value}</p>
              <p className="text-sm text-gray-500 fade-left-fast">{stat.label}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400 fade-up-slow">{stat.subLabel}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsGrid;
