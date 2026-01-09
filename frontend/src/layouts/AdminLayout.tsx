import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import GlobalLoadingSpinner from '../components/GlobalLoadingSpinner';

// RULE: Navigation uses programmatic navigation ONLY, NOT link elements

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { label: 'Profesionales', path: '/admin/professionals', icon: '👥' },
  { label: 'Planes', path: '/admin/plans', icon: '📋' },
  { label: 'Configuración', path: '/admin/settings', icon: '⚙️' }
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
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-700 px-4">
          <span className="text-base sm:text-lg font-bold text-white">Panel Admin</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden touch-target no-select active:scale-95 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto scroll-smooth-touch p-3 sm:p-4 safe-area-bottom">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 sm:py-2.5 text-left text-sm sm:text-base transition-all touch-target-responsive no-select active:scale-[0.98] ${
                    isActivePath(item.path)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer - Logout */}
        <div className="border-t border-slate-700 p-3 sm:p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 sm:py-2.5 text-left text-sm sm:text-base text-red-400 hover:bg-slate-800 touch-target-responsive no-select active:scale-[0.98] transition-transform"
          >
            <span className="text-lg">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-white px-3 sm:px-4 shadow-sm">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100 lg:hidden touch-target no-select active:scale-95 transition-transform"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Admin info */}
          <div className="flex items-center gap-1 sm:gap-2 truncate">
            <span className="text-xs sm:text-sm text-gray-600">Administrador:</span>
            <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
              {user?.name || user?.email || 'Admin'}
            </span>
          </div>

          {/* Desktop logout button */}
          <button
            onClick={handleLogout}
            className="hidden rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 lg:block"
          >
            Cerrar Sesión
          </button>
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
