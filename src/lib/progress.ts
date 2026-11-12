import type { WorkoutSession } from '../types/workout';
import type { BodyEntry, MeasureKey } from '../types/body';

export interface Point {
  date: string; // "2026-11-10"
  value: number;
}

/** Maior carga usada em cada sessão para um exercício, da mais antiga para a mais recente. */
export function exerciseHistory(sessions: WorkoutSession[], exerciseId: string): Point[] {
  return sessions
    .filter((s) => s.finishedAt && s.logs[exerciseId]?.length)
    .map((s) => ({
      date: s.startedAt.slice(0, 10),
      value: Math.max(...s.logs[exerciseId].map((l) => l.load)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface PersonalRecord {
  exerciseId: string;
  best: number; // maior carga já usada
  first: number; // carga da primeira sessão registrada
  date: string; // quando bateu o recorde
}

/** Recordes por exercício, só os que já evoluíram desde a primeira sessão. */
export function personalRecords(sessions: WorkoutSession[], exerciseIds: string[]): PersonalRecord[] {
  return exerciseIds
    .map((id) => {
      const history = exerciseHistory(sessions, id);
      if (history.length === 0) return null;
      const best = history.reduce((top, p) => (p.value > top.value ? p : top));
      return { exerciseId: id, best: best.value, first: history[0].value, date: best.date };
    })
    .filter((r): r is PersonalRecord => r !== null && r.best > r.first)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function weightSeries(entries: BodyEntry[]): Point[] {
  return entries.filter((e) => e.weightKg !== undefined).map((e) => ({ date: e.date, value: e.weightKg! }));
}

export function measureSeries(entries: BodyEntry[], key: MeasureKey): Point[] {
  return entries
    .filter((e) => e.measures?.[key] !== undefined)
    .map((e) => ({ date: e.date, value: e.measures![key]! }));
}

/** Diferença entre o último e o primeiro ponto (null se houver menos de 2). */
export function change(points: Point[]): number | null {
  if (points.length < 2) return null;
  return Math.round((points.at(-1)!.value - points[0].value) * 10) / 10;
}

export const formatShortDate = (date: string) => {
  const [, m, d] = date.split('-');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${Number(d)} ${months[Number(m) - 1]}`;
};
