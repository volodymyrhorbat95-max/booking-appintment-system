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
        <button
          type="button"
          onClick={onRegister}
          className="mt-8 rounded-lg bg-white px-8 py-3 text-base font-medium text-blue-600 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 zoom-in-slow"
        >
          Registrarse con Google
        </button>
      </div>
    </div>
  );
};

export default CTASection;
