import { beforeEach, describe, expect, it } from 'vitest';
import { useDayStore, waterTotal } from './useDayStore';

const today = '2026-11-10';
const batata = { name: 'Batata-doce', amount: 150, unit: 'g' as const };

describe('trocas da dieta', () => {
  beforeEach(() => useDayStore.setState({ swaps: {}, mealsDone: {}, waterLog: {} }));

  it('soma água e desfaz só o último registro', () => {
    const { addWater, undoWater } = useDayStore.getState();
    addWater(today, 250);
    addWater(today, 500);
    expect(waterTotal(useDayStore.getState().waterLog[today])).toBe(750);
    undoWater(today);
    expect(waterTotal(useDayStore.getState().waterLog[today])).toBe(250);
    undoWater(today);
    undoWater(today); // desfazer com a lista vazia não quebra
    expect(waterTotal(useDayStore.getState().waterLog[today])).toBe(0);
  });

  it('registra a troca só no dia escolhido', () => {
    useDayStore.getState().swap(today, 'alm-arroz', batata);
    const { swaps } = useDayStore.getState();
    expect(swaps[today]['alm-arroz']).toEqual(batata);
    expect(swaps['2026-11-11']).toBeUndefined();
  });

  it('desfaz a troca sem mexer nas outras', () => {
    const { swap, undoSwap } = useDayStore.getState();
    swap(today, 'alm-arroz', batata);
    swap(today, 'jan-carbo', batata);
    undoSwap(today, 'alm-arroz');
    const { swaps } = useDayStore.getState();
    expect(swaps[today]['alm-arroz']).toBeUndefined();
    expect(swaps[today]['jan-carbo']).toEqual(batata);
  });

  it('marca e desmarca refeição', () => {
    const { toggleMeal } = useDayStore.getState();
    toggleMeal(today, 'almoco');
    expect(useDayStore.getState().mealsDone[today]).toEqual(['almoco']);
    toggleMeal(today, 'almoco');
    expect(useDayStore.getState().mealsDone[today]).toEqual([]);
  });
});
