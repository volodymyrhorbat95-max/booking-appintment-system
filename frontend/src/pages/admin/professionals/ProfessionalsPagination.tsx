import { Button } from '@mui/material';

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
        <Button
          variant="outlined"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="fade-right-fast"
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            px: 2,
            py: 0.5,
            color: 'rgb(55, 65, 81)',
            borderColor: 'rgb(209, 213, 219)',
            '&:hover': {
              bgcolor: 'rgb(249, 250, 251)',
              borderColor: 'rgb(209, 213, 219)'
            }
          }}
        >
          Anterior
        </Button>
        <Button
          variant="outlined"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="zoom-in-fast"
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            px: 2,
            py: 0.5,
            color: 'rgb(55, 65, 81)',
            borderColor: 'rgb(209, 213, 219)',
            '&:hover': {
              bgcolor: 'rgb(249, 250, 251)',
              borderColor: 'rgb(209, 213, 219)'
            }
          }}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default ProfessionalsPagination;
