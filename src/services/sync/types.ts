import type { DietPlan, Food } from '../../types/diet';
import type { Workout, WorkoutSession } from '../../types/workout';
import type { BodyEntry } from '../../types/body';

/** Um dia do app, como ele é guardado no servidor (uma linha por data). */
export interface DayRecord {
  date: string; // "2026-11-12"
  mealsDone: string[];
  waterLog: number[];
  swaps: Record<string, Food>;
  variants: Record<string, string>;
}

/** Tudo o que existe no servidor para a usuária logada. */
export interface RemoteSnapshot {
  diet?: DietPlan; // ausente = ainda não há plano salvo
  workouts?: Workout[];
  sessions: WorkoutSession[];
  days: DayRecord[];
  body: BodyEntry[];
  waterGoalMl?: number;
}

/** O que mudou no aparelho e precisa subir. */
export interface PushBatch {
  diet?: DietPlan;
  workouts?: Workout[];
  sessions: WorkoutSession[];
  days: DayRecord[];
  body: BodyEntry[];
  bodyDeletedDates: string[];
  waterGoalMl?: number;
}

/**
 * Como o motor fala com o servidor. A implementação real usa o Supabase
 * (supabaseApi.ts); os testes usam uma versão em memória.
 */
export interface SyncApi {
  hasData(userId: string): Promise<boolean>;
  pull(userId: string): Promise<RemoteSnapshot>;
  push(userId: string, batch: PushBatch): Promise<void>;
}

/** O que está pendente de envio (sobrevive a fechar o app). */
export interface Dirty {
  diet: boolean;
  workouts: boolean;
  settings: boolean;
  sessions: string[]; // ids
  days: string[]; // datas
  body: string[]; // datas
  bodyDeleted: string[]; // datas
}

export const emptyDirty = (): Dirty => ({
  diet: false,
  workouts: false,
  settings: false,
  sessions: [],
  days: [],
  body: [],
  bodyDeleted: [],
});

export const isDirty = (d: Dirty) =>
  d.diet || d.workouts || d.settings || d.sessions.length + d.days.length + d.body.length + d.bodyDeleted.length > 0;

export const pendingCount = (d: Dirty) =>
  Number(d.diet) + Number(d.workouts) + Number(d.settings) + d.sessions.length + d.days.length + d.body.length + d.bodyDeleted.length;
