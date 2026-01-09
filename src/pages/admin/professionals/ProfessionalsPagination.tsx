interface ProfessionalsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const ProfessionalsPagination = ({
  page,
  totalPages,
  total,
  onPageChange
}: ProfessionalsPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between fade-up-normal">
      <div className="text-sm text-gray-500 fade-left-fast">
        Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, total)} de {total}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed fade-right-fast"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed zoom-in-fast"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ProfessionalsPagination;
