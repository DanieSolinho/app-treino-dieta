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
