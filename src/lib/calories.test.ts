import { describe, expect, it } from 'vitest';
import type { Meal } from '../types/diet';
import { f, vontade } from './food';
import { dayCalories, kcalFor, kcalGoal, kcalPer100, normalizeName } from './calories';

const meals: Meal[] = [
  {
    id: 'cafe',
    name: 'Café da manhã',
    items: [
      { id: 'ovo', food: f('Ovo de galinha', 2, 'unidade(s) grande(s)', 110) },
      { id: 'iog', food: f('Iogurte natural desnatado', 1, 'unidade(s)', 170, 'ml') },
    ],
  },
  {
    id: 'almoco',
    name: 'Almoço',
    items: [
      { id: 'salada', food: vontade('Salada verde') },
      { id: 'carne', food: f('Filé de frango grelhado', 2, 'bife(s) pequeno(s)', 100) },
    ],
    variants: [{ id: 'leve', label: 'Leve', items: [{ id: 'carne-l', food: f('Filé de frango grelhado', 1, 'bife(s) pequeno(s)', 50) }] }],
  },
];

const empty = { mealsDone: [], variants: {}, swaps: {}, amounts: {}, offPlan: [] };

describe('calorias', () => {
  it('acha o alimento na tabela sem ligar para acento ou maiúscula', () => {
    expect(normalizeName('  Feijão  Preto cozido ')).toBe('feijao preto cozido');
    expect(kcalPer100(f('PICANHA sem gordura grelhada', 1, 'fatia', 35))).toBe(238);
    expect(kcalPer100({ ...f('Bolo da vó', 1, 'fatia', 60), kcal: 350 })).toBe(350);
    expect(kcalFor(f('Bolo da vó', 1, 'fatia', 60), 60)).toBeUndefined();
  });

  it('lê a meta do título quando não há kcalGoal', () => {
    expect(kcalGoal({ title: 'Cardápio emagrecimento · 1300 kcal' })).toBe(1300);
    expect(kcalGoal({ title: 'x', kcalGoal: 1500 })).toBe(1500);
    expect(kcalGoal({})).toBeUndefined();
  });

  it('conta refeições feitas com a quantidade do plano', () => {
    const c = dayCalories({ ...empty, meals, mealsDone: ['cafe'] });
    expect(c.plan).toBe(Math.round(143 * 1.1) + Math.round(41 * 1.7)); // 157 + 70
    expect(c.total).toBe(227);
  });

  it('a quantidade digitada vale mesmo com a refeição desmarcada', () => {
    const c = dayCalories({ ...empty, meals, amounts: { carne: 150 } });
    expect(c.plan).toBe(Math.round(159 * 1.5));
  });

  it('usa o alimento trocado, a versão escolhida e ignora "à vontade"', () => {
    const swapped = dayCalories({
      ...empty,
      meals,
      mealsDone: ['almoco'],
      swaps: { carne: f('Picanha sem gordura grelhada', 2, 'fatia(s) pequena(s)', 70) },
    });
    expect(swapped.plan).toBe(Math.round(238 * 0.7));
    expect(swapped.unknown).toEqual([]);

    const variant = dayCalories({ ...empty, meals, mealsDone: ['almoco'], variants: { almoco: 'leve' } });
    expect(variant.plan).toBe(Math.round(159 * 0.5));
  });

  it('soma o que foi comido fora da dieta', () => {
    const c = dayCalories({ ...empty, meals, offPlan: [{ id: '1', text: 'Pizza', kcal: 600 }, { id: '2', text: 'Coca', kcal: 139 }] });
    expect(c).toMatchObject({ plan: 0, offPlan: 739, total: 739 });
  });

  it('soma a proteína do plano e do fora da dieta escolhido da lista', () => {
    const c = dayCalories({
      ...empty,
      meals,
      mealsDone: ['cafe'],
      offPlan: [{ id: '1', text: 'Whey', kcal: 78, protein: 16 }, { id: '2', text: 'Pizza', kcal: 600 }],
    });
    // ovo 110 g × 13 = 14,3 g + iogurte 170 ml × 3,8 = 6,5 g + whey 16 g
    expect(c.protein).toBe(37);
  });
});

