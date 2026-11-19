/**
 * Calorias do dia: itens do plano (com a quantidade que você comeu) + refeições fora da dieta.
 * Funções puras, testadas sem a interface.
 */
import type { DietPlan, Food, Meal, OffPlanEntry } from '../types/diet';
import { KCAL_PER_100, PROTEIN_PER_100 } from '../data/kcalTable';

/** "Feijão preto cozido" → "feijao preto cozido" (sem acento, minúsculas, espaços simples). */
export const normalizeName = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** kcal por 100 g/ml do alimento, ou undefined se não souber. */
export function kcalPer100(food: Food): number | undefined {
  return food.kcal ?? KCAL_PER_100[normalizeName(food.name)];
}

/** g de proteína por 100 g/ml, ou undefined se não souber. */
export function proteinPer100(food: Food): number | undefined {
  return food.protein ?? PROTEIN_PER_100[normalizeName(food.name)];
}

/** g de proteína de uma quantidade (1 casa decimal). */
export function proteinFor(food: Food, grams: number | undefined): number | undefined {
  const per100 = proteinPer100(food);
  if (per100 === undefined || grams === undefined) return undefined;
  return Math.round(per100 * grams) / 100;
}

/** kcal de uma quantidade; undefined se faltar a quantidade ou o valor do alimento. */
export function kcalFor(food: Food, grams: number | undefined): number | undefined {
  const per100 = kcalPer100(food);
  if (per100 === undefined || grams === undefined) return undefined;
  return Math.round((per100 * grams) / 100);
}

/** Meta do dia: o campo kcalGoal ou o número antes de "kcal" no título. */
export function kcalGoal(plan: Pick<DietPlan, 'kcalGoal' | 'title'>): number | undefined {
  if (plan.kcalGoal) return plan.kcalGoal;
  const m = plan.title?.match(/(\d[\d.]*)\s*kcal/i);
  return m ? Number(m[1].replace(/\./g, '')) : undefined;
}

export interface DayInput {
  meals: Meal[];
  mealsDone: string[];
  variants: Record<string, string>; // mealId -> versão
  swaps: Record<string, Food>; // itemId -> alimento trocado
  amounts: Record<string, number>; // itemId -> gramas que você comeu
  offPlan: OffPlanEntry[];
}

export interface DayCalories {
  plan: number; // itens do plano que contam
  offPlan: number;
  total: number;
  /** itens que contam mas o app não sabe as calorias (ex.: "à vontade" ou fora da tabela) */
  unknown: string[];
  protein: number; // g: itens do plano + fora da dieta escolhidos da lista
}

const itemsOf = (meal: Meal, variantId?: string) =>
  meal.variants?.find((v) => v.id === variantId)?.items ?? meal.items;

/**
 * Um item conta quando a refeição está marcada como feita ou quando você digitou a quantidade.
 * Sem quantidade digitada, vale a do plano. Itens "à vontade" ficam de fora.
 */
export function dayCalories(d: DayInput): DayCalories {
  let plan = 0;
  let protein = 0;
  const unknown: string[] = [];
  for (const meal of d.meals) {
    const done = d.mealsDone.includes(meal.id);
    for (const item of itemsOf(meal, d.variants[meal.id])) {
      const typed = d.amounts[item.id];
      if (!done && typed === undefined) continue;
      const food = d.swaps[item.id] ?? item.food;
      const grams = typed ?? food.grams;
      if (grams === undefined && food.qty === null) continue; // à vontade
      const kcal = kcalFor(food, grams);
      if (kcal === undefined) unknown.push(food.name);
      else plan += kcal;
      protein += proteinFor(food, grams) ?? 0;
    }
  }
  const offPlan = d.offPlan.reduce((sum, e) => sum + e.kcal, 0);
  protein += d.offPlan.reduce((sum, e) => sum + (e.protein ?? 0), 0);
  return { plan, offPlan, total: plan + offPlan, unknown, protein: Math.round(protein) };
}

export const formatKcal = (n: number) => `${n.toLocaleString('pt-BR')} kcal`;

