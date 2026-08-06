import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";
import OnboardingPage from "@/pages/auth/OnboardingPage";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import ServicesPage from "@/pages/dashboard/ServicesPage";
import StaffPage from "@/pages/dashboard/StaffPage";
import AppointmentsPage from "@/pages/dashboard/AppointmentsPage";
import CustomersPage from "@/pages/dashboard/CustomersPage";
import ReviewsPage from "@/pages/dashboard/ReviewsPage";
import AnalyticsPage from "@/pages/dashboard/AnalyticsPage";
import ReportsPage from "@/pages/dashboard/ReportsPage";
import FeedManagePage from "@/pages/dashboard/FeedManagePage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import POSPage from "@/pages/pos/POSPage";
import SalonPublicPage from "@/pages/public/SalonPublicPage";
import LandingPage from "@/pages/public/LandingPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/shared/AdminProtectedRoute";
import ClientLayout from "@/pages/client/ClientLayout";
import ClientDashboardHome from "@/pages/client/ClientDashboardHome";
import ClientHistoryPage from "@/pages/client/ClientHistoryPage";
import ClientNotificationsPage from "@/pages/client/ClientNotificationsPage";
import ClientProfilePage from "@/pages/client/ClientProfilePage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverviewPage from "@/pages/admin/AdminOverviewPage";
import AdminTenantsPage from "@/pages/admin/AdminTenantsPage";
import AdminPaymentsPage from "@/pages/admin/AdminPaymentsPage";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<OnboardingPage />} />
      <Route path="/salon/:slug" element={<SalonPublicPage />} />

      <Route path="/account" element={<ClientLayout />}>
        <Route index element={<ClientDashboardHome />} />
        <Route path="history" element={<ClientHistoryPage />} />
        <Route path="notifications" element={<ClientNotificationsPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="feed" element={<FeedManagePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/pos" element={<DashboardLayout />}>
          <Route index element={<POSPage />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="tenants" element={<AdminTenantsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
