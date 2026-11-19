import { describe, expect, it } from 'vitest';
import { samplePlan } from '../data/samplePlan';
import { customNutrition, planFoodNames, setFoodNutrition } from './foodNutrition';
import { kcalFor } from './calories';

describe('calorias de um alimento', () => {
  it('lista os alimentos do plano sem repetir', () => {
    const names = planFoodNames(samplePlan);
    expect(names).toContain('Banana prata');
    expect(new Set(names).size).toBe(names.length);
  });

  it('corrige em todo o plano e volta para a tabela', () => {
    const fixed = setFoodNutrition(samplePlan, 'banana prata', { kcal: 120, protein: 1 });
    const cafe = fixed.meals.find((m) => m.id === 'cafe')!.items.find((i) => i.food.name === 'Banana prata')!;
    expect(cafe.food.kcal).toBe(120);
    expect(fixed.groups.flatMap((g) => g.options).find((o) => o.name === 'Banana prata')!.kcal).toBe(120);
    expect(kcalFor(cafe.food, 100)).toBe(120);
    expect(customNutrition(fixed, 'Banana prata')).toEqual({ kcal: 120, protein: 1 });

    const back = setFoodNutrition(fixed, 'Banana prata', null);
    expect(customNutrition(back, 'Banana prata')).toBeUndefined();
    expect(kcalFor(back.meals[0].items[1].food, 100)).toBe(98);
  });
});
