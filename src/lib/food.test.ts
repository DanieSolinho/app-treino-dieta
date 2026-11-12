import { describe, expect, it } from 'vitest';
import { f, formatAmount, scaleFood, substitutesFor, vontade } from './food';
import type { MealItem, SubstitutionGroup } from '../types/diet';

const proteinas: SubstitutionGroup = {
  id: '4',
  name: 'Grupo 4 · Proteínas',
  options: [
    f('Filé de frango grelhado', 1, 'bife(s) pequeno(s)', 50),
    f('Filé de tilápia cozido', 1, 'filé(s) médio(s)', 60),
    f('Ovo cozido', 2, 'unidade(s) grande(s)', 110),
  ],
};

describe('alimentos', () => {
  it('formata medida caseira com gramas', () => {
    expect(formatAmount(f('Arroz', 2, 'colher(es) de sopa cheia(s)', 50))).toBe('2 colher(es) de sopa cheia(s) (50 g)');
    expect(formatAmount(f('Iogurte', 1, 'unidade(s)', 170, 'ml'))).toBe('1 unidade(s) (170 ml)');
    expect(formatAmount(vontade('Alface'))).toBe('à vontade');
  });

  it('multiplica a porção do grupo', () => {
    expect(scaleFood(f('Tilápia', 1, 'filé(s)', 60), 1.8)).toEqual(f('Tilápia', 1.8, 'filé(s)', 108));
  });

  it('junta opções da refeição e do grupo sem repetir o original', () => {
    const item: MealItem = {
      id: 'x',
      food: f('Filé de frango grelhado', 1.8, 'bife(s) pequeno(s)', 90),
      options: [f('Pescada branca grelhada', 0.9, 'posta(s) pequena(s)', 135)],
      group: { id: '4', portions: 1.8 },
    };
    const list = substitutesFor(item, [proteinas]);
    expect(list.fromMeal.map((o) => o.name)).toEqual(['Pescada branca grelhada']);
    expect(list.fromGroup.map((o) => o.name)).toEqual(['Filé de tilápia cozido', 'Ovo cozido']);
    expect(list.fromGroup[1]).toEqual(f('Ovo cozido', 3.6, 'unidade(s) grande(s)', 198));
  });
});
