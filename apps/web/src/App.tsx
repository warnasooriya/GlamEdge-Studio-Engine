import { Navigate, Route, Routes } from "react-router-dom";
import OnboardingPage from "@/pages/auth/OnboardingPage";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import ServicesPage from "@/pages/dashboard/ServicesPage";
import StaffPage from "@/pages/dashboard/StaffPage";
import AppointmentsPage from "@/pages/dashboard/AppointmentsPage";
import FeedManagePage from "@/pages/dashboard/FeedManagePage";
import POSPage from "@/pages/pos/POSPage";
import SalonPublicPage from "@/pages/public/SalonPublicPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<OnboardingPage />} />
      <Route path="/salon/:slug" element={<SalonPublicPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="feed" element={<FeedManagePage />} />
        </Route>
        <Route path="/pos" element={<DashboardLayout />}>
          <Route index element={<POSPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
