/**
 * Motivação a partir dos seus próprios números: recordes, marcos, resumo da semana e medalhas.
 * De propósito, nada aqui olha o peso do corpo — só força e constância.
 */
import { CARDIO_WORKOUT_ID, type WorkoutSession } from '../types/workout';
import { toDateKey } from './date';
import { exerciseHistory } from './progress';

const maxLoad = (s: WorkoutSession, exerciseId: string) => Math.max(0, ...(s.logs[exerciseId] ?? []).map((l) => l.load));
const finished = (sessions: WorkoutSession[]) => sessions.filter((s) => s.finishedAt);

// ---------------------------------------------------------------------------
// Ao finalizar um treino
// ---------------------------------------------------------------------------

export const MILESTONES = [1, 10, 25, 50, 75, 100, 150, 200, 300, 500];

export interface SessionRecord {
  exerciseId: string;
  load: number;
  previous: number;
}

/** Exercícios em que esta sessão superou a maior carga de todas as sessões anteriores. */
export function sessionRecords(session: WorkoutSession, sessions: WorkoutSession[]): SessionRecord[] {
  const before = finished(sessions).filter((s) => s.id !== session.id && s.startedAt < session.startedAt);
  return Object.keys(session.logs)
    .map((exerciseId) => {
      const load = maxLoad(session, exerciseId);
      const previous = Math.max(0, ...before.map((s) => maxLoad(s, exerciseId)));
      return { exerciseId, load, previous };
    })
    .filter((r) => r.previous > 0 && r.load > r.previous);
}

/** Se esta sessão é o 1º, 10º, 25º… treino, devolve o número. */
export function sessionMilestone(session: WorkoutSession, sessions: WorkoutSession[]): number | null {
  const position = finished(sessions).filter((s) => s.startedAt <= session.startedAt).length;
  return MILESTONES.includes(position) ? position : null;
}

// ---------------------------------------------------------------------------
// Resumo da semana passada (segunda a domingo)
// ---------------------------------------------------------------------------

export interface WeekSummary {
  from: string; // segunda
  to: string; // domingo
  workouts: number;
  waterDays: number; // dias com a meta de água batida
  loadUps: number; // exercícios com carga maior que antes daquela semana
  cardioMinutes: number; // blocos do treino híbrido + cardio avulso
}

export function lastWeekRange(today = new Date()): { from: Date; to: Date } {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday, to: sunday };
}

export function weekSummary(
  sessions: WorkoutSession[],
  waterByDate: (date: string) => number,
  waterGoal: number,
  today = new Date(),
): WeekSummary {
  const { from, to } = lastWeekRange(today);
  const fromKey = toDateKey(from);
  const toKey = toDateKey(to);
  const inWeek = (s: WorkoutSession) => {
    const d = toDateKey(new Date(s.startedAt));
    return d >= fromKey && d <= toKey;
  };
  const done = finished(sessions);
  const weekAll = done.filter(inWeek);
  const week = weekAll.filter((s) => s.workoutId !== CARDIO_WORKOUT_ID); // treinos de musculação
  const cardioMinutes = weekAll.reduce((sum, s) => sum + Object.values(s.cardio ?? {}).reduce((a, b) => a + b, 0), 0);
  const earlier = done.filter((s) => toDateKey(new Date(s.startedAt)) < fromKey);

  const exerciseIds = new Set(week.flatMap((s) => Object.keys(s.logs)));
  let loadUps = 0;
  exerciseIds.forEach((id) => {
    const before = Math.max(0, ...earlier.map((s) => maxLoad(s, id)));
    const now = Math.max(0, ...week.map((s) => maxLoad(s, id)));
    if (before > 0 && now > before) loadUps++;
  });

  let waterDays = 0;
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) if (waterByDate(toDateKey(d)) >= waterGoal) waterDays++;

  return { from: fromKey, to: toKey, workouts: week.length, waterDays, loadUps, cardioMinutes };
}

// ---------------------------------------------------------------------------
// Medalhas de constância
// ---------------------------------------------------------------------------

/** Maior sequência de dias seguidos que cumprem a condição, entre as datas dadas. */
export function bestDayStreak(dates: string[], isDone: (date: string) => boolean): number {
  const sorted = [...new Set(dates)].filter(isDone).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = new Date(`${key}T12:00:00`);
    run = prev && Math.round((d.getTime() - prev.getTime()) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

const mondayKey = (iso: string) => {
  const d = new Date(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toDateKey(d);
};

/** Maior sequência de semanas seguidas com pelo menos `min` treinos. */
export function bestWeekStreak(sessions: WorkoutSession[], min = 3): number {
  const perWeek = new Map<string, number>();
  finished(sessions).forEach((s) => perWeek.set(mondayKey(s.startedAt), (perWeek.get(mondayKey(s.startedAt)) ?? 0) + 1));
  const weeks = [...perWeek.entries()].filter(([, n]) => n >= min).map(([w]) => w);
  return streakOfWeeks(weeks.sort());
}

function streakOfWeeks(weeks: string[]): number {
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of weeks) {
    const t = new Date(`${w}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / (7 * 864e5)) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: string; // "5 de 7"
}

interface Track {
  id: string;
  tiers: number[];
  value: number;
  title: (n: number) => string;
  description: (n: number) => string;
}

/** Para cada trilha: as medalhas conquistadas e a próxima a conquistar. */
export function badges(input: {
  sessions: WorkoutSession[];
  waterDates: string[];
  waterByDate: (date: string) => number;
  waterGoal: number;
  exerciseIds: string[];
}): Badge[] {
  const { sessions, waterDates, waterByDate, waterGoal, exerciseIds } = input;
  const evolved = exerciseIds.filter((id) => {
    const h = exerciseHistory(sessions, id);
    return h.length > 1 && Math.max(...h.map((p) => p.value)) > h[0].value;
  }).length;

  const tracks: Track[] = [
    {
      id: 'treinos',
      tiers: [10, 25, 50, 100, 200],
      value: finished(sessions).length,
      title: (n) => `${n} treinos`,
      description: (n) => `Concluir ${n} treinos no app`,
    },
    {
      id: 'semanas',
      tiers: [2, 4, 8, 12, 26],
      value: bestWeekStreak(sessions, 3),
      title: (n) => `${n} semanas firmes`,
      description: (n) => `${n} semanas seguidas com 3 treinos ou mais`,
    },
    {
      id: 'agua',
      tiers: [3, 7, 14, 30, 60],
      value: bestDayStreak(waterDates, (d) => waterByDate(d) >= waterGoal),
      title: (n) => `${n} dias de água`,
      description: (n) => `${n} dias seguidos batendo a meta de água`,
    },
    {
      id: 'evolucao',
      tiers: [3, 10, 20, 30],
      value: evolved,
      title: (n) => `${n} exercícios evoluídos`,
      description: (n) => `Aumentar a carga em ${n} exercícios diferentes`,
    },
  ];

  return tracks.flatMap((t) => {
    const won = t.tiers.filter((n) => t.value >= n);
    const next = t.tiers.find((n) => t.value < n);
    const list: Badge[] = won.map((n) => ({
      id: `${t.id}-${n}`,
      title: t.title(n),
      description: t.description(n),
      unlocked: true,
      progress: 'Conquistada',
    }));
    if (next !== undefined)
      list.push({
        id: `${t.id}-${next}`,
        title: t.title(next),
        description: t.description(next),
        unlocked: false,
        progress: `${Math.min(t.value, next)} de ${next}`,
      });
    return list;
  });
}
