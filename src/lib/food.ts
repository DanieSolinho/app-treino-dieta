import type { Food, MealItem, SubstitutionGroup } from '../types/diet';

/** Atalho para escrever planos: f('Arroz branco cozido', 2, 'colher(es) de sopa cheia(s)', 50) */
export const f = (name: string, qty: number | null, measure: string, grams?: number, unit?: 'g' | 'ml'): Food => ({
  name,
  qty,
  measure,
  grams,
  unit,
});

export const vontade = (name: string): Food => f(name, null, 'à vontade');

const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const round1 = (n: number) => Math.round(n * 10) / 10;

export function formatAmount(food: Food): string {
  if (food.qty === null) return food.measure;
  const grams = food.grams !== undefined ? ` (${num(food.grams)} ${food.unit ?? 'g'})` : '';
  return `${num(food.qty)} ${food.measure}${grams}`;
}

/** Porção do grupo multiplicada: 1 bife (50 g) × 1,8 → 1,8 bife (90 g). */
export function scaleFood(food: Food, portions: number): Food {
  if (portions === 1) return food;
  return {
    ...food,
    qty: food.qty === null ? null : round1(food.qty * portions),
    grams: food.grams === undefined ? undefined : Math.round(food.grams * portions),
  };
}

export function sameFood(a: Food, b: Food): boolean {
  return a.name === b.name && a.qty === b.qty && a.grams === b.grams;
}

export const hasSubstitutes = (item: MealItem) => Boolean(item.options?.length || item.group);

export interface SubstituteList {
  fromMeal: Food[]; // escritos na refeição
  fromGroup: Food[]; // do grupo, já na porção certa
  group?: SubstitutionGroup;
  portions?: number;
}

export function substitutesFor(item: MealItem, groups: SubstitutionGroup[]): SubstituteList {
  const fromMeal = (item.options ?? []).filter((o) => o.name !== item.food.name);
  const group = item.group ? groups.find((g) => g.id === item.group!.id) : undefined;
  const taken = new Set([item.food.name, ...fromMeal.map((o) => o.name)]);
  const fromGroup = group
    ? group.options.filter((o) => !taken.has(o.name)).map((o) => scaleFood(o, item.group!.portions))
    : [];
  return { fromMeal, fromGroup, group, portions: item.group?.portions };
}

export const formatPortions = (n: number) => `${num(n)} ${n === 1 ? 'porção' : 'porções'}`;
