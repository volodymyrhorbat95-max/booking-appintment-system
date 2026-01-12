import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import PublicIcon from '@mui/icons-material/Public';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import SyncIcon from '@mui/icons-material/Sync';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PaymentIcon from '@mui/icons-material/Payment';
import BarChartIcon from '@mui/icons-material/BarChart';
import StarIcon from '@mui/icons-material/Star';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import GlobalLoadingSpinner from '../components/GlobalLoadingSpinner';

// RULE: Navigation uses programmatic navigation ONLY, NOT link elements

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Calendario', path: '/professional/calendar', icon: <CalendarMonthIcon sx={{ fontSize: 20 }} /> },
  { label: 'Disponibilidad', path: '/professional/availability', icon: <AccessTimeIcon sx={{ fontSize: 20 }} /> },
  { label: 'Bloquear Fechas', path: '/professional/blocked-dates', icon: <BlockIcon sx={{ fontSize: 20 }} /> },
  { label: 'Google Calendar', path: '/professional/google-calendar', icon: <SyncIcon sx={{ fontSize: 20 }} /> },
  { label: 'Recordatorios', path: '/professional/reminders', icon: <NotificationsIcon sx={{ fontSize: 20 }} /> },
  { label: 'Plantillas', path: '/professional/templates', icon: <DescriptionIcon sx={{ fontSize: 20 }} /> },
  { label: 'Formulario', path: '/professional/form-fields', icon: <ListAltIcon sx={{ fontSize: 20 }} /> },
  { label: 'Depósito', path: '/professional/deposit', icon: <PaymentIcon sx={{ fontSize: 20 }} /> },
  { label: 'Estadísticas', path: '/professional/statistics', icon: <BarChartIcon sx={{ fontSize: 20 }} /> },
  { label: 'Suscripción', path: '/professional/subscription', icon: <StarIcon sx={{ fontSize: 20 }} /> }
];

const ProfessionalLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, professional } = useAppSelector((state) => state.auth);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login/professional');
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-100 safe-area-top">
      <GlobalLoadingSpinner />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: slide from left, Desktop: fixed */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 sm:w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 safe-area-left ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 sm:h-16 items-center justify-between border-b px-4">
          <span className="text-base sm:text-lg font-bold text-gray-900">Panel Profesional</span>
          <IconButton
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
            sx={{ color: '#6b7280' }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        {/* Navigation items - scrollable on mobile */}
        <nav className="flex-1 overflow-y-auto scroll-smooth-touch p-3 sm:p-4 safe-area-bottom">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Button
                  onClick={() => handleNavigation(item.path)}
                  fullWidth
                  startIcon={item.icon}
                  sx={{
                    justifyContent: 'flex-start',
                    px: '12px',
                    py: { xs: '12px', sm: '10px' },
                    fontSize: { xs: '14px', sm: '16px' },
                    textTransform: 'none',
                    backgroundColor: isActivePath(item.path) ? '#dbeafe' : 'transparent',
                    color: isActivePath(item.path) ? '#1d4ed8' : '#374151',
                    fontWeight: isActivePath(item.path) ? 500 : 400,
                    '&:hover': {
                      backgroundColor: isActivePath(item.path) ? '#bfdbfe' : '#f3f4f6',
                    },
                  }}
                >
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>

          {/* My booking page link */}
          {professional?.slug && (
            <div className="mt-4 sm:mt-6 border-t pt-4">
              <Button
                onClick={() => handleNavigation(`/booking/${professional.slug}`)}
                fullWidth
                startIcon={<PublicIcon />}
                sx={{
                  justifyContent: 'flex-start',
                  gap: '12px',
                  px: '12px',
                  py: { xs: '12px', sm: '10px' },
                  fontSize: { xs: '14px', sm: '16px' },
                  textTransform: 'none',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  '&:hover': {
                    backgroundColor: '#bbf7d0',
                  },
                }}
              >
                Mi Página de Reservas
              </Button>
            </div>
          )}
        </nav>

        {/* Sidebar footer - Logout */}
        <div className="border-t p-3 sm:p-4">
          <Button
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              justifyContent: 'flex-start',
              gap: '12px',
              px: '12px',
              py: { xs: '12px', sm: '10px' },
              fontSize: { xs: '14px', sm: '16px' },
              textTransform: 'none',
              color: '#dc2626',
              '&:hover': {
                backgroundColor: '#fef2f2',
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-white px-3 sm:px-4 shadow-sm">
          {/* Mobile menu button */}
          <IconButton
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
            sx={{ color: '#4b5563' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Professional name */}
          <div className="flex items-center gap-1 sm:gap-2 truncate">
            <span className="text-xs sm:text-sm text-gray-600">Hola,</span>
            <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
              {professional?.firstName || user?.name || 'Profesional'}
            </span>
          </div>

          {/* Desktop logout button */}
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              color: '#dc2626',
              '&:hover': {
                backgroundColor: '#fef2f2',
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scroll-smooth-touch">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfessionalLayout;
