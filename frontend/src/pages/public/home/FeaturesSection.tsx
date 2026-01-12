import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SyncIcon from '@mui/icons-material/Sync';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import SmartphoneIcon from '@mui/icons-material/Smartphone';

const features = [
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 24 }} />,
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Agenda Online 24/7',
    description: 'Tus pacientes pueden reservar citas en cualquier momento desde cualquier dispositivo.',
    animation: 'fade-up-fast'
  },
  {
    icon: <ChatBubbleOutlineIcon sx={{ fontSize: 24 }} />,
    iconBg: 'bg-green-100 text-green-600',
    title: 'Recordatorios WhatsApp',
    description: 'Recordatorios automáticos vía WhatsApp para reducir ausencias y cancelaciones.',
    animation: 'fade-down-fast'
  },
  {
    icon: <SyncIcon sx={{ fontSize: 24 }} />,
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Sincronización Google Calendar',
    description: 'Sincronización bidireccional en tiempo real con tu Google Calendar.',
    animation: 'fade-right-fast'
  },
  {
    icon: <AttachMoneyIcon sx={{ fontSize: 24 }} />,
    iconBg: 'bg-yellow-100 text-yellow-600',
    title: 'Cobro de Señas',
    description: 'Cobra una seña para confirmar las reservas y reduce las ausencias.',
    animation: 'fade-left-normal'
  },
  {
    icon: <BarChartIcon sx={{ fontSize: 24 }} />,
    iconBg: 'bg-red-100 text-red-600',
    title: 'Estadísticas',
    description: 'Visualiza tus métricas de citas, confirmaciones y cancelaciones.',
    animation: 'zoom-in-normal'
  },
  {
    icon: <SmartphoneIcon sx={{ fontSize: 24 }} />,
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
