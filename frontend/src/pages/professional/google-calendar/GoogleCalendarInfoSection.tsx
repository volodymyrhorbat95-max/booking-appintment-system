const GoogleCalendarInfoSection = () => {
  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 fade-up-slow">
      <h3 className="text-sm font-medium text-gray-900 fade-down-fast">Cómo funciona la sincronización</h3>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        <li className="flex items-start gap-2 fade-right-fast">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
          <span>Las citas creadas en la plataforma aparecen en tu Google Calendar</span>
        </li>
        <li className="flex items-start gap-2 fade-left-fast">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
          <span>Los eventos de tu Google Calendar bloquean horarios en la plataforma</span>
        </li>
        <li className="flex items-start gap-2 fade-right-normal">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
          <span>Los colores indican el estado: verde (confirmada), amarillo (pendiente), rojo (cancelada)</span>
        </li>
        <li className="flex items-start gap-2 fade-left-normal">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
          <span>La sincronización es bidireccional y en tiempo real</span>
        </li>
      </ul>
    </div>
  );
};

export default GoogleCalendarInfoSection;
