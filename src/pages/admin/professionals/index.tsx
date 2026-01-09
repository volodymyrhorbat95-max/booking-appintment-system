import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getProfessionals,
  suspendProfessional,
  activateProfessional,
  clearError,
  clearSuccessMessage
} from '../../../store/slices/adminSlice';
import ProfessionalsHeader from './ProfessionalsHeader';
import ProfessionalsFilters from './ProfessionalsFilters';
import ProfessionalsTable from './ProfessionalsTable';
import ProfessionalsPagination from './ProfessionalsPagination';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const AdminProfessionalsPage = () => {
  const dispatch = useAppDispatch();
  const { professionals, professionalsPagination, error, successMessage } = useAppSelector((state) => state.admin);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Load professionals
  useEffect(() => {
    dispatch(getProfessionals({ search, status: statusFilter, page, limit: 10 }));
  }, [dispatch, search, statusFilter, page]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    dispatch(getProfessionals({ search, status: statusFilter, page: 1, limit: 10 }));
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Handle suspend
  const handleSuspend = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas suspender a ${name}?`)) {
      await dispatch(suspendProfessional({ id }));
    }
  };

  // Handle activate
  const handleActivate = async (id: string) => {
    await dispatch(activateProfessional(id));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <ProfessionalsHeader error={error} successMessage={successMessage} />

      {/* Filters */}
      <ProfessionalsFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={handleStatusFilterChange}
        onSubmit={handleSearch}
      />

      {/* Professionals Table */}
      <ProfessionalsTable
        professionals={professionals}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
      />

      {/* Pagination */}
      {professionalsPagination && (
        <ProfessionalsPagination
          page={page}
          totalPages={professionalsPagination.totalPages}
          total={professionalsPagination.total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default AdminProfessionalsPage;
