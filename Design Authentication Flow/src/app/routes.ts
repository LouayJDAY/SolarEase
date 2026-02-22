import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OTPVerificationPage } from "./pages/OTPVerificationPage";
import { DashboardHome } from "./pages/DashboardHome";
import { ProjectsDashboard } from "./pages/ProjectsDashboard";
import { ClientsPage } from "./pages/ClientsPage";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/verify-otp",
    Component: OTPVerificationPage,
  },
  {
    path: "/dashboard",
    Component: DashboardHome,
  },
  {
    path: "/dashboard/projects",
    Component: ProjectsDashboard,
  },
  {
    path: "/dashboard/clients",
    Component: ClientsPage,
  },
  {
    path: "/dashboard/settings",
    Component: SettingsPage,
  },
]);