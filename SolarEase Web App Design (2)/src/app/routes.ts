import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { SimulateurPage } from "./pages/SimulateurPage";
import { TarifsPage } from "./pages/TarifsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectMessagesPage } from "./pages/ProjectMessagesPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientDetailPage } from "./pages/ClientDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { InstallersPage } from "./pages/InstallersPage";
import { EquipmentDetailPage } from "./pages/EquipmentDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { QuotesPage } from "./pages/QuotesPage";
import { QuoteDetailPage } from "./pages/QuoteDetailPage";
import { InstallerInvoicesPage } from "./pages/InstallerInvoicesPage";
import AdminRequestsPage from "./pages/AdminRequestsPage";
import AdminSupportTicketsPage from "./pages/AdminSupportTicketsPage";
import { ClientLayout } from "./components/client/ClientLayout";
import { ClientDashboardPage } from "./pages/client/ClientDashboardPage";
import { ClientProjectsPage } from "./pages/client/ClientProjectsPage";
import { ClientBillingPage } from "./pages/client/ClientBillingPage";
import { ClientMessagesPage } from "./pages/client/ClientMessagesPage";
import { ClientProfilePage } from "./pages/client/ClientProfilePage";
import { ClientSupportPage } from "./pages/client/ClientSupportPage";
import { ClientNotificationsPage } from "./pages/client/ClientNotificationsPage";
import { ClientProjectDetailPage } from "./pages/client/ClientProjectDetailPage";
import { ClientQuotesPage } from "./pages/client/ClientQuotesPage";
import { ClientQuoteDetailPage } from "./pages/client/ClientQuoteDetailPage";
import { ClientRequestsPage } from "./pages/client/ClientRequestsPage";
import { ClientRequestPage } from "./pages/client/ClientRequestPage";

import { CompanyRegisterPage } from "./pages/CompanyRegisterPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OTPVerificationPage } from "./pages/OTPVerificationPage";

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
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/company-register",
    Component: CompanyRegisterPage,
  },
  {
    path: "/verify-otp",
    Component: OTPVerificationPage,
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
    path: "/tarifs",
    Component: TarifsPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/installer/dashboard",
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
    path: "/projects/:id/messages",
    Component: ProjectMessagesPage,
  },
  {
    path: "/clients",
    Component: ClientsPage,
  },
  {
    path: "/installers",
    Component: InstallersPage,
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
    path: "/quotes",
    Component: QuotesPage,
  },
  {
    path: "/quotes/:id",
    Component: QuoteDetailPage,
  },
  {
    path: "/requests",
    Component: AdminRequestsPage,
  },
  {
    path: "/support-tickets",
    Component: AdminSupportTicketsPage,
  },
  {
    path: "/invoices",
    Component: InstallerInvoicesPage,
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
        path: "projects/:id",
        Component: ClientProjectDetailPage,
      },
      {
        path: "projects/:id/messages",
        Component: ProjectMessagesPage,
      },
      {
        path: "billing",
        Component: ClientBillingPage,
      },
      {
        path: "quotes",
        Component: ClientQuotesPage,
      },
      {
        path: "quotes/:id",
        Component: ClientQuoteDetailPage,
      },
      {
        path: "messages",
        Component: ClientMessagesPage,
      },
      {
        path: "notifications",
        Component: ClientNotificationsPage,
      },
      {
        path: "requests",
        Component: ClientRequestsPage,
      },
      {
        path: "request/new",
        Component: ClientRequestPage,
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