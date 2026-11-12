import type { Exercise, SetLog, Suggestion } from '../types/workout';

/** Arredonda para o múltiplo do incremento (ex.: 21,6 kg com passo 2,5 → 22,5). */
export function roundToIncrement(load: number, increment: number): number {
  if (increment <= 0) return load;
  return Math.round(load / increment) * increment;
}

/**
 * Sugestão de carga para o próximo treino, a partir da carga que você REALMENTE usou
 * na 1ª série (não da carga planejada — assim funciona mesmo começando do zero).
 *
 * Progressão dupla (padrão):
 * - todas as séries no topo da faixa e nenhuma "difícil" → aumentar
 * - abaixo do mínimo nesta sessão E na anterior → reduzir ~10%
 * - qualquer outro caso → manter
 *
 * Pirâmide (12 → 10 → 8 subindo o peso): só a 1ª série decide, com a faixa repMin–repMax.
 */
export function suggestLoad(ex: Exercise, current: SetLog[], previous?: SetLog[]): Suggestion {
  if (current.length === 0 || ex.bodyweight) return { action: 'manter', load: ex.currentLoad };

  const base = current[0].load;
  const decisive = ex.progression === 'piramide' ? current.slice(0, 1) : current;
  const previousDecisive = ex.progression === 'piramide' ? previous?.slice(0, 1) : previous;

  const completedAll = ex.progression === 'piramide' || current.length >= ex.sets;
  const hitTop = completedAll && decisive.every((s) => s.reps >= ex.repMax);
  const tooHard = decisive.some((s) => s.effort === 'dificil');
  const belowMin = (logs?: SetLog[]) => !!logs?.length && logs.some((s) => s.reps < ex.repMin);

  if (hitTop && !tooHard && base > 0) {
    return { action: 'aumentar', load: base + ex.increment };
  }
  if (belowMin(decisive) && belowMin(previousDecisive) && base > 0) {
    const reduced = roundToIncrement(base * 0.9, ex.increment);
    return { action: 'reduzir', load: Math.max(0, Math.min(reduced, base - ex.increment)) };
  }
  return { action: 'manter', load: base };
}

export const formatKg = (kg: number) => `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;

/** Primeiro número de uma meta escrita: "10–12 com pausa" → 10. */
export function targetReps(target: string | undefined): number | undefined {
  const m = target?.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}
