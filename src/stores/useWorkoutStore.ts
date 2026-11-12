import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Effort, SetLog, Suggestion, Workout, WorkoutSession } from '../types/workout';
import { defaultWorkouts } from '../data';
import { suggestLoad } from '../lib/loadSuggestion';
import { newId } from '../lib/id';

interface WorkoutState {
  workouts: Workout[];
  sessions: WorkoutSession[]; // finalizadas, mais recente primeiro
  active: WorkoutSession | null; // treino em andamento (sobrevive a um refresh)

  saveWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;

  startSession: (workoutId: string) => void;
  logSet: (exerciseId: string, set: SetLog) => void;
  undoSet: (exerciseId: string) => void;
  cancelSession: () => void;
  /** Registra o cardio feito depois do exercício N (0 minutos = pulou). */
  logCardio: (afterExercise: number, minutes: number) => void;
  /** Calcula as sugestões, atualiza as cargas das fichas e devolve a sessão finalizada. */
  finishSession: () => WorkoutSession | null;
}

/** Séries do exercício na última sessão finalizada em que ele apareceu. */
export function previousLogs(sessions: WorkoutSession[], exerciseId: string): SetLog[] | undefined {
  return sessions.find((s) => s.logs[exerciseId]?.length)?.logs[exerciseId];
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workouts: defaultWorkouts,
      sessions: [],
      active: null,

      saveWorkout: (workout) =>
        set((s) => {
          const exists = s.workouts.some((w) => w.id === workout.id);
          return {
            workouts: exists ? s.workouts.map((w) => (w.id === workout.id ? workout : w)) : [...s.workouts, workout],
          };
        }),

      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      startSession: (workoutId) =>
        set({ active: { id: newId(), workoutId, startedAt: new Date().toISOString(), logs: {} } }),

      logSet: (exerciseId, entry) =>
        set((s) => {
          if (!s.active) return {};
          const logs = s.active.logs[exerciseId] ?? [];
          return { active: { ...s.active, logs: { ...s.active.logs, [exerciseId]: [...logs, entry] } } };
        }),

      undoSet: (exerciseId) =>
        set((s) => {
          if (!s.active) return {};
          const logs = (s.active.logs[exerciseId] ?? []).slice(0, -1);
          return { active: { ...s.active, logs: { ...s.active.logs, [exerciseId]: logs } } };
        }),

      cancelSession: () => set({ active: null }),

      logCardio: (afterExercise, minutes) =>
        set((s) => (s.active ? { active: { ...s.active, cardio: { ...s.active.cardio, [afterExercise]: minutes } } } : {})),

      finishSession: () => {
        const { active, workouts, sessions } = get();
        if (!active) return null;
        const workout = workouts.find((w) => w.id === active.workoutId);
        if (!workout) {
          set({ active: null });
          return null;
        }

        const suggestions: Record<string, Suggestion> = {};
        const exercises = workout.exercises.map((ex) => {
          const done = active.logs[ex.id];
          if (!done?.length) return ex; // exercício pulado: nada muda
          const suggestion = suggestLoad(ex, done, previousLogs(sessions, ex.id));
          suggestions[ex.id] = suggestion;
          return { ...ex, currentLoad: suggestion.load };
        });

        const finished: WorkoutSession = { ...active, finishedAt: new Date().toISOString(), suggestions };
        set({
          active: null,
          sessions: [finished, ...sessions].slice(0, 200),
          workouts: workouts.map((w) => (w.id === workout.id ? { ...w, exercises } : w)),
        });
        return finished;
      },
    }),
    {
      name: 'workouts',
      version: 2,
      // v2 trouxe as fichas reais: troca as fichas de exemplo e mantém o histórico
      migrate: (saved) => {
        const s = (saved ?? {}) as Partial<WorkoutState>;
        return { workouts: defaultWorkouts, sessions: s.sessions ?? [], active: null } as unknown as WorkoutState;
      },
    },
  ),
);

export const effortLabel: Record<Effort, string> = { facil: 'Fácil', ok: 'Ok', dificil: 'Difícil' };
