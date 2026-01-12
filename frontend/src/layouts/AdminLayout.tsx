import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
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
  { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { label: 'Profesionales', path: '/admin/professionals', icon: <GroupIcon sx={{ fontSize: 20 }} /> },
  { label: 'Planes', path: '/admin/plans', icon: <DescriptionIcon sx={{ fontSize: 20 }} /> },
  { label: 'Configuración', path: '/admin/settings', icon: <SettingsIcon sx={{ fontSize: 20 }} /> }
];

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login/admin');
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
        className={`fixed inset-y-0 left-0 z-30 w-72 sm:w-64 transform bg-slate-900 shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 safe-area-left ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-700 pl-6 pr-4">
          <span className="text-base sm:text-lg font-bold text-white">Panel Admin</span>
          <IconButton
            onClick={() => setIsSidebarOpen(false)}
            sx={{
              color: '#94a3b8',
              display: { xs: 'inline-flex', lg: 'none' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto scroll-smooth-touch safe-area-bottom">
          <ul className="">
            {navItems.map((item) => (
              <li key={item.path}>
                <Button
                  onClick={() => handleNavigation(item.path)}
                  fullWidth
                  startIcon={item.icon}
                  sx={{
                    justifyContent: 'flex-start',
                    pl: '24px',
                    pr: '16px',
                    py: { xs: '12px', sm: '10px' },
                    fontSize: { xs: '14px', sm: '16px' },
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: isActivePath(item.path) ? '#2563eb' : 'transparent',
                    color: isActivePath(item.path) ? '#ffffff' : '#cbd5e1',
                    fontWeight: isActivePath(item.path) ? 500 : 400,
                    '&:hover': {
                      backgroundColor: isActivePath(item.path) ? '#1d4ed8' : '#1e293b',
                    },
                  }}
                >
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer - Logout */}
        <div className="border-t border-slate-700">
          <Button
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              justifyContent: 'flex-start',
              gap: '12px',
              pl: '24px',
              pr: '16px',
              py: { xs: '12px', sm: '10px' },
              fontSize: { xs: '14px', sm: '16px' },
              textTransform: 'none',
              borderRadius: 0,
              color: '#f87171',
              '&:hover': {
                backgroundColor: '#1e293b',
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
            sx={{
              color: '#4b5563',
              display: { xs: 'inline-flex', lg: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Admin info */}
          <div className="flex items-center gap-1 sm:gap-2 truncate">
            <span className="text-xs sm:text-sm text-gray-600">Administrador:</span>
            <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
              {user?.name || user?.email || 'Admin'}
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

export default AdminLayout;
