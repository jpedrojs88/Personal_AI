import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { BillingStatus, ProgressHistory } from "../types";

const periodOptions = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "180 dias", value: 180 },
  { label: "Tudo", value: "all" },
] as const;

function MiniLineChart({
  values,
  stroke,
}: {
  values: number[];
  stroke: string;
}) {
  if (!values.length) {
    return <div className="chart-empty">Adicione registros para visualizar a curva.</div>;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="mini-chart" preserveAspectRatio="none" viewBox="0 0 100 100">
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function ProgressPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [periodDays, setPeriodDays] = useState<(typeof periodOptions)[number]["value"]>(30);
  const [comparisonExercise, setComparisonExercise] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [loadKg, setLoadKg] = useState("");
  const [reps, setReps] = useState("");
  const billingQuery = useQuery({
    queryKey: ["billing-status", token],
    queryFn: () => apiRequest<BillingStatus>("/billing/status", { token }),
  });
  const billing = billingQuery.data;
  const premiumHistoryEnabled = billing?.features.fullHistory ?? false;
  const comparisonEnabled = billing?.features.comparisonEnabled ?? false;

  const historyQuery = useQuery({
    queryKey: [
      "progress-history",
      token,
      periodDays,
      comparisonExercise,
      premiumHistoryEnabled,
      comparisonEnabled,
    ],
    enabled: !billingQuery.isLoading,
    queryFn: () => {
      const params = new URLSearchParams();
      const effectivePeriod =
        premiumHistoryEnabled || periodDays === 7 || periodDays === 30 ? periodDays : 30;

      if (effectivePeriod !== "all") {
        params.set("periodDays", String(effectivePeriod));
      }

      if (comparisonEnabled && comparisonExercise) {
        params.set("exerciseName", comparisonExercise);
      }

      const suffix = params.toString() ? `?${params.toString()}` : "";
      return apiRequest<ProgressHistory>(`/progress/history${suffix}`, { token });
    },
  });

  useEffect(() => {
    if (premiumHistoryEnabled) {
      return;
    }

    if (periodDays === 90 || periodDays === 180 || periodDays === "all") {
      setPeriodDays(30);
    }
  }, [periodDays, premiumHistoryEnabled]);

  useEffect(() => {
    if (comparisonEnabled) {
      return;
    }

    if (comparisonExercise) {
      setComparisonExercise("");
    }
  }, [comparisonEnabled, comparisonExercise]);

  const weightMutation = useMutation({
    mutationFn: () =>
      apiRequest("/progress/weight", {
        method: "POST",
        token,
        body: JSON.stringify({ weightKg: Number(weightKg) }),
      }),
    onSuccess: () => {
      setWeightKg("");
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const loadMutation = useMutation({
    mutationFn: () =>
      apiRequest("/progress/load", {
        method: "POST",
        token,
        body: JSON.stringify({
          exerciseName,
          loadKg: Number(loadKg),
          reps: reps ? Number(reps) : undefined,
        }),
      }),
    onSuccess: () => {
      setExerciseName("");
      setLoadKg("");
      setReps("");
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const handleWeightSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    weightMutation.mutate();
  };

  const handleLoadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadMutation.mutate();
  };

  const weightValues = [...(historyQuery.data?.weights ?? [])].reverse().map((entry) => entry.weightKg);
  const loadValues = [...(historyQuery.data?.loads ?? [])]
    .reverse()
    .slice(-8)
    .map((entry) => entry.loadKg);
  const comparisonValues = historyQuery.data?.exerciseComparison?.entries.map((entry) => entry.loadKg) ?? [];
  const summary = historyQuery.data?.summary;
  const weightDeltaLabel =
    summary?.weightDeltaKg === null || summary?.weightDeltaKg === undefined
      ? "Sem comparacao recente"
      : summary.weightDeltaKg === 0
        ? "Sem variacao desde o ultimo registro"
        : `${summary.weightDeltaKg > 0 ? "+" : ""}${summary.weightDeltaKg} kg desde a ultima pesagem`;

  return (
    <section className="page stack-lg">
      <div className="hero-card">
        <p className="eyebrow">Evolucao</p>
        <h2>Acompanhe peso, cargas e consistencia</h2>
        <p>Use esses registros para observar tendencia, nao como diagnostico ou promessa.</p>
      </div>

      <article className="card stack">
        <div className="row-between">
          <div>
            <p className="eyebrow">Filtros</p>
            <h3>Recorte de analise</h3>
          </div>
          <span className="pill">
            {periodDays === "all" ? "Historico completo" : `Ultimos ${periodDays} dias`}
          </span>
        </div>

        <div className="choice-row choice-row--scroll">
          {periodOptions.map((option) => (
            <button
              key={String(option.value)}
              className={
                periodDays === option.value
                  ? "chip chip--active"
                  : !premiumHistoryEnabled &&
                      (option.value === 90 || option.value === 180 || option.value === "all")
                    ? "chip chip--locked"
                    : "chip"
              }
              disabled={
                !premiumHistoryEnabled &&
                (option.value === 90 || option.value === 180 || option.value === "all")
              }
              onClick={() => setPeriodDays(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Comparar exercicio</span>
          <select
            disabled={!comparisonEnabled}
            onChange={(event) => setComparisonExercise(event.target.value)}
            value={comparisonExercise}
          >
            <option value="">Selecione um exercicio</option>
            {historyQuery.data?.availableExercises.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {!premiumHistoryEnabled || !comparisonEnabled ? (
          <div className="premium-inline-note">
            <p>
              O plano Gratuito mostra o historico basico e bloqueia comparativos avancados de
              exercicios.
            </p>
            <Link className="ghost-link" to="/app/plans">
              Liberar Premium
            </Link>
          </div>
        ) : null}
      </article>

      <div className="grid-cards grid-cards--triple">
        <article className="card stat-card">
          <span>Peso atual</span>
          <strong>{summary?.currentWeightKg !== null ? `${summary?.currentWeightKg} kg` : "--"}</strong>
          <small>{weightDeltaLabel}</small>
        </article>
        <article className="card stat-card">
          <span>Maior carga recente</span>
          <strong>{summary?.strongestLoadKg !== null ? `${summary?.strongestLoadKg} kg` : "--"}</strong>
          <small>{summary?.strongestExercise ?? "Melhor registro salvo"}</small>
        </article>
        <article className="card stat-card">
          <span>Check-ins na semana</span>
          <strong>{summary?.weeklyCheckIns ?? 0}</strong>
          <small>{summary?.totalCheckIns ?? 0} registros totais de treino</small>
        </article>
      </div>

      <div className="grid-cards grid-cards--history">
        <form className="card stack" onSubmit={handleWeightSubmit}>
          <h3>Registrar peso</h3>
          <label className="field">
            <span>Peso atual (kg)</span>
            <input
              onChange={(event) => setWeightKg(event.target.value)}
              step="0.1"
              type="number"
              value={weightKg}
            />
          </label>
          <button className="primary-button primary-button--small" type="submit">
            {weightMutation.isPending ? "Salvando..." : "Salvar peso"}
          </button>
        </form>

        <form className="card stack" onSubmit={handleLoadSubmit}>
          <h3>Registrar carga</h3>
          <label className="field">
            <span>Exercicio</span>
            <input onChange={(event) => setExerciseName(event.target.value)} value={exerciseName} />
          </label>
          <div className="grid-two">
            <label className="field">
              <span>Carga</span>
              <input onChange={(event) => setLoadKg(event.target.value)} type="number" value={loadKg} />
            </label>
            <label className="field">
              <span>Reps</span>
              <input onChange={(event) => setReps(event.target.value)} type="number" value={reps} />
            </label>
          </div>
          <button className="primary-button primary-button--small" type="submit">
            {loadMutation.isPending ? "Salvando..." : "Salvar carga"}
          </button>
        </form>
      </div>

      <div className="grid-cards grid-cards--history-charts">
        <article className="card stack">
          <div className="row-between">
            <h3>Evolucao de peso</h3>
            <span className="pill">{historyQuery.data?.weights.length ?? 0} registros</span>
          </div>
          <MiniLineChart stroke="#21d2ad" values={weightValues} />
          <ul className="plain-list">
            {historyQuery.data?.weights.map((entry) => (
              <li key={entry.id} className="list-row">
                <strong>{entry.weightKg} kg</strong>
                <span>{new Date(entry.loggedAt).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card stack">
          <div className="row-between">
            <h3>Evolucao de cargas</h3>
            <span className="pill">{historyQuery.data?.loads.length ?? 0} registros</span>
          </div>
          <MiniLineChart stroke="#f78c6b" values={loadValues} />
          <ul className="plain-list">
            {historyQuery.data?.loads.map((entry) => (
              <li key={entry.id} className="list-row">
                <div>
                  <strong>{entry.exerciseName}</strong>
                  <p>
                    {entry.loadKg} kg {entry.reps ? `• ${entry.reps} reps` : ""}
                  </p>
                </div>
                <span>{new Date(entry.loggedAt).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="card stack">
        <div className="row-between">
          <h3>Recordes por exercicio</h3>
          <span className="pill">{historyQuery.data?.exerciseBests.length ?? 0} destaques</span>
        </div>
        {historyQuery.data?.exerciseBests.length ? (
          <ul className="plain-list">
            {historyQuery.data.exerciseBests.map((entry) => (
              <li key={entry.exerciseName} className="list-row">
                <div>
                  <strong>{entry.exerciseName}</strong>
                  <p>
                    Recorde: {entry.bestLoadKg} kg • Ultimo: {entry.latestLoadKg} kg
                    {entry.latestReps ? ` • ${entry.latestReps} reps` : ""}
                  </p>
                </div>
                <span>{new Date(entry.loggedAt).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            Registre algumas cargas para destacar os exercicios em que voce mais evoluiu.
          </p>
        )}
      </article>

      <article className="card stack">
        <div className="row-between">
          <h3>Comparativo por exercicio</h3>
          <span className="pill">
            {historyQuery.data?.exerciseComparison?.entries.length ?? 0} registros
          </span>
        </div>

        {!comparisonEnabled ? (
          <div className="premium-lock">
            <p className="eyebrow">Recurso Premium</p>
            <h3>Comparativo detalhado de carga</h3>
            <p>Ative o Premium para comparar a progressao de um exercicio ao longo do tempo.</p>
            <Link className="primary-button primary-button--small" to="/app/plans">
              Ver Premium
            </Link>
          </div>
        ) : historyQuery.data?.exerciseComparison ? (
          <>
            <div className="grid-cards grid-cards--triple">
              <article className="card stat-card stat-card--accent">
                <span>Exercicio</span>
                <strong>{historyQuery.data.exerciseComparison.exerciseName}</strong>
                <small>Comparativo filtrado pelo periodo atual</small>
              </article>
              <article className="card stat-card">
                <span>Melhor carga</span>
                <strong>{historyQuery.data.exerciseComparison.bestLoadKg} kg</strong>
                <small>
                  {historyQuery.data.exerciseComparison.latestLoadKg !== null
                    ? `Ultimo registro: ${historyQuery.data.exerciseComparison.latestLoadKg} kg`
                    : "Sem ultimo registro"}
                </small>
              </article>
              <article className="card stat-card">
                <span>Evolucao no periodo</span>
                <strong>
                  {historyQuery.data.exerciseComparison.loadDeltaKg === null
                    ? "--"
                    : `${historyQuery.data.exerciseComparison.loadDeltaKg > 0 ? "+" : ""}${historyQuery.data.exerciseComparison.loadDeltaKg} kg`}
                </strong>
                <small>
                  {historyQuery.data.exerciseComparison.firstLoadKg !== null
                    ? `Inicio: ${historyQuery.data.exerciseComparison.firstLoadKg} kg`
                    : "Ainda sem comparacao suficiente"}
                </small>
              </article>
            </div>

            <MiniLineChart stroke="#8cb8ff" values={comparisonValues} />

            <ul className="plain-list">
              {[...historyQuery.data.exerciseComparison.entries].reverse().map((entry) => (
                <li key={entry.id} className="list-row">
                  <div>
                    <strong>{entry.loadKg} kg</strong>
                    <p>{entry.reps ? `${entry.reps} reps` : "Sem reps informadas"}</p>
                  </div>
                  <span>{new Date(entry.loggedAt).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">
            Escolha um exercicio com registros para comparar sua progressao dentro do periodo
            selecionado.
          </p>
        )}
      </article>
    </section>
  );
}
