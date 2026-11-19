/**
 * Quando um dia conta no streak (qualquer uma das três):
 * 1. treinou nesse dia (ficha ou cardio finalizado);
 * 2. bateu a meta de água e marcou pelo menos 3 refeições;
 * 3. bateu a meta de água e ficou dentro da meta de calorias (com algo registrado).
 */
import type { DayInput } from './calories';
import { dayCalories } from './calories';

export const MIN_MEALS = 3;

export interface DayDoneInput extends DayInput {
  waterMl: number;
  waterGoal: number;
  kcalGoal?: number;
  trained: boolean;
}

export function isDayDone(d: DayDoneInput): boolean {
  if (d.trained) return true;
  if (d.waterMl < d.waterGoal) return false;
  if (d.mealsDone.length >= Math.min(MIN_MEALS, d.meals.length)) return true;
  if (d.kcalGoal === undefined) return false;
  const { total } = dayCalories(d);
  return total > 0 && total <= d.kcalGoal;
}
