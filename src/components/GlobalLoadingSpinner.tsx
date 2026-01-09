import { useAppSelector } from '../store';

// RULE: Single global loading spinner for ALL requests
// Never use individual loading spinners per component

const GlobalLoadingSpinner = () => {
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <span className="text-sm font-medium text-white">Cargando...</span>
      </div>
    </div>
  );
};

export default GlobalLoadingSpinner;
