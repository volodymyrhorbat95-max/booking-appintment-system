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
          <button
            type="button"
            onClick={onStartFree}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 fade-left-fast"
          >
            Comenzar Gratis
          </button>
          <button
            type="button"
            onClick={onAdminAccess}
            className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 fade-right-fast"
          >
            Acceso Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
