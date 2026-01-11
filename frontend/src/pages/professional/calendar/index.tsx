import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getAppointmentsSummary,
  getAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  clearError,
  clearSuccessMessage,
  setFilters
} from '../../../store/slices/professionalAppointmentsSlice';
import type { ProfessionalAppointment } from '../../../types';
import CalendarHeader from './CalendarHeader';
import SummaryCards from './SummaryCards';
import TodayAppointments from './TodayAppointments';
import StatusIndicators from './StatusIndicators';
import AppointmentFilters from './AppointmentFilters';
import AppointmentsList from './AppointmentsList';
import AppointmentDetailModal from './AppointmentDetailModal';
import CancelAppointmentModal from './CancelAppointmentModal';
import { useWebSocketSync } from '../../../hooks/useWebSocketSync';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests
// RULE: WebSocket for real-time updates

// View modes
type ViewMode = 'dashboard' | 'list';

const ProfessionalCalendarPage = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const {
    appointments,
    pagination,
    summary,
    todayAppointments,
    filters,
    error,
    successMessage
  } = useAppSelector((state) => state.professionalAppointments);

  // WebSocket real-time updates
  useWebSocketSync();

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedAppointment, setSelectedAppointment] = useState<ProfessionalAppointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Load data on mount
  useEffect(() => {
    dispatch(getAppointmentsSummary());
  }, [dispatch]);

  // Load appointments when view mode changes to list
  useEffect(() => {
    if (viewMode === 'list') {
      dispatch(getAppointments({
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate
      }));
    }
  }, [dispatch, viewMode, filters]);

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

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
  };

  // Handle view appointment details
  const handleViewDetails = (appointment: ProfessionalAppointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  // Handle cancel appointment
  const handleCancelClick = (appointment: ProfessionalAppointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    await dispatch(cancelAppointment({
      appointmentId: selectedAppointment.id,
      reason: cancelReason || undefined
    }));

    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelReason('');

    // Refresh data
    dispatch(getAppointmentsSummary());
    if (viewMode === 'list') {
      dispatch(getAppointments({ status: filters.status }));
    }
  };

  // Handle status update
  const handleStatusUpdate = async (appointmentId: string, status: 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW') => {
    await dispatch(updateAppointmentStatus({ appointmentId, status }));

    // Refresh data
    dispatch(getAppointmentsSummary());
    if (viewMode === 'list') {
      dispatch(getAppointments({ status: filters.status }));
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    dispatch(getAppointments({ ...filters, page }));
  };

  // Close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAppointment(null);
  };

  // Close cancel modal
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  // Render dashboard view
  const renderDashboard = () => (
    <div className="space-y-6">
      <SummaryCards summary={summary} />
      <TodayAppointments
        appointments={todayAppointments}
        onViewAllClick={() => setViewMode('list')}
      />
      <StatusIndicators />
    </div>
  );

  // Render list view
  const renderList = () => (
    <div className="space-y-4">
      <AppointmentFilters filters={filters} onFilterChange={handleFilterChange} />
      <AppointmentsList
        appointments={appointments}
        pagination={pagination}
        onViewDetails={handleViewDetails}
        onCancelClick={handleCancelClick}
        onStatusUpdate={handleStatusUpdate}
        onPageChange={handlePageChange}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl zoom-in-normal">
      {/* Header Section */}
      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        error={error}
        successMessage={successMessage}
      />

      {/* Content */}
      {viewMode === 'dashboard' ? renderDashboard() : renderList()}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <CancelAppointmentModal
          patientName={selectedAppointment.patient.fullName}
          cancelReason={cancelReason}
          onReasonChange={setCancelReason}
          onConfirm={handleConfirmCancel}
          onCancel={handleCloseCancelModal}
        />
      )}
    </div>
  );
};

export default ProfessionalCalendarPage;
