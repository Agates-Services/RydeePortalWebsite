import { useAuth } from "@/features/auth/useAuth";
import Dashboard from "@/features/dashboards/Dashboard";
import RiderDashboard from "@/features/dashboards/RiderDashboard";

export function DashboardRoute() {
  return <Dashboard />;
}

export function RiderDashboardRoute() {
  const { profile, userId } = useAuth();
  return <RiderDashboard profile={profile ?? null} userId={userId} />;
}
