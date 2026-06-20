import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Profile, TodayWorkoutResponse } from "../types";

type OnboardingFormState = Omit<Profile, "id" | "userId">;

const weekdayOptions = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sab", value: 6 },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);
  const [form, setForm] = useState<OnboardingFormState>({
    age: 28,
    sex: "other",
    weightKg: 78,
    heightCm: 176,
    goal: "hypertrophy",
    experienceLevel: "intermediate",
    trainingDays: [1, 3, 5] as number[],
    trainingLocation: "gym",
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleDay = (day: number) => {
    setForm((current) => ({
      ...current,
      trainingDays: current.trainingDays.includes(day)
        ? current.trainingDays.filter((item) => item !== day)
        : [...current.trainingDays, day].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    const optimisticProfile: Profile = {
      id: user?.id ?? "pending-profile",
      userId: user?.id ?? "pending-profile",
      ...form,
    };

    queryClient.setQueryData(["profile", token], {
      displayName: user?.displayName ?? "Atleta",
      profile: optimisticProfile,
    });
    queryClient.setQueryData(["onboarding-pending", token], true);
    queryClient.setQueryData(["onboarding-error", token], null);
    navigate("/app", { replace: true });

    void (async () => {
      try {
        const bootstrap = await apiRequest<{
          displayName: string;
          profile: Profile;
          todayWorkout: TodayWorkoutResponse | null;
        }>("/workouts/bootstrap", {
          method: "POST",
          token,
          body: JSON.stringify(form),
        });

        queryClient.setQueryData(["profile", token], {
          displayName: bootstrap.displayName ?? user?.displayName ?? "Atleta",
          profile: bootstrap.profile,
        });
        queryClient.setQueryData(["today-workout", token], bootstrap.todayWorkout);
      } catch (error) {
        queryClient.setQueryData(
          ["onboarding-error", token],
          error instanceof Error ? error.message : "Nao foi possivel finalizar seu treino inicial.",
        );
        queryClient.setQueryData(["today-workout", token], null);
      } finally {
        queryClient.setQueryData(["onboarding-pending", token], false);
        void queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
        isSubmittingRef.current = false;
      }
    })();
  };

  return (
    <section className="page stack-lg">
      <div className="hero-card">
        <p className="eyebrow">Questionario inicial</p>
        <h2>Vamos montar o seu ponto de partida</h2>
        <p>
          Essas respostas ajudam a IA a criar um treino inicial seguro, sem prometer
          resultados nem substituir avaliacao presencial.
        </p>
      </div>

      <form className="stack-lg" onSubmit={handleSubmit}>
        <div className="progress-steps">
          <span className="progress-steps__item progress-steps__item--active">1. Corpo</span>
          <span className="progress-steps__item progress-steps__item--active">2. Objetivo</span>
          <span className="progress-steps__item progress-steps__item--active">3. Rotina</span>
        </div>

        <div className="card grid-two card--sectioned">
          <div className="section-heading">
            <p className="eyebrow">Base fisica</p>
            <h3>Seus dados atuais</h3>
          </div>

          <label className="field">
            <span>Idade</span>
            <input
              min={14}
              onChange={(event) => setForm({ ...form, age: Number(event.target.value) })}
              type="number"
              value={form.age}
            />
          </label>
          <label className="field">
            <span>Sexo</span>
            <select
              onChange={(event) =>
                setForm({ ...form, sex: event.target.value as OnboardingFormState["sex"] })
              }
              value={form.sex}
            >
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </label>
          <label className="field">
            <span>Peso (kg)</span>
            <input
              min={35}
              onChange={(event) => setForm({ ...form, weightKg: Number(event.target.value) })}
              step="0.1"
              type="number"
              value={form.weightKg}
            />
          </label>
          <label className="field">
            <span>Altura (cm)</span>
            <input
              min={130}
              onChange={(event) => setForm({ ...form, heightCm: Number(event.target.value) })}
              type="number"
              value={form.heightCm}
            />
          </label>
        </div>

        <div className="card grid-two card--sectioned">
          <div className="section-heading">
            <p className="eyebrow">Meta</p>
            <h3>Como esse plano deve trabalhar por voce</h3>
          </div>

          <label className="field">
            <span>Objetivo</span>
            <select
              onChange={(event) =>
                setForm({ ...form, goal: event.target.value as OnboardingFormState["goal"] })
              }
              value={form.goal}
            >
              <option value="hypertrophy">Hipertrofia</option>
              <option value="weight_loss">Perda de peso</option>
              <option value="strength">Forca</option>
              <option value="conditioning">Condicionamento</option>
            </select>
          </label>

          <label className="field">
            <span>Nivel</span>
            <select
              onChange={(event) =>
                setForm({
                  ...form,
                  experienceLevel: event.target.value as OnboardingFormState["experienceLevel"],
                })
              }
              value={form.experienceLevel}
            >
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediario</option>
              <option value="advanced">Avancado</option>
            </select>
          </label>

          <label className="field field--full">
            <span>Local de treino</span>
            <div className="choice-row">
              <button
                className={form.trainingLocation === "gym" ? "chip chip--active" : "chip"}
                onClick={() => setForm({ ...form, trainingLocation: "gym" })}
                type="button"
              >
                Academia
              </button>
              <button
                className={form.trainingLocation === "home" ? "chip chip--active" : "chip"}
                onClick={() => setForm({ ...form, trainingLocation: "home" })}
                type="button"
              >
                Casa
              </button>
            </div>
          </label>
        </div>

        <div className="card stack card--sectioned">
          <div className="section-heading">
            <p className="eyebrow">Agenda</p>
            <h3>Quando e onde voce consegue treinar</h3>
          </div>
          <div>
            <span className="field-label">Dias disponiveis</span>
            <p className="field-help">Escolha os dias que voce costuma conseguir treinar.</p>
          </div>
          <div className="weekday-grid">
            {weekdayOptions.map((day) => (
              <button
                key={day.value}
                className={form.trainingDays.includes(day.value) ? "chip chip--active" : "chip"}
                onClick={() => toggleDay(day.value)}
                type="button"
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card onboarding-summary">
          <div>
            <p className="eyebrow">Pronto para gerar</p>
            <h3>
              {form.trainingDays.length} dias • {form.trainingLocation === "gym" ? "Academia" : "Casa"}
            </h3>
            <p className="muted">
              Objetivo em foco: {form.goal.replace("_", " ")} com nivel {form.experienceLevel}.
            </p>
          </div>
          <button className="primary-button" type="submit">
            Gerar treino inicial
          </button>
        </div>
      </form>
    </section>
  );
}
