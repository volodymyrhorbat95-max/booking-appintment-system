import { TextField } from '@mui/material';

interface GeneralSettingsSectionProps {
  platformName: string;
  supportEmail: string;
  onChange: (field: string, value: string) => void;
}

const GeneralSettingsSection = ({
  platformName,
  supportEmail,
  onChange
}: GeneralSettingsSectionProps) => {
  return (
    <div className="border-b border-gray-100 p-6 fade-up-fast">
      <h3 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">Configuración General</h3>

      <div className="space-y-4">
        {/* Platform Name */}
        <div className="fade-right-fast">
          <TextField
            fullWidth
            label="Nombre de la Plataforma"
            value={platformName}
            onChange={(e) => onChange('platformName', e.target.value)}
            placeholder="Mi Plataforma de Citas"
            size="small"
          />
        </div>

        {/* Support Email */}
        <div className="fade-left-fast">
          <TextField
            fullWidth
            type="email"
            label="Email de Soporte"
            value={supportEmail}
            onChange={(e) => onChange('supportEmail', e.target.value)}
            placeholder="soporte@ejemplo.com"
            size="small"
            helperText="Este email se mostrará a los usuarios para contactar soporte"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsSection;
