import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import GlobalLoadingSpinner from '../components/GlobalLoadingSpinner';

// Public layout for booking pages, landing page
// Mobile-first design

const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top safe-area-bottom">
      <GlobalLoadingSpinner />

      {/* Simple header for public pages - mobile-first */}
      <header className="bg-blue-500/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container-dashboard py-3 sm:py-4">
          <Button
            onClick={() => navigate('/')}
            sx={{
              fontSize: { xs: '18px', sm: '20px', md: '24px' },
              fontWeight: 700,
              color: '#ffffff',
              textTransform: 'none',
              padding: 0,
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#dbeafe',
              },
            }}
          >
            Reservas Online
          </Button>
        </div>
      </header>

      {/* Main content area - responsive padding */}
      <main className="container-dashboard py-4 sm:py-6 md:py-8 scroll-smooth-touch">
        <Outlet />
      </main>

      {/* Simple footer - responsive */}
      <footer className="mt-auto bg-black">
        <div className="container-dashboard py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-300">
          &copy; {new Date().getFullYear()} Reservas Online. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
