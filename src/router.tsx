import { Navigate, createBrowserRouter } from "react-router";
import { ProtectedRoute, PublicOnly } from "@/features/auth/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { RootLayout, IndexRedirect } from "@/router-layout";
import { DashboardLayout } from "@/features/layout/DashboardLayout";
import { DashboardRoute, RiderDashboardRoute } from "@/features/dashboards/routes";
import {
  ActiveRidersRoute,
  AllRidersRoute,
  RiderEditRoute,
} from "@/features/riders/routes";
import { RiderEditRedirect } from "@/features/riders/RiderEditRedirect";
import { RidesRoute, RiderRidesRoute, RideViewRoute, RiderRideViewRoute } from "@/features/rides/routes";
import { UsersRoute } from "@/features/users/routes";
import ErrorBoundaryPage from "@/features/errors/ErrorBoundaryPage";
import NotFoundPage from "@/features/errors/NotFoundPage";
import ProfilePage from "@/features/account/pages/ProfilePage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <IndexRedirect /> },

      {
        element: <PublicOnly />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },

      {
        element: <DashboardLayout />,
        children: [
          {
            element: <ProtectedRoute allow={["Rider"]} />,
            children: [
              { path: "rider", element: <RiderDashboardRoute /> },
              { path: "rider/rides", element: <RiderRidesRoute /> },
              { path: "rider/rides/:rideId", element: <RiderRideViewRoute /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Admin"]} />,
            children: [
              { path: "admin", element: <DashboardRoute /> },
              { path: "admin/register", element: <Navigate to="/admin/users/new" replace /> },
              { path: "admin/users/new", element: <RegisterPage showRole backTo="/admin/users" /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              { path: "admin/active-riders", element: <ActiveRidersRoute /> },
              { path: "admin/pending-riders", element: <Navigate to="/admin/all-riders?status=pending" replace /> },
              { path: "admin/blocked-riders", element: <Navigate to="/admin/all-riders?status=blocked" replace /> },
              { path: "admin/all-riders", element: <AllRidersRoute /> },
              { path: "admin/riders/:phone/edit", element: <RiderEditRedirect /> },
              { path: "admin/users", element: <UsersRoute /> },
              { path: "admin/users/:phone/edit", element: <RiderEditRoute /> },
              { path: "admin/rides", element: <RidesRoute /> },
              { path: "admin/rides/:rideId", element: <RideViewRoute /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Operator"]} />,
            children: [{ path: "operator", element: <DashboardRoute /> }],
          },
          {
            element: <ProtectedRoute allow={["Admin", "Operator", "Rider"]} />,
            children: [{ path: "account/profile", element: <ProfilePage /> }],
          },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);