interface ConnectionStatusCardProps {
  connected: boolean;
  calendarId: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConnectionStatusCard = ({
  connected,
  calendarId,
  onConnect,
  onDisconnect
}: ConnectionStatusCardProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm fade-right-normal">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 fade-left-fast">
          {/* Google Calendar icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 zoom-in-fast">
            <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
          </div>

          <div className="fade-up-fast">
            <h2 className="font-medium text-gray-900">Google Calendar</h2>
            <p className="text-sm text-gray-500">
              {connected ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Conectado
                  {calendarId && <span className="text-gray-400">({calendarId})</span>}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  No conectado
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="zoom-in-normal">
          {connected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Desconectar
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Conectar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusCard;
