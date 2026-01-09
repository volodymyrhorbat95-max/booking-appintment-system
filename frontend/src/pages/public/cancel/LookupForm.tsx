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
            <label className="block text-sm font-medium text-gray-700">Código de reserva</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => onReferenceChange(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-mono uppercase tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              El código de 6 caracteres que recibiste por WhatsApp o email
            </p>
          </div>

          <div className="fade-left-fast">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="tu@email.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">El email con el que hiciste la reserva</p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 fade-up-normal"
          >
            Buscar reserva
          </button>
        </div>
      </form>

      {/* Back to home */}
      <div className="mt-6 text-center fade-up-slow">
        <button
          type="button"
          onClick={onGoHome}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default LookupForm;
