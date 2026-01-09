const BlockedDatesHelpSection = () => {
  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">Consejos</h3>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        <li className="fade-right-fast">• Las fechas bloqueadas no estarán disponibles para reservas</li>
        <li className="fade-left-fast">• Puedes bloquear un rango de fechas para vacaciones prolongadas (máximo 90 días)</li>
        <li className="fade-right-normal">• El motivo es opcional pero útil para recordar por qué bloqueaste esa fecha</li>
        <li className="fade-left-normal">• Solo puedes bloquear fechas futuras</li>
      </ul>
    </div>
  );
};

export default BlockedDatesHelpSection;
