/** Corrigir calorias/proteína de um alimento: vale em todo lugar do plano onde ele aparece. */
import type { DietPlan, Food, MealItem } from '../types/diet';
import { normalizeName } from './calories';

export interface Nutrition {
  kcal: number; // por 100 g/ml
  protein?: number; // g por 100 g/ml
}

/** Todos os nomes de alimentos do plano (lista de substituição + refeições), sem repetir. */
export function planFoodNames(plan: DietPlan): string[] {
  const names = new Map<string, string>();
  const add = (f: Food) => {
    if (f.qty !== null && f.grams !== undefined) names.set(normalizeName(f.name), names.get(normalizeName(f.name)) ?? f.name);
  };
  plan.groups.forEach((g) => g.options.forEach(add));
  const items = (list: MealItem[]) => list.forEach((i) => [i.food, ...(i.options ?? [])].forEach(add));
  plan.meals.forEach((m) => {
    items(m.items);
    m.variants?.forEach((v) => items(v.items));
  });
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function setFoodNutrition(plan: DietPlan, name: string, n: Nutrition | null): DietPlan {
  const key = normalizeName(name);
  const fix = (f: Food): Food => {
    if (normalizeName(f.name) !== key) return f;
    const { kcal: _k, protein: _p, ...rest } = f;
    return n ? { ...rest, kcal: n.kcal, ...(n.protein !== undefined ? { protein: n.protein } : {}) } : rest;
  };
  const items = (list: MealItem[]) => list.map((i) => ({ ...i, food: fix(i.food), ...(i.options ? { options: i.options.map(fix) } : {}) }));
  return {
    ...plan,
    groups: plan.groups.map((g) => ({ ...g, options: g.options.map(fix) })),
    meals: plan.meals.map((m) => ({
      ...m,
      items: items(m.items),
      ...(m.variants ? { variants: m.variants.map((v) => ({ ...v, items: items(v.items) })) } : {}),
    })),
  };
}

/** O valor salvo no plano para este alimento (o primeiro que achar), se houver. */
export function customNutrition(plan: DietPlan, name: string): Nutrition | undefined {
  const key = normalizeName(name);
  const all = [
    ...plan.groups.flatMap((g) => g.options),
    ...plan.meals.flatMap((m) => [...m.items, ...(m.variants ?? []).flatMap((v) => v.items)].flatMap((i) => [i.food, ...(i.options ?? [])])),
  ];
  const f = all.find((x) => normalizeName(x.name) === key && x.kcal !== undefined);
  return f ? { kcal: f.kcal!, ...(f.protein !== undefined ? { protein: f.protein } : {}) } : undefined;
}
