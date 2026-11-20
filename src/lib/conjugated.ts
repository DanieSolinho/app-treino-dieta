/**
 * Exercícios conjugados (bi-set, tri-set): "Facepull + bíceps na corda (cross)".
 * Cada parte tem a sua carga e as suas repetições em cada série.
 */
import type { Exercise, SetLog } from '../types/workout';

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
