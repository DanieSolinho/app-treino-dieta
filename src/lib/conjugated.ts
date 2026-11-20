/**
 * Exercícios conjugados (bi-set, tri-set): "Facepull + bíceps na corda (cross)".
 * Cada parte tem a sua carga e as suas repetições em cada série.
 */
import type { Exercise, SetLog, Suggestion } from '../types/workout';
import { suggestLoad } from './loadSuggestion';

/** As partes do exercício: o campo `parts` ou o nome separado por " + ". */
export function exerciseParts(ex: Pick<Exercise, 'name' | 'parts'>): string[] {
  if (ex.parts && ex.parts.length > 1) return ex.parts;
  const split = ex.name.split(' + ').map((p) => p.trim()).filter(Boolean);
  return split.length > 1 ? split.map((p) => p.charAt(0).toUpperCase() + p.slice(1)) : [ex.name];
}

/** A meta da série separada por parte, quando ela segue o mesmo " + " ("12–15 facepull + 10–12 bíceps"). */
export function partTargets(target: string | undefined, count: number): (string | undefined)[] {
  const split = target?.split(' + ').map((t) => t.trim());
  return Array.from({ length: count }, (_, i) => (split && split.length === count ? split[i] : undefined));
}

/** Todas as partes da série: [{load, reps}] na ordem. */
export const setParts = (s: SetLog) => [{ load: s.load, reps: s.reps }, ...(s.parts ?? [])];

/** Volume (kg × reps) da série, somando as partes. */
export const setVolume = (s: SetLog) => setParts(s).reduce((sum, p) => sum + p.load * p.reps, 0);

/** Faixa de repetições da parte i, lida da meta da 1ª série ("10–12 bíceps" → 10–12); senão, a do exercício. */
export function partRange(ex: Exercise, i: number): [number, number] {
  const t = partTargets(ex.setTargets?.[0], exerciseParts(ex).length)[i];
  const m = t?.match(/(\d+)\s*(?:[–-]\s*(\d+))?/);
  if (!m) return [ex.repMin, ex.repMax];
  const a = Number(m[1]);
  return [a, m[2] ? Number(m[2]) : a];
}

/**
 * Sugestão de carga para o 2º exercício em diante: as mesmas regras do 1º,
 * olhando as séries daquela parte e a faixa de repetições dela.
 */
export function suggestParts(ex: Exercise, current: SetLog[], previous?: SetLog[]): Suggestion['parts'] {
  const count = exerciseParts(ex).length - 1;
  if (count < 1 || ex.bodyweight) return undefined;
  return Array.from({ length: count }, (_, i) => {
    const pick = (logs?: SetLog[]) =>
      logs?.flatMap((s) => (s.parts?.[i] ? [{ load: s.parts[i].load, reps: s.parts[i].reps, effort: s.effort }] : []));
    const [repMin, repMax] = partRange(ex, i + 1);
    const part = { ...ex, repMin, repMax, currentLoad: ex.partLoads?.[i] ?? 0, bodyweight: false };
    const mine = pick(current) ?? [];
    if (mine.length === 0) return { action: 'manter' as const, load: part.currentLoad };
    const s = suggestLoad(part, mine, pick(previous));
    return { action: s.action, load: s.load };
  });
}
