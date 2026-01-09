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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Plataforma
          </label>
          <input
            type="text"
            value={platformName}
            onChange={(e) => onChange('platformName', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Mi Plataforma de Citas"
          />
        </div>

        {/* Support Email */}
        <div className="fade-left-fast">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de Soporte
          </label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => onChange('supportEmail', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="soporte@ejemplo.com"
          />
          <p className="mt-1 text-xs text-gray-500 fade-up-normal">
            Este email se mostrará a los usuarios para contactar soporte
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsSection;
