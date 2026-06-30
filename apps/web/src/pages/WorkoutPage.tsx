import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { ExerciseGuideModal } from "../components/ExerciseGuideModal";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { TodayWorkoutResponse, WorkoutExercise } from "../types";

export function WorkoutPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [loads, setLoads] = useState<Record<string, { loadKg: string; repsCompleted: string }>>({});
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
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

  const completeMutation = useMutation({
    mutationFn: async (payload: {
      workoutExerciseId: string;
      loadKg?: number;
      repsCompleted?: number;
    }) =>
      apiRequest("/workouts/complete-exercise", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-workout", token] });
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const workout = workoutQuery.data;
  const onboardingPending = onboardingPendingQuery.data;
  const onboardingError = onboardingErrorQuery.data;
  const completedIds = new Set(workout?.completions.map((item) => item.workoutExerciseId));
  const averageRestSeconds = workout?.day.exercises.length
    ? Math.round(
        workout.day.exercises.reduce((total, exercise) => total + exercise.restSeconds, 0) /
          workout.day.exercises.length,
      )
    : 0;

  useEffect(() => {
    if (!workout) {
      return;
    }

    if (!onboardingPending && !onboardingError) {
      return;
    }

    queryClient.setQueryData(["onboarding-pending", token], false);
    queryClient.setQueryData(["onboarding-error", token], null);
  }, [onboardingError, onboardingPending, queryClient, token, workout]);

  if (workoutQuery.isLoading) {
    return <div className="screen-centered">Carregando o treino de hoje...</div>;
  }

  if (workoutQuery.isError) {
    return (
      <section className="page">
        <div className="card">
          <h2>Treino indisponivel</h2>
          <p>Nao foi possivel carregar seu treino agora. Tente novamente em instantes.</p>
        </div>
      </section>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>, exerciseId: string) => {
    event.preventDefault();

    const values = loads[exerciseId] ?? { loadKg: "", repsCompleted: "" };

    completeMutation.mutate({
      workoutExerciseId: exerciseId,
      loadKg: values.loadKg ? Number(values.loadKg) : undefined,
      repsCompleted: values.repsCompleted ? Number(values.repsCompleted) : undefined,
    });
  };

  if (!workout) {
    if (onboardingPending) {
      return (
        <section className="page">
          <div className="card stack">
            <h2>Montando seu treino inicial</h2>
            <p>
              Estamos finalizando a primeira sessao com base no seu questionario. Esta tela vai
              atualizar sozinha quando o treino estiver pronto.
            </p>
          </div>
        </section>
      );
    }

    if (onboardingError) {
      return (
        <section className="page">
          <div className="card stack">
            <h2>Treino inicial pendente</h2>
            <p>{onboardingError}</p>
          </div>
        </section>
      );
    }

    return (
      <section className="page">
        <div className="card">
          <h2>Nenhum treino ativo</h2>
          <p>Preencha o onboarding para gerar seu primeiro treino.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page stack-lg">
      <div className="hero-card hero-card--workout">
        <p className="eyebrow">Treino de hoje</p>
        <h2>{workout.day.title}</h2>
        <p>{workout.summary}</p>
        <div className="hero-inline-stats">
          <span>{workout.day.exercises.length} exercicios</span>
          <span>{workout.day.estimatedMinutes} min</span>
          <span>{workout.completions.length} check-ins</span>
        </div>
      </div>

      <div className="grid-cards grid-cards--workout">
        <article className="card stack card--highlight">
          <div className="row-between">
            <div>
              <h3>Versao completa</h3>
              <p>{workout.day.estimatedMinutes} minutos estimados</p>
            </div>
            <span className="pill">{workout.day.exercises.length} exercicios</span>
          </div>

          <ul className="exercise-list">
            {workout.day.exercises.map((exercise, index) => (
              <li
                key={exercise.id}
                className={
                  completedIds.has(exercise.id)
                    ? "exercise-card exercise-card--done"
                    : "exercise-card"
                }
              >
                <div className="row-between row-between--start">
                  <div>
                    <span className="exercise-index">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{exercise.name}</strong>
                    <p>
                      {exercise.sets} series • {exercise.reps} reps • {exercise.restSeconds}s de
                      descanso
                    </p>
                  </div>
                  <span className="pill">{exercise.muscleGroup}</span>
                </div>
                {exercise.notes ? <small>{exercise.notes}</small> : null}
                <button
                  className="ghost-button exercise-guide-trigger"
                  onClick={() => setSelectedExercise(exercise)}
                  type="button"
                >
                  Ver execucao
                </button>

                <form className="exercise-form" onSubmit={(event) => handleSubmit(event, exercise.id)}>
                  <input
                    onChange={(event) =>
                      setLoads((current) => ({
                        ...current,
                        [exercise.id]: {
                          ...current[exercise.id],
                          loadKg: event.target.value,
                        },
                      }))
                    }
                    placeholder="Carga kg"
                    type="number"
                    value={loads[exercise.id]?.loadKg ?? ""}
                  />
                  <input
                    onChange={(event) =>
                      setLoads((current) => ({
                        ...current,
                        [exercise.id]: {
                          ...current[exercise.id],
                          repsCompleted: event.target.value,
                        },
                      }))
                    }
                    placeholder="Reps"
                    type="number"
                    value={loads[exercise.id]?.repsCompleted ?? ""}
                  />
                  <button
                    className="primary-button primary-button--small"
                    disabled={completeMutation.isPending}
                    type="submit"
                  >
                    {completeMutation.isPending
                      ? "Salvando..."
                      : completedIds.has(exercise.id)
                        ? "Registrar novamente"
                        : "Fazer check-in"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </article>

        <article className="card stack workout-sidecard">
          <p className="eyebrow">Modo express</p>
          <h3>Treino mais rapido</h3>
          <p>{workout.day.quickVersion}</p>

          <div className="workout-notes">
            <div className="workout-notes__item">
              <span>Meta</span>
              <strong>Execucao limpa</strong>
            </div>
            <div className="workout-notes__item">
              <span>Descanso medio</span>
              <strong>{averageRestSeconds}s</strong>
            </div>
            <div className="workout-notes__item">
              <span>Status</span>
              <strong>{completedIds.size} concluidos</strong>
            </div>
          </div>

          <div className="coach-tip">
            <p className="eyebrow">Dica do coach</p>
            <p>Registre carga e repeticoes para manter sua progressao semanal mais clara.</p>
          </div>
        </article>
      </div>

      {selectedExercise ? (
        <ExerciseGuideModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      ) : null}
    </section>
  );
}
