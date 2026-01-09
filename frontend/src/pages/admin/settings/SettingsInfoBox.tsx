const SettingsInfoBox = () => {
  return (
    <div className="mt-6 rounded-lg bg-blue-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-blue-900 fade-down-fast">Nota</h3>
      <p className="mt-1 text-sm text-blue-700 fade-left-normal">
        Los cambios en la configuración regional solo afectan a nuevos usuarios.
        Los profesionales existentes mantienen su configuración actual.
      </p>
    </div>
  );
};

export default SettingsInfoBox;
