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
    return { date, eaten: c.total, protein: c.protein, burned };
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
  };
}
