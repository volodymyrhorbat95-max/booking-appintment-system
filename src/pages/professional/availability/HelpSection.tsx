const HelpSection = () => {
  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">Consejos</h3>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        <li className="fade-right-fast">• Puedes configurar múltiples horarios por día (ej: mañana y tarde)</li>
        <li className="fade-left-fast">• Los pacientes solo podrán reservar en los horarios que configures</li>
        <li className="fade-right-normal">• Recuerda bloquear fechas específicas para vacaciones o días libres</li>
      </ul>
    </div>
  );
};

export default HelpSection;
