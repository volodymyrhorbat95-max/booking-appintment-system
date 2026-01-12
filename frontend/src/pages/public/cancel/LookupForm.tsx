import { TextField, Button } from '@mui/material';

interface LookupFormProps {
  reference: string;
  email: string;
  lookupError: string;
  error: string | null;
  notFound: boolean;
  onReferenceChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoHome: () => void;
}

const LookupForm = ({
  reference,
  email,
  lookupError,
  error,
  notFound,
  onReferenceChange,
  onEmailChange,
  onSubmit,
  onGoHome
}: LookupFormProps) => {
  return (
    <div className="mx-auto max-w-md zoom-in-normal">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 fade-down-fast">Consultar o cancelar reserva</h1>
        <p className="mt-2 text-gray-600 fade-up-normal">
          Ingresa tu código de reserva y email para ver los detalles de tu cita
        </p>
      </div>

      {/* Error messages */}
      {(lookupError || error || notFound) && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 zoom-in-fast">
          {lookupError ||
            (notFound
              ? 'No encontramos ninguna reserva con esos datos. Verifica el código y email.'
              : error)}
        </div>
      )}

      {/* Lookup form */}
      <form onSubmit={onSubmit} className="rounded-lg bg-white p-6 shadow-sm fade-up-normal">
        <div className="space-y-4">
          <div className="fade-right-fast">
            <TextField
              label="Código de reserva"
              value={reference}
              onChange={(e) => onReferenceChange(e.target.value.toUpperCase())}
              placeholder="ABC123"
              inputProps={{ maxLength: 6 }}
              fullWidth
              sx={{
                '& input': {
                  textAlign: 'center',
                  fontSize: '1.125rem',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                },
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              El código de 6 caracteres que recibiste por WhatsApp o email
            </p>
          </div>

          <div className="fade-left-fast">
            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="tu@email.com"
              fullWidth
            />
            <p className="mt-1 text-xs text-gray-500">El email con el que hiciste la reserva</p>
          </div>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              textTransform: 'none',
              minHeight: 48,
            }}
            className="fade-up-normal"
          >
            Buscar reserva
          </Button>
        </div>
      </form>

      {/* Back to home */}
      <div className="mt-6 text-center fade-up-slow">
        <Button
          onClick={onGoHome}
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
          }}
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};

export default LookupForm;
