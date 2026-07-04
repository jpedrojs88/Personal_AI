import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatPage } from "./pages/ChatPage";
import { ContactPage } from "./pages/ContactPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PlansPage } from "./pages/PlansPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProgressPage } from "./pages/ProgressPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";
import { WorkoutPage } from "./pages/WorkoutPage";

export function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<PrivacyPolicyPage />} path="/privacidade" />
      <Route element={<TermsOfUsePage />} path="/termos" />
      <Route element={<ContactPage />} path="/contato" />
      <Route
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
        path="/onboarding"
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
        path="/app"
      >
        <Route element={<DashboardPage />} index />
        <Route element={<WorkoutPage />} path="workout" />
        <Route element={<ProgressPage />} path="progress" />
        <Route element={<ChatPage />} path="chat" />
        <Route element={<PlansPage />} path="plans" />
        <Route element={<ProfilePage />} path="profile" />
      </Route>
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}
