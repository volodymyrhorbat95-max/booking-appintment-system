import { Button } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

interface QuickAction {
  label: string;
  description: string;
  onClick: () => void;
}

interface QuickActionsSectionProps {
  onViewProfessionals: () => void;
  onManagePlans: () => void;
  onSettings: () => void;
}

const QuickActionsSection = ({
  onViewProfessionals,
  onManagePlans,
  onSettings
}: QuickActionsSectionProps) => {
  const quickActions: QuickAction[] = [
    {
      label: 'Ver Profesionales',
      description: 'Gestionar cuentas de profesionales',
      onClick: onViewProfessionals
    },
    {
      label: 'Gestionar Planes',
      description: 'Crear y editar planes de suscripción',
      onClick: onManagePlans
    },
    {
      label: 'Configuración',
      description: 'Ajustes de la plataforma',
      onClick: onSettings
    }
  ];

  const icons = [
    <GroupIcon key="professionals" sx={{ fontSize: 24 }} />,
    <DescriptionIcon key="plans" sx={{ fontSize: 24 }} />,
    <SettingsIcon key="settings" sx={{ fontSize: 24 }} />
  ];

  const animations = ['fade-left-fast', 'zoom-in-normal', 'fade-right-fast'];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Acciones Rápidas</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            className={animations[index]}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              textAlign: 'left',
              textTransform: 'none',
              justifyContent: 'flex-start',
              bgcolor: 'white',
              color: 'inherit',
              boxShadow: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'rgb(249, 250, 251)',
                boxShadow: 1
              }
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 zoom-in-fast">
              {icons[index]}
            </div>
            <div>
              <p className="font-medium text-gray-900 fade-right-fast">{action.label}</p>
              <p className="text-sm text-gray-500 fade-left-fast">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsSection;
