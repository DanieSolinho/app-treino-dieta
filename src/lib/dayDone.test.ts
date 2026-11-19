import { describe, expect, it } from 'vitest';
import type { Meal } from '../types/diet';
import { f } from './food';
import { isDayDone } from './dayDone';

const meals: Meal[] = ['cafe', 'almoco', 'lanche', 'jantar'].map((id) => ({
  id,
  name: id,
  items: [{ id: `${id}-x`, food: f('Filé de frango grelhado', 2, 'bife(s)', 100) }], // 159 kcal cada
}));
const base = {
  meals,
  mealsDone: [] as string[],
  variants: {},
  swaps: {},
  amounts: {},
  offPlan: [],
  waterMl: 2500,
  waterGoal: 2500,
  kcalGoal: 1300,
  trained: false,
};

describe('dia cumprido', () => {
  it('3 refeições + água contam (antes eram 4)', () => {
    expect(isDayDone({ ...base, mealsDone: ['cafe', 'almoco', 'lanche'] })).toBe(true);
    expect(isDayDone({ ...base, mealsDone: ['cafe', 'almoco', 'lanche'], waterMl: 2000 })).toBe(false);
  });

  it('dentro da meta de calorias + água contam, mas precisa ter algo registrado', () => {
    expect(isDayDone({ ...base, mealsDone: ['cafe', 'almoco'] })).toBe(true); // 318 kcal
    expect(isDayDone({ ...base })).toBe(false); // nada registrado
    expect(isDayDone({ ...base, mealsDone: ['cafe'], offPlan: [{ id: '1', text: 'Pizza', kcal: 1500 }] })).toBe(false);
  });

  it('dia de treino conta sozinho', () => {
    expect(isDayDone({ ...base, waterMl: 0, trained: true })).toBe(true);
  });
});
