import { describe, expect, it } from 'vitest';
import { suggestLoad } from './loadSuggestion';
import type { Exercise, SetLog } from '../types/workout';

const supino: Exercise = {
  id: 'supino',
  name: 'Supino inclinado',
  sets: 3,
  repMin: 8,
  repMax: 12,
  restSeconds: 90,
  increment: 2.5,
  currentLoad: 20,
};

const sets = (...reps: number[]): SetLog[] => reps.map((r) => ({ load: 20, reps: r, effort: 'ok' }));

describe('suggestLoad', () => {
  it('aumenta quando todas as séries chegam ao topo da faixa', () => {
    expect(suggestLoad(supino, sets(12, 12, 12))).toEqual({ action: 'aumentar', load: 22.5 });
  });

  it('mantém se alguma série foi marcada como difícil', () => {
    const logs = sets(12, 12, 12);
    logs[2].effort = 'dificil';
    expect(suggestLoad(supino, logs).action).toBe('manter');
  });

  it('mantém se não fez todas as séries, mesmo com reps no topo', () => {
    expect(suggestLoad(supino, sets(12, 12)).action).toBe('manter');
  });

  it('mantém se ficou abaixo do mínimo só uma vez', () => {
    expect(suggestLoad(supino, sets(10, 8, 6), sets(10, 9, 8)).action).toBe('manter');
  });

  it('reduz cerca de 10% depois de duas sessões abaixo do mínimo', () => {
    expect(suggestLoad(supino, sets(8, 7, 6), sets(9, 7, 6))).toEqual({ action: 'reduzir', load: 17.5 });
  });

  it('a redução tira pelo menos um incremento', () => {
    const leve = { ...supino, currentLoad: 5, increment: 2 };
    const leves = (...reps: number[]) => reps.map((r) => ({ load: 5, reps: r }));
    expect(suggestLoad(leve, leves(6, 6, 6), leves(6, 6, 6)).load).toBe(3);
  });

  it('parte da carga usada de verdade, mesmo se a ficha estava zerada', () => {
    const novo = { ...supino, currentLoad: 0 };
    expect(suggestLoad(novo, sets(12, 12, 12))).toEqual({ action: 'aumentar', load: 22.5 });
  });

  it('pirâmide: só a 1ª série decide', () => {
    const piramide = { ...supino, progression: 'piramide' as const, repMin: 12, repMax: 12 };
    // 12 → 10 → 8 subindo o peso: as séries seguintes caem de propósito
    expect(suggestLoad(piramide, sets(12, 10, 8))).toEqual({ action: 'aumentar', load: 22.5 });
    expect(suggestLoad(piramide, sets(11, 10, 8)).action).toBe('manter');
  });

  it('exercício sem carga nunca muda', () => {
    expect(suggestLoad({ ...supino, bodyweight: true }, sets(12, 12, 12)).action).toBe('manter');
  });

  it('sem séries registradas, mantém', () => {
    expect(suggestLoad(supino, [])).toEqual({ action: 'manter', load: 20 });
  });
});
