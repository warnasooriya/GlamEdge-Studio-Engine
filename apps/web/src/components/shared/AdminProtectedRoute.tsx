import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/redux";

export function AdminProtectedRoute() {
  const token = useAppSelector((s) => s.adminAuth.token);
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
