import type { Schedule, Workout } from '../types/workout';
import { toDateKey } from './date';

export interface DayPlan {
  workouts: Workout[]; // 0 = descanso, 2+ = escolha ("D ou E")
  fromSchedule: boolean; // veio da agenda por data (true) ou dos dias da semana da ficha
}

/** Fichas do dia: a agenda por data manda; sem agenda, usa os dias da semana de cada ficha. */
export function plannedFor(date: Date, workouts: Workout[], schedule: Schedule): DayPlan {
  const ids = schedule[toDateKey(date)];
  if (ids) {
    return { workouts: ids.map((id) => workouts.find((w) => w.id === id)).filter((w): w is Workout => !!w), fromSchedule: true };
  }
  return { workouts: workouts.filter((w) => w.weekDays.includes(date.getDay())), fromSchedule: false };
}

/** Próximos dias da agenda (para a faixa da semana). */
export function upcoming(from: Date, days: number, workouts: Workout[], schedule: Schedule) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return { date: d, plan: plannedFor(d, workouts, schedule) };
  });
}

/** Letra curta da ficha: "Treino A · …" → "A". */
export const shortName = (name: string) => name.match(/^Treino\s+(\S+)/)?.[1] ?? name.slice(0, 1);

/** Dias do mês em semanas (domingo a sábado), com null nas casas antes do dia 1 e depois do último. */
export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

/** Último dia com agenda por data (para avisar quando está acabando). */
export const lastScheduledDate = (schedule: Schedule): string | undefined => Object.keys(schedule).sort().pop();
