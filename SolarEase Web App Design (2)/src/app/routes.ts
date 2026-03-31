import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { SimulateurPage } from "./pages/SimulateurPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientDetailPage } from "./pages/ClientDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { EquipmentDetailPage } from "./pages/EquipmentDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ClientLayout } from "./components/client/ClientLayout";
import { ClientDashboardPage } from "./pages/client/ClientDashboardPage";
import { ClientProjectsPage } from "./pages/client/ClientProjectsPage";
import { ClientDocumentsPage } from "./pages/client/ClientDocumentsPage";
import { ClientBillingPage } from "./pages/client/ClientBillingPage";
import { ClientMessagesPage } from "./pages/client/ClientMessagesPage";
import { ClientProfilePage } from "./pages/client/ClientProfilePage";
import { ClientSupportPage } from "./pages/client/ClientSupportPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/contact",
    Component: ContactPage,
  },
  {
    path: "/simulateur",
    Component: SimulateurPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/projects",
    Component: ProjectsPage,
  },
  {
    path: "/projects/:id",
    Component: ProjectDetailPage,
  },
  {
    path: "/clients",
    Component: ClientsPage,
  },
  {
    path: "/clients/:id",
    Component: ClientDetailPage,
  },
  {
    path: "/catalog",
    Component: CatalogPage,
  },
  {
    path: "/catalog/:id",
    Component: EquipmentDetailPage,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
  {
    path: "/client",
    Component: ClientLayout,
    children: [
      {
        index: true,
        Component: ClientDashboardPage,
      },
      {
        path: "dashboard",
        Component: ClientDashboardPage,
      },
      {
        path: "projects",
        Component: ClientProjectsPage,
      },
      {
        path: "documents",
        Component: ClientDocumentsPage,
      },
      {
        path: "billing",
        Component: ClientBillingPage,
      },
      {
        path: "messages",
        Component: ClientMessagesPage,
      },
      {
        path: "profile",
        Component: ClientProfilePage,
      },
      {
        path: "support",
        Component: ClientSupportPage,
      },
    ],
  },
]);