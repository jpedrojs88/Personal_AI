import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { BillingStatus, Profile } from "../types";

const goalLabels: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  weight_loss: "Perda de peso",
  strength: "Forca",
  conditioning: "Condicionamento",
};

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediario",
  advanced: "Avancado",
};

export function ProfilePage() {
  const { token, user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", token, "page"],
    queryFn: () =>
      apiRequest<{ profile: Profile | null; displayName: string }>("/profile/me", {
        token,
      }),
  });
  const billingQuery = useQuery({
    queryKey: ["billing-status", token],
    queryFn: () => apiRequest<BillingStatus>("/billing/status", { token }),
  });

  const profile = profileQuery.data?.profile ?? null;
  const billing = billingQuery.data;
  const isPremium = billing?.effectivePlan === "PREMIUM";

  return (
    <section className="page stack-lg">
      <div className="hero-card hero-card--profile">
        <p className="eyebrow">Perfil</p>
        <h2>{user?.displayName ?? "Atleta Personal IA"}</h2>
        <p>Centralize seus dados, preferencias de treino e configuracoes da experiencia.</p>
      </div>

      <div className="grid-cards grid-cards--profile">
        <article className="card stack">
          <div className="profile-avatar">
            <span>{(user?.displayName ?? "A").slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="profile-meta">
            <strong>{user?.displayName ?? "Usuario"}</strong>
            <span>{user?.email ?? "email@personalia.app"}</span>
          </div>
        </article>

        <article className="card stack">
          <p className="eyebrow">Plano atual</p>
          <h3>{isPremium ? "Premium ativo" : "Free ativo"}</h3>
          <p>
            {billing
              ? `${billing.monthlyMessagesRemaining} mensagens com IA restantes neste ciclo`
              : "Carregando status da assinatura"}
          </p>
          <Link className="ghost-link" to="/app/plans">
            Gerenciar planos
          </Link>
        </article>
      </div>

      <article className="card stack">
        <div className="row-between">
          <h3>Dados do usuario</h3>
          <span className="pill">Conta ativa</span>
        </div>
        {profile ? (
          <div className="profile-grid">
            <div className="profile-stat">
              <span>Idade</span>
              <strong>{profile.age} anos</strong>
            </div>
            <div className="profile-stat">
              <span>Sexo</span>
              <strong>{profile.sex}</strong>
            </div>
            <div className="profile-stat">
              <span>Altura</span>
              <strong>{profile.heightCm} cm</strong>
            </div>
            <div className="profile-stat">
              <span>Peso</span>
              <strong>{profile.weightKg} kg</strong>
            </div>
            <div className="profile-stat">
              <span>Objetivo</span>
              <strong>{goalLabels[profile.goal]}</strong>
            </div>
            <div className="profile-stat">
              <span>Nivel</span>
              <strong>{levelLabels[profile.experienceLevel]}</strong>
            </div>
            <div className="profile-stat">
              <span>Local de treino</span>
              <strong>{profile.trainingLocation === "home" ? "Casa" : "Academia"}</strong>
            </div>
            <div className="profile-stat">
              <span>Dias disponiveis</span>
              <strong>{profile.trainingDays.length} por semana</strong>
            </div>
          </div>
        ) : (
          <p className="muted">Seu perfil ainda nao foi configurado.</p>
        )}
      </article>

      <article className="card stack">
        <div className="row-between">
          <h3>Configuracoes</h3>
          <span className="pill">Mobile first</span>
        </div>
        <div className="settings-list">
          <div className="settings-row">
            <div>
              <strong>Lembrete de treino</strong>
              <p>Receba uma chamada visual antes do horario habitual.</p>
            </div>
            <button className="toggle toggle--active" type="button">
              <span />
            </button>
          </div>
          <div className="settings-row">
            <div>
              <strong>Coach IA nas adaptacoes</strong>
              <p>Permitir sugestoes rapidas para treino reduzido, viagem e trocas.</p>
            </div>
            <button className="toggle toggle--active" type="button">
              <span />
            </button>
          </div>
          <div className="settings-row">
            <div>
              <strong>Resumo semanal</strong>
              <p>Mostrar cards com peso, check-ins e consistencia no dashboard.</p>
            </div>
            <button className="toggle toggle--active" type="button">
              <span />
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
