import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CARDIO_WORKOUT_ID, type CardioMachine, type Effort, type Schedule, type SetLog, type Suggestion, type Workout, type WorkoutSession } from '../types/workout';
import type { StretchRoutine } from '../data/stretchRoutines';
import { defaultSchedule, defaultStretches, defaultWorkouts } from '../data';
import { suggestLoad } from '../lib/loadSuggestion';
import { newId } from '../lib/id';

interface WorkoutState {
  workouts: Workout[];
  schedule: Schedule; // agenda por data
  stretches: StretchRoutine[]; // rotinas de alongamento
  sessions: WorkoutSession[]; // finalizadas, mais recente primeiro
  active: WorkoutSession | null; // treino em andamento (sobrevive a um refresh)

  saveWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  /** Agenda de um dia: ids das fichas ([] = descanso) ou null = sem agenda (usa os dias da semana). */
  setScheduleDay: (date: string, ids: string[] | null) => void;

  startSession: (workoutId: string) => void;
  logSet: (exerciseId: string, set: SetLog) => void;
  undoSet: (exerciseId: string) => void;
  cancelSession: () => void;
  /** Registra o cardio feito depois do exercício N (0 minutos = pulou). */
  logCardio: (afterExercise: number, minutes: number, machine?: CardioMachine) => void;
  /** Cardio avulso (sem ficha): vira uma sessão finalizada própria. */
  logStandaloneCardio: (machine: CardioMachine, minutes: number, endedAt?: Date) => WorkoutSession;
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
      schedule: defaultSchedule,
      stretches: defaultStretches,
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

      setScheduleDay: (date, ids) =>
        set((s) => {
          const schedule = { ...s.schedule };
          if (ids === null) delete schedule[date];
          else schedule[date] = ids;
          return { schedule };
        }),

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

      logCardio: (afterExercise, minutes, machine) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  cardio: { ...s.active.cardio, [afterExercise]: minutes },
                  ...(machine && minutes > 0 ? { cardioMachines: { ...s.active.cardioMachines, [afterExercise]: machine } } : {}),
                },
              }
            : {},
        ),

      logStandaloneCardio: (machine, minutes, endedAt = new Date()) => {
        const session: WorkoutSession = {
          id: newId(),
          workoutId: CARDIO_WORKOUT_ID,
          startedAt: new Date(endedAt.getTime() - minutes * 60000).toISOString(),
          finishedAt: endedAt.toISOString(),
          logs: {},
          cardio: { 0: minutes },
          cardioMachines: { 0: machine },
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return session;
      },

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
        return { workouts: defaultWorkouts, schedule: defaultSchedule, stretches: defaultStretches, sessions: s.sessions ?? [], active: null } as unknown as WorkoutState;
      },
    },
  ),
);

export const effortLabel: Record<Effort, string> = { facil: 'Fácil', ok: 'Ok', dificil: 'Difícil' };
