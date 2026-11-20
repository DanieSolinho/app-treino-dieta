/** Calorias dos últimos 7 dias, para o gráfico da aba Calorias em Progresso. */
import type { DietPlan, Food, OffPlanEntry } from '../types/diet';
import type { WorkoutSession } from '../types/workout';
import { dayCalories } from './calories';
import { toDateKey } from './date';

export interface DayMaps {
  mealsDone: Record<string, string[]>;
  variants: Record<string, Record<string, string>>;
  swaps: Record<string, Record<string, Food>>;
  amounts: Record<string, Record<string, number>>;
  offPlan: Record<string, OffPlanEntry[]>;
}

export interface WeekDay {
  date: string;
  eaten: number; // kcal (0 = nada registrado)
  protein: number;
  burned: number; // kcal do relógio
  offPlan: number; // kcal fora da dieta
}

export function lastDays(n: number, today = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    return toDateKey(d);
  });
}

export function weekCalories(plan: DietPlan, day: DayMaps, sessions: WorkoutSession[], dates: string[]): WeekDay[] {
  return dates.map((date) => {
    const c = dayCalories({
      meals: plan.meals,
      mealsDone: day.mealsDone[date] ?? [],
      variants: day.variants[date] ?? {},
      swaps: day.swaps[date] ?? {},
      amounts: day.amounts[date] ?? {},
      offPlan: day.offPlan[date] ?? [],
    });
    const burned = sessions.reduce((s, x) => (x.kcal !== undefined && toDateKey(new Date(x.startedAt)) === date ? s + x.kcal : s), 0);
    return { date, eaten: c.total, protein: c.protein, burned, offPlan: c.offPlan };
  });
}

/** Médias só dos dias com algo registrado (dia vazio não puxa a média para baixo). */
export function weekStats(days: WeekDay[], goal?: number) {
  const logged = days.filter((d) => d.eaten > 0);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  return {
    logged: logged.length,
    avgEaten: avg(logged.map((d) => d.eaten)),
    avgProtein: avg(logged.map((d) => d.protein)),
    withinGoal: goal === undefined ? undefined : logged.filter((d) => d.eaten <= goal).length,
    burned: days.reduce((s, d) => s + d.burned, 0),
    offPlanDays: days.filter((d) => d.offPlan > 0).length,
    offPlanKcal: days.reduce((s, d) => s + d.offPlan, 0),
  };
}

export interface WeightPace {
  kgPerWeek: number; // negativo = perdendo
  from: string;
  to: string;
  points: number;
}

/**
 * Ritmo do peso: reta que melhor passa pelos pesos das últimas `days` (regressão linear),
 * em kg por semana. Precisa de pelo menos 3 pesos cobrindo 7 dias ou mais — menos que isso é só oscilação.
 */
export function weightPace(entries: { date: string; weightKg?: number }[], today = new Date(), days = 28): WeightPace | undefined {
  const start = lastDays(days, today)[0];
  const pts = entries
    .filter((e) => e.weightKg !== undefined && e.date >= start && e.date <= toDateKey(today))
    .map((e) => ({ date: e.date, x: Date.parse(`${e.date}T12:00:00`) / 864e5, y: e.weightKg! }));
  if (pts.length < 3) return undefined;
  const span = pts[pts.length - 1].x - pts[0].x;
  if (span < 7) return undefined;
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const slope = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  return { kgPerWeek: Math.round(slope * 7 * 10) / 10, from: pts[0].date, to: pts[pts.length - 1].date, points: pts.length };
}
