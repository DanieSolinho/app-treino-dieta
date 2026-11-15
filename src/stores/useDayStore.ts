import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Food, MealItem, OffPlanEntry } from '../types/diet';
import { newId } from '../lib/id';
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
  /** data -> cada registro de água em ml (lista permite desfazer o último) */
  waterLog: Record<DateKey, number[]>;
  addWater: (date: DateKey, ml: number) => void;
  undoWater: (date: DateKey) => void;
  /** data -> refeição -> versão escolhida ("sem-feijao"); ausente = versão principal */
  variants: Record<DateKey, Record<string, string>>;
  chooseVariant: (date: DateKey, mealId: string, variantId: string | null) => void;
  /** data -> itemId -> gramas (ou ml) que você comeu de verdade; ausente = a quantidade do plano */
  amounts: Record<DateKey, Record<string, number>>;
  setAmount: (date: DateKey, itemId: string, grams: number | null) => void;
  /** data -> refeições fora da dieta */
  offPlan: Record<DateKey, OffPlanEntry[]>;
  addOffPlan: (date: DateKey, entry: Omit<OffPlanEntry, 'id'>) => void;
  removeOffPlan: (date: DateKey, id: string) => void;
}

/** Tira uma chave de um mapa de um dia, devolvendo o mapa geral atualizado. */
function without<T>(all: Record<DateKey, Record<string, T>>, date: DateKey, key: string) {
  if (!all[date] || !(key in all[date])) return all;
  const { [key]: _removed, ...rest } = all[date];
  return { ...all, [date]: rest };
}

/** Total de água do dia em ml. */
export const waterTotal = (log: number[] | undefined) => (log ?? []).reduce((sum, ml) => sum + ml, 0);

export const useDayStore = create<DayState>()(
  persist(
    (set) => ({
      swaps: {},
      mealsDone: {},

      // trocar o alimento zera a quantidade digitada: ela era do alimento anterior
      swap: (date, itemId, food) =>
        set((s) => ({
          swaps: { ...s.swaps, [date]: { ...s.swaps[date], [itemId]: food } },
          amounts: without(s.amounts, date, itemId),
        })),

      undoSwap: (date, itemId) =>
        set((s) => {
          const { [itemId]: _removed, ...rest } = s.swaps[date] ?? {};
          return { swaps: { ...s.swaps, [date]: rest }, amounts: without(s.amounts, date, itemId) };
        }),

      toggleMeal: (date, mealId) =>
        set((s) => {
          const done = s.mealsDone[date] ?? [];
          const next = done.includes(mealId) ? done.filter((id) => id !== mealId) : [...done, mealId];
          return { mealsDone: { ...s.mealsDone, [date]: next } };
        }),

      waterLog: {},

      addWater: (date, ml) =>
        set((s) => ({ waterLog: { ...s.waterLog, [date]: [...(s.waterLog[date] ?? []), ml] } })),

      undoWater: (date) =>
        set((s) => ({ waterLog: { ...s.waterLog, [date]: (s.waterLog[date] ?? []).slice(0, -1) } })),

      variants: {},

      chooseVariant: (date, mealId, variantId) =>
        set((s) => {
          const { [mealId]: _old, ...rest } = s.variants[date] ?? {};
          const day = variantId ? { ...rest, [mealId]: variantId } : rest;
          return { variants: { ...s.variants, [date]: day } };
        }),

      amounts: {},

      setAmount: (date, itemId, grams) =>
        set((s) =>
          grams === null || !Number.isFinite(grams) || grams < 0
            ? { amounts: without(s.amounts, date, itemId) }
            : { amounts: { ...s.amounts, [date]: { ...s.amounts[date], [itemId]: grams } } },
        ),

      offPlan: {},

      addOffPlan: (date, entry) =>
        set((s) => ({ offPlan: { ...s.offPlan, [date]: [...(s.offPlan[date] ?? []), { ...entry, id: newId() }] } })),

      removeOffPlan: (date, id) =>
        set((s) => ({ offPlan: { ...s.offPlan, [date]: (s.offPlan[date] ?? []).filter((e) => e.id !== id) } })),
    }),
    {
      name: 'day-log',
      version: 3,
      migrate: (saved, version) => {
        const s = (saved ?? {}) as Partial<DayState>;
        return {
          mealsDone: s.mealsDone ?? {},
          waterLog: s.waterLog ?? {}, // v0 não tinha água
          swaps: version < 2 ? {} : (s.swaps ?? {}), // v2 mudou o formato dos alimentos
          variants: s.variants ?? {},
          amounts: s.amounts ?? {}, // v3: quantidades e fora da dieta
          offPlan: s.offPlan ?? {},
        } as DayState;
      },
    },
  ),
);

/** Alimento que vale para o item hoje: a troca, se houver, ou o original do plano. */
export function useFoodForDay(item: MealItem, date: DateKey = toDateKey()) {
  const swapped = useDayStore((s) => s.swaps[date]?.[item.id]);
  return { food: swapped ?? item.food, isSwapped: Boolean(swapped) };
}
