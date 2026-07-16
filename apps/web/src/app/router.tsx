import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { SessionPage } from "@/features/session/pages/SessionPage";
import { TrajectoryPage } from "@/features/trajectory/pages/TrajectoryPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { GoalsPage } from "@/features/goals/pages/GoalsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/auth" replace /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/session", element: <SessionPage /> },
      { path: "/trajectory", element: <TrajectoryPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/goals", element: <GoalsPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
