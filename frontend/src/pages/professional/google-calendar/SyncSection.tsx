import { Button } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';

interface SyncSectionProps {
  lastSynced: number | null;
  onSync: () => void;
}

const SyncSection = ({ lastSynced, onSync }: SyncSectionProps) => {
  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow-sm fade-left-normal">
      <div className="flex items-center justify-between">
        <div className="fade-right-fast">
          <h3 className="font-medium text-gray-900">Sincronización</h3>
          <p className="text-sm text-gray-500 fade-up-fast">
            {lastSynced
              ? `Última sincronización: ${new Date(lastSynced).toLocaleString('es-AR')}`
              : 'Sincroniza los eventos de tu Google Calendar'}
          </p>
        </div>
        <Button
          variant="outlined"
          onClick={onSync}
          startIcon={<SyncIcon />}
        >
          Sincronizar ahora
        </Button>
      </div>
    </div>
  );
};

export default SyncSection;
