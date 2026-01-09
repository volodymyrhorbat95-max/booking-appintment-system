const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Agenda Online 24/7',
    description: 'Tus pacientes pueden reservar citas en cualquier momento desde cualquier dispositivo.',
    animation: 'fade-up-fast'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    iconBg: 'bg-green-100 text-green-600',
    title: 'Recordatorios WhatsApp',
    description: 'Recordatorios automáticos vía WhatsApp para reducir ausencias y cancelaciones.',
    animation: 'fade-down-fast'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Sincronización Google Calendar',
    description: 'Sincronización bidireccional en tiempo real con tu Google Calendar.',
    animation: 'fade-right-fast'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-yellow-100 text-yellow-600',
    title: 'Cobro de Señas',
    description: 'Cobra una seña para confirmar las reservas y reduce las ausencias.',
    animation: 'fade-left-normal'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    iconBg: 'bg-red-100 text-red-600',
    title: 'Estadísticas',
    description: 'Visualiza tus métricas de citas, confirmaciones y cancelaciones.',
    animation: 'zoom-in-normal'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: 'bg-indigo-100 text-indigo-600',
    title: 'Diseño Mobile-First',
    description: 'Funciona perfectamente en celulares, tablets y computadoras.',
    animation: 'fade-right-normal'
  }
];

const FeaturesSection = () => {
  return (
    <div className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 fade-down-fast">
            Todo lo que necesitas para automatizar tu agenda
          </h2>
          <p className="mt-4 text-lg text-gray-600 fade-up-normal">
            Ahorra tiempo y reduce las ausencias con nuestra plataforma completa
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className={`rounded-xl bg-gray-50 p-6 ${feature.animation}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.iconBg} zoom-in-fast`}>
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 fade-right-fast">{feature.title}</h3>
              <p className="mt-2 text-gray-600 fade-left-fast">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
