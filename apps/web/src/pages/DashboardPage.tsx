import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { ProgressHistory, TodayWorkoutResponse } from "../types";

const weekdayNames = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

export function DashboardPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const onboardingPendingQuery = useQuery<boolean>({
    queryKey: ["onboarding-pending", token],
    enabled: false,
    initialData: false,
  });

  const onboardingErrorQuery = useQuery<string | null>({
    queryKey: ["onboarding-error", token],
    enabled: false,
    initialData: null,
  });

  const workoutQuery = useQuery({
    queryKey: ["today-workout", token],
    queryFn: () => apiRequest<TodayWorkoutResponse | null>("/workouts/today", { token }),
  });

  const historyQuery = useQuery({
    queryKey: ["progress-history", token],
    queryFn: () => apiRequest<ProgressHistory>("/progress/history", { token }),
  });

  const todayWorkout = workoutQuery.data;
  const onboardingPending = onboardingPendingQuery.data;
  const onboardingError = onboardingErrorQuery.data;
  const latestWeight = historyQuery.data?.weights[0];
  const latestLoad = historyQuery.data?.loads[0];
  const recentCompletions = historyQuery.data?.completions ?? [];
  const weeklyCompleted = recentCompletions.length;
  const lastSevenDays = [...Array.from({ length: 7 }).keys()].map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    const total = recentCompletions.filter(
      (item) => new Date(item.completedAt).toISOString().slice(0, 10) === key,
    ).length;

    return {
      label: date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3),
      total,
    };
  });

  const streak = lastSevenDays.filter((day) => day.total > 0).length;
  const completionRate = todayWorkout?.day?.exercises?.length
    ? Math.min(
        100,
        Math.round((todayWorkout.completions.length / todayWorkout.day.exercises.length) * 100),
      )
    : 0;

  useEffect(() => {
    if (!todayWorkout) {
      return;
    }

    if (!onboardingPending && !onboardingError) {
      return;
    }

    queryClient.setQueryData(["onboarding-pending", token], false);
    queryClient.setQueryData(["onboarding-error", token], null);
  }, [onboardingError, onboardingPending, queryClient, todayWorkout, token]);

  return (
    <section className="page stack-lg">
      <div className="hero-card hero-card--dashboard">
        <div className="hero-card__content">
          <p className="eyebrow">Resumo semanal</p>
          <h2>Seu painel de treino esta pronto, {user?.displayName}.</h2>
          <p>
            Acompanhe constancia, check-ins do treino do dia e ajuste sua rotina com o coach de IA.
          </p>
        </div>
        <div className="hero-badge">
          <span>Hoje</span>
          <strong>
            {onboardingPending && !todayWorkout ? "..." : `${todayWorkout?.day?.estimatedMinutes ?? 0} min`}
          </strong>
          <small>
            {onboardingPending && !todayWorkout
              ? "Montando treino inicial"
              : todayWorkout?.day?.title ?? "Sem treino ativo"}
          </small>
        </div>
      </div>

      {onboardingError ? (
        <article className="card stack">
          <p className="eyebrow">Ajuste necessario</p>
          <h3>Seu treino inicial nao terminou de ser gerado</h3>
          <p>{onboardingError}</p>
          <Link className="primary-button primary-button--small" to="/onboarding">
            Tentar novamente
          </Link>
        </article>
      ) : null}

      <div className="grid-cards grid-cards--triple">
        <article className="card stat-card stat-card--accent">
          <span>Treinos concluidos</span>
          <strong>{weeklyCompleted}</strong>
          <small>Check-ins recentes registrados</small>
        </article>
        <article className="card stat-card">
          <span>Peso atual</span>
          <strong>{latestWeight ? `${latestWeight.weightKg} kg` : "Sem registro"}</strong>
          <small>
            {latestWeight
              ? new Date(latestWeight.loggedAt).toLocaleDateString("pt-BR")
              : "Registre para acompanhar evolucao"}
          </small>
        </article>
        <article className="card stat-card">
          <span>Sequencia semanal</span>
          <strong>{streak} dias</strong>
          <small>{latestLoad?.exerciseName ?? "Mantenha o ritmo da semana"}</small>
        </article>
      </div>

      <div className="grid-cards grid-cards--dashboard-main">
        <article className="card stack card--highlight">
          <div className="row-between">
            <div>
              <p className="eyebrow">Treino do dia</p>
              <h3>
                {onboardingPending && !todayWorkout
                  ? "Montando sua primeira sessao"
                  : todayWorkout?.day?.title ?? "Nenhum treino encontrado"}
              </h3>
            </div>
            <Link className="ghost-link" to="/app/workout">
              Abrir treino
            </Link>
          </div>

          <div className="progress-meter">
            <div className="progress-meter__label">
              <span>Check-in do treino</span>
              <strong>{completionRate}%</strong>
            </div>
            <div className="progress-meter__track">
              <div className="progress-meter__fill" style={{ width: `${completionRate}%` }} />
            </div>
          </div>

          {todayWorkout?.day?.exercises?.length ? (
            <ul className="plain-list">
              {todayWorkout.day.exercises.slice(0, 4).map((exercise) => (
                <li key={exercise.id} className="list-row">
                  <div>
                    <strong>{exercise.name}</strong>
                    <p>
                      {exercise.sets} series • {exercise.reps} reps
                    </p>
                  </div>
                  <span>{exercise.muscleGroup}</span>
                </li>
              ))}
            </ul>
          ) : onboardingPending ? (
            <p className="muted">
              Estamos montando seu treino inicial agora. Voce ja pode navegar pelo app enquanto a
              primeira sessao fica pronta.
            </p>
          ) : (
            <p className="muted">Complete o onboarding para gerar o treino inicial.</p>
          )}
        </article>

        <article className="card stack">
          <div className="row-between">
            <div>
              <p className="eyebrow">Resumo semanal</p>
              <h3>Distribuicao da semana</h3>
            </div>
            <span className="pill">{weekdayNames[new Date().getDay()]}</span>
          </div>
          <div className="weekly-bars">
            {lastSevenDays.map((day) => (
              <div key={day.label} className="weekly-bars__item">
                <div className="weekly-bars__track">
                  <div
                    className="weekly-bars__fill"
                    style={{ height: `${Math.max(18, day.total * 28)}px` }}
                  />
                </div>
                <strong>{day.total}</strong>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
          <div className="stat-row">
            <div>
              <span className="stat-row__label">Ultima carga</span>
              <strong>{latestLoad ? `${latestLoad.loadKg} kg` : "Sem carga"}</strong>
            </div>
            <div>
              <span className="stat-row__label">Dia de hoje</span>
              <strong>
                {todayWorkout?.day ? `${weekdayNames[todayWorkout.day.weekday]}` : "Sem treino"}
              </strong>
            </div>
          </div>
        </article>
      </div>

      <div className="grid-cards grid-cards--dashboard-actions">
        <article className="card stack">
          <p className="eyebrow">Proxima acao</p>
          <h3>
            {onboardingPending && !todayWorkout
              ? "Seu plano esta sendo finalizado"
              : "Treino pronto para check-in"}
          </h3>
          <p>
            {onboardingPending && !todayWorkout
              ? "Assim que o treino terminar de ser gerado, esta tela vai atualizar sozinha."
              : `${todayWorkout?.day?.exercises?.length ?? 0} exercicios esperando registro.`}
          </p>
          <Link className="primary-button primary-button--small" to="/app/workout">
            Fazer check-in
          </Link>
        </article>
        <article className="card stack">
          <p className="eyebrow">Chat com IA</p>
          <h3>Ajustes em segundos</h3>
          <p>Troque exercicios, monte uma versao expressa ou adapte o treino para viagem.</p>
          <Link className="primary-button primary-button--small" to="/app/chat">
            Conversar com a IA
          </Link>
        </article>
      </div>
    </section>
  );
}
