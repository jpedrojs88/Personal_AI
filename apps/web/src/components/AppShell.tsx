import { useQuery } from "@tanstack/react-query";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { apiRequest } from "../lib/api";
import type { Profile } from "../types";

const navItems = [
  { to: "/app", label: "Inicio", icon: "HM" },
  { to: "/app/workout", label: "Treino", icon: "TR" },
  { to: "/app/progress", label: "Historico", icon: "EV" },
  { to: "/app/chat", label: "Coach", icon: "IA" },
  { to: "/app/profile", label: "Perfil", icon: "PF" },
];

export function AppShell() {
  const { token, user, logout } = useAuth();
  const location = useLocation();

  const profileQuery = useQuery({
    queryKey: ["profile", token],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<{ profile: Profile | null; displayName: string }>("/profile/me", {
        token,
      }),
    retry: 1,
    staleTime: 60_000,
  });

  if (profileQuery.isLoading) {
    return <div className="screen-centered">Carregando seu treino...</div>;
  }

  if (profileQuery.isError) {
    return (
      <div className="screen-centered stack">
        <p>Nao foi possivel carregar seu perfil agora. Tente entrar novamente.</p>
        <button className="ghost-button" onClick={logout} type="button">
          Sair
        </button>
      </div>
    );
  }

  if (!profileQuery.data?.profile && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  const profile = profileQuery.data?.profile ?? null;
  const trainingLabel =
    profile?.trainingLocation === "home"
      ? "Casa"
      : profile?.trainingLocation === "gym"
        ? "Academia"
        : "Plano";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__identity">
          <p className="eyebrow">Personal IA</p>
          <h1>{user?.displayName ?? "Atleta"}</h1>
          <p className="topbar__meta">
            {profile
              ? `${trainingLabel} • ${profile.trainingDays.length} dias na semana`
              : "Configure seu plano"}
          </p>
        </div>
        <button className="ghost-button" onClick={logout} type="button">
          Sair
        </button>
      </header>

      <main className="main-content">
        <Outlet context={{ profile }} />
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              isActive ? "bottom-nav__item bottom-nav__item--active" : "bottom-nav__item"
            }
            to={item.to}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
