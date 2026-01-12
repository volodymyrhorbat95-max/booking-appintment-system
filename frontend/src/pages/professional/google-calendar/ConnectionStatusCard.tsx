import { Button } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

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
            <CalendarMonthIcon sx={{ fontSize: 24, color: 'rgb(37, 99, 235)' }} />
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
            <Button
              variant="outlined"
              color="error"
              onClick={onDisconnect}
            >
              Desconectar
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={onConnect}
            >
              Conectar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusCard;
