import { Button } from '@mui/material';

interface CTASectionProps {
  onRegister: () => void;
}

const CTASection = ({ onRegister }: CTASectionProps) => {
  return (
    <div className="bg-blue-600 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white fade-down-fast">
          Comienza a automatizar tu agenda hoy
        </h2>
        <p className="mt-4 text-lg text-blue-100 fade-up-normal">
          Únete a miles de profesionales que ya optimizaron su gestión de citas
        </p>
        <Button
          variant="contained"
          onClick={onRegister}
          sx={{
            mt: 4,
            bgcolor: 'white',
            color: 'primary.main',
            textTransform: 'none',
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
          className="zoom-in-slow"
        >
          Registrarse con Google
        </Button>
      </div>
    </div>
  );
};

export default CTASection;
