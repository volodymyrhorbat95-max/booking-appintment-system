import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { getDashboardStats, clearError } from '../../../store/slices/adminSlice';
import DashboardHeader from './DashboardHeader';
import DashboardStatsGrid from './DashboardStatsGrid';
import QuickActionsSection from './QuickActionsSection';
import SummaryCardsSection from './SummaryCardsSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const AdminDashboardPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dashboardStats, error } = useAppSelector((state) => state.admin);

  // Load stats on mount
  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle navigation
  const handleViewProfessionals = () => navigate('/admin/professionals');
  const handleManagePlans = () => navigate('/admin/plans');
  const handleSettings = () => navigate('/admin/settings');

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <DashboardHeader error={error} />

      {/* Stats Grid */}
      <DashboardStatsGrid stats={dashboardStats} />

      {/* Quick Actions */}
      <QuickActionsSection
        onViewProfessionals={handleViewProfessionals}
        onManagePlans={handleManagePlans}
        onSettings={handleSettings}
      />

      {/* Summary Cards */}
      <SummaryCardsSection stats={dashboardStats} />
    </div>
  );
};

export default AdminDashboardPage;
