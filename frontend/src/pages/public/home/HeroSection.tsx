import { Button } from '@mui/material';

interface HeroSectionProps {
  onStartFree: () => void;
  onAdminAccess: () => void;
}

const HeroSection = ({ onStartFree, onAdminAccess }: HeroSectionProps) => {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block fade-down-fast">Gestiona tus citas</span>
          <span className="block text-blue-600 fade-up-normal">de forma automática</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 zoom-in-normal">
          Plataforma completa para profesionales independientes. Agenda online 24/7,
          recordatorios automáticos por WhatsApp, sincronización con Google Calendar y más.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="contained"
            onClick={onStartFree}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
            }}
            className="fade-left-fast"
          >
            Comenzar Gratis
          </Button>
          <Button
            variant="outlined"
            onClick={onAdminAccess}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
            }}
            className="fade-right-fast"
          >
            Acceso Admin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
