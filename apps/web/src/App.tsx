import { Navigate, Route, Routes } from "react-router-dom";
import OnboardingPage from "@/pages/auth/OnboardingPage";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import ServicesPage from "@/pages/dashboard/ServicesPage";
import StaffPage from "@/pages/dashboard/StaffPage";
import AppointmentsPage from "@/pages/dashboard/AppointmentsPage";
import CustomersPage from "@/pages/dashboard/CustomersPage";
import FeedManagePage from "@/pages/dashboard/FeedManagePage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import POSPage from "@/pages/pos/POSPage";
import SalonPublicPage from "@/pages/public/SalonPublicPage";
import LandingPage from "@/pages/public/LandingPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import ClientLayout from "@/pages/client/ClientLayout";
import ClientDashboardHome from "@/pages/client/ClientDashboardHome";
import ClientHistoryPage from "@/pages/client/ClientHistoryPage";
import ClientNotificationsPage from "@/pages/client/ClientNotificationsPage";
import ClientProfilePage from "@/pages/client/ClientProfilePage";

export default function App() {
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
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="feed" element={<FeedManagePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/pos" element={<DashboardLayout />}>
          <Route index element={<POSPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
