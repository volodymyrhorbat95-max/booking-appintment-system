import GroupIcon from '@mui/icons-material/Group';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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
      icon: <GroupIcon sx={{ fontSize: 24 }} />,
      color: 'bg-blue-500',
      animation: 'fade-up-fast'
    },
    {
      label: 'Citas Este Mes',
      value: stats?.appointments.thisMonth || 0,
      subLabel: `${stats?.appointments.today || 0} hoy`,
      icon: <CalendarMonthIcon sx={{ fontSize: 24 }} />,
      color: 'bg-green-500',
      animation: 'fade-down-fast'
    },
    {
      label: 'Suscripciones Activas',
      value: stats?.subscriptions.active || 0,
      subLabel: 'planes activos',
      icon: <CreditCardIcon sx={{ fontSize: 24 }} />,
      color: 'bg-purple-500',
      animation: 'fade-up-normal'
    },
    {
      label: 'Nuevos Este Mes',
      value: stats?.professionals.newThisMonth || 0,
      subLabel: 'profesionales registrados',
      icon: <PersonAddIcon sx={{ fontSize: 24 }} />,
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
