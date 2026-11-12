/**
 * Conversão entre o formato do app (camelCase) e as linhas do banco (snake_case).
 * Funções puras: testadas sem precisar de banco.
 */
import type { Tables, TablesInsert } from '../database.types';
import type { WorkoutSession } from '../../types/workout';
import type { BodyEntry, MeasureKey } from '../../types/body';
import type { DayRecord } from './types';

type Json = TablesInsert<'day_logs'>['swaps'];
const asJson = (v: unknown) => v as Json;

export const dayToRow = (userId: string, d: DayRecord): TablesInsert<'day_logs'> => ({
  user_id: userId,
  date: d.date,
  meals_done: d.mealsDone,
  water_log: d.waterLog,
  swaps: asJson(d.swaps),
  variants: asJson(d.variants),
});

export const rowToDay = (r: Tables<'day_logs'>): DayRecord => ({
  date: r.date,
  mealsDone: r.meals_done ?? [],
  waterLog: r.water_log ?? [],
  swaps: (r.swaps ?? {}) as unknown as DayRecord['swaps'],
  variants: (r.variants ?? {}) as unknown as DayRecord['variants'],
});

export const sessionToRow = (userId: string, s: WorkoutSession): TablesInsert<'workout_sessions'> => ({
  id: s.id,
  user_id: userId,
  workout_id: s.workoutId,
  started_at: s.startedAt,
  finished_at: s.finishedAt ?? null,
  logs: asJson(s.logs),
  suggestions: asJson(s.suggestions ?? null),
  cardio: asJson(s.cardio ?? null),
});

export const rowToSession = (r: Tables<'workout_sessions'>): WorkoutSession => ({
  id: r.id,
  workoutId: r.workout_id,
  startedAt: new Date(r.started_at).toISOString(),
  finishedAt: r.finished_at ? new Date(r.finished_at).toISOString() : undefined,
  logs: (r.logs ?? {}) as unknown as WorkoutSession['logs'],
  suggestions: (r.suggestions ?? undefined) as unknown as WorkoutSession['suggestions'],
  cardio: (r.cardio ?? undefined) as unknown as WorkoutSession['cardio'],
});

export const bodyToRow = (userId: string, e: BodyEntry): TablesInsert<'body_entries'> => ({
  id: e.id,
  user_id: userId,
  date: e.date,
  weight_kg: e.weightKg ?? null,
  measures: asJson(e.measures ?? {}),
  deleted_at: null,
});

export const rowToBody = (r: Tables<'body_entries'>): BodyEntry => {
  const measures = (r.measures ?? {}) as unknown as Partial<Record<MeasureKey, number>>;
  return {
    id: r.id,
    date: r.date,
    weightKg: r.weight_kg === null ? undefined : Number(r.weight_kg),
    measures: Object.keys(measures).length ? measures : undefined,
  };
};
