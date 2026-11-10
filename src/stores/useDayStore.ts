import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Food, MealItem } from '../types/diet';
import { toDateKey } from '../lib/date';

type DateKey = string; // "2026-11-10"

interface DayState {
  /** data -> itemId -> alimento escolhido naquele dia */
  swaps: Record<DateKey, Record<string, Food>>;
  /** data -> ids das refeições feitas */
  mealsDone: Record<DateKey, string[]>;
  swap: (date: DateKey, itemId: string, food: Food) => void;
  undoSwap: (date: DateKey, itemId: string) => void;
  toggleMeal: (date: DateKey, mealId: string) => void;
}

export const useDayStore = create<DayState>()(
  persist(
    (set) => ({
      swaps: {},
      mealsDone: {},

      swap: (date, itemId, food) =>
        set((s) => ({
          swaps: { ...s.swaps, [date]: { ...s.swaps[date], [itemId]: food } },
        })),

      undoSwap: (date, itemId) =>
        set((s) => {
          const { [itemId]: _removed, ...rest } = s.swaps[date] ?? {};
          return { swaps: { ...s.swaps, [date]: rest } };
        }),

      toggleMeal: (date, mealId) =>
        set((s) => {
          const done = s.mealsDone[date] ?? [];
          const next = done.includes(mealId) ? done.filter((id) => id !== mealId) : [...done, mealId];
          return { mealsDone: { ...s.mealsDone, [date]: next } };
        }),
    }),
    { name: 'day-log' },
  ),
);

/** Alimento que vale para o item hoje: a troca, se houver, ou o original do plano. */
export function useFoodForDay(item: MealItem, date: DateKey = toDateKey()) {
  const swapped = useDayStore((s) => s.swaps[date]?.[item.id]);
  return { food: swapped ?? item.food, isSwapped: Boolean(swapped) };
}
