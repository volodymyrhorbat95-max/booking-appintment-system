import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ============================================
// ROUTE-BASED CODE SPLITTING (Section 12.1 - Speed)
// Lazy loading pages reduces initial bundle size
// Each page is loaded only when needed
// ============================================

// Layouts (loaded immediately - needed for all routes)
import PublicLayout from '../layouts/PublicLayout';
import ProfessionalLayout from '../layouts/ProfessionalLayout';
import AdminLayout from '../layouts/AdminLayout';

// Components (loaded immediately - small and shared)
import ProtectedRoute from '../components/ProtectedRoute';

// Types
import { UserRole } from '../types';

// ============================================
// LAZY LOADED PAGES
// Using React.lazy() for code splitting
// ============================================

// Public pages (most frequently accessed - prioritized)
const HomePage = lazy(() => import('../pages/public/home'));
const BookingPage = lazy(() => import('../pages/public/booking'));
const CancelBookingPage = lazy(() => import('../pages/public/cancel'));

// Login pages
const AdminLoginPage = lazy(() => import('../pages/admin/login'));
const ProfessionalLoginPage = lazy(() => import('../pages/professional/login'));

// Professional pages (loaded when professional logs in)
const ProfessionalCalendarPage = lazy(() => import('../pages/professional/calendar'));
const ProfessionalAvailabilityPage = lazy(() => import('../pages/professional/availability'));
const ProfessionalBlockedDatesPage = lazy(() => import('../pages/professional/blocked-dates'));
const ProfessionalFormFieldsPage = lazy(() => import('../pages/professional/form-fields'));
const ProfessionalDepositPage = lazy(() => import('../pages/professional/deposit'));
const ProfessionalGoogleCalendarPage = lazy(() => import('../pages/professional/google-calendar'));
const ProfessionalRemindersPage = lazy(() => import('../pages/professional/reminders'));
const ProfessionalTemplatesPage = lazy(() => import('../pages/professional/templates'));
const ProfessionalSubscriptionPage = lazy(() => import('../pages/professional/subscription'));
const ProfessionalStatisticsPage = lazy(() => import('../pages/professional/statistics'));

// Admin pages (loaded when admin logs in)
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard'));
const AdminProfessionalsPage = lazy(() => import('../pages/admin/professionals'));
const AdminPlansPage = lazy(() => import('../pages/admin/plans'));
const AdminSettingsPage = lazy(() => import('../pages/admin/settings'));

// ============================================
// LOADING FALLBACK COMPONENT
// Shown while lazy-loaded pages are loading
// ============================================
const PageLoadingFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <p className="mt-2 text-sm text-gray-500">Cargando...</p>
    </div>
  </div>
);

// ============================================
// APP ROUTES WITH SUSPENSE
// ============================================
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/booking/:slug"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <BookingPage />
            </Suspense>
          }
        />
        <Route
          path="/cancel"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CancelBookingPage />
            </Suspense>
          }
        />
        <Route
          path="/login/admin"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />
        <Route
          path="/login/professional"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalLoginPage />
            </Suspense>
          }
        />
      </Route>

      {/* Professional routes - protected */}
      <Route
        element={
          <ProtectedRoute allowedRoles={[UserRole.PROFESSIONAL]}>
            <ProfessionalLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/professional" element={<Navigate to="/professional/calendar" replace />} />
        <Route
          path="/professional/calendar"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalCalendarPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/availability"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalAvailabilityPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/blocked-dates"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalBlockedDatesPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/google-calendar"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalGoogleCalendarPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/reminders"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalRemindersPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/templates"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalTemplatesPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/form-fields"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalFormFieldsPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/deposit"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalDepositPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/statistics"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalStatisticsPage />
            </Suspense>
          }
        />
        <Route
          path="/professional/subscription"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProfessionalSubscriptionPage />
            </Suspense>
          }
        />
      </Route>

      {/* Admin routes - protected */}
      <Route
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/professionals"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminProfessionalsPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminPlansPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminSettingsPage />
            </Suspense>
          }
        />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
