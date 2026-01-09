interface ExternalEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

interface ExternalEventsListProps {
  events: ExternalEvent[];
}

// Format date/time for display
const formatEventTime = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const dateStr = start.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const startTimeStr = start.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const endTimeStr = end.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${dateStr} ${startTimeStr} - ${endTimeStr}`;
};

const ExternalEventsList = ({ events }: ExternalEventsListProps) => {
  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow-sm zoom-in-normal">
      <h3 className="font-medium text-gray-900 fade-down-fast">Eventos externos</h3>
      <p className="text-sm text-gray-500 fade-up-fast">
        Estos eventos de tu Google Calendar bloquean la disponibilidad en la plataforma
      </p>

      {events.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-500 fade-up-normal">
          No hay eventos externos sincronizados
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {events.slice(0, 10).map((event, index) => (
            <div
              key={event.id}
              className={`flex items-center justify-between rounded-lg border border-gray-100 p-3 ${
                index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-500">
                  {formatEventTime(event.startTime, event.endTime)}
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                Externo
              </span>
            </div>
          ))}
          {events.length > 10 && (
            <p className="text-center text-sm text-gray-500 fade-up-slow">
              Y {events.length - 10} eventos más...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExternalEventsList;
