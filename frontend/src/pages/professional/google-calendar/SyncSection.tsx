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
        <button
          type="button"
          onClick={onSync}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 zoom-in-fast"
        >
          Sincronizar ahora
        </button>
      </div>
    </div>
  );
};

export default SyncSection;
