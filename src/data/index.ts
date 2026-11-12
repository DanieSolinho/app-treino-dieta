/**
 * Ponto único de dados iniciais do app.
 * Se existir src/data/private/ (fora do Git), usa os seus dados reais;
 * senão, usa os exemplos — é o que roda no repositório público.
 */
import type { DietPlan } from '../types/diet';
import type { Schedule, Workout } from '../types/workout';
import { samplePlan } from './samplePlan';
import { sampleWorkouts } from './sampleWorkouts';
import { sampleStretches, type StretchRoutine } from './stretchRoutines';

type PrivateDiet = { privatePlan?: DietPlan };
type PrivateTraining = { privateWorkouts?: Workout[]; privateSchedule?: Schedule; privateStretches?: StretchRoutine[] };

const modules = import.meta.glob<PrivateDiet & PrivateTraining>('./private/*.ts', { eager: true });
const diet = modules['./private/dieta.ts'];
const training = modules['./private/treinos.ts'];

export const defaultPlan: DietPlan = diet?.privatePlan ?? samplePlan;
export const defaultWorkouts: Workout[] = training?.privateWorkouts ?? sampleWorkouts;
export const defaultSchedule: Schedule = training?.privateSchedule ?? {};
export const defaultStretches: StretchRoutine[] = training?.privateStretches ?? sampleStretches;
export const usingPrivateData = Boolean(diet || training);

// Fotos de exercícios e alongamentos (também privadas): ./private/images/<nome>.webp
const images = import.meta.glob<string>('./private/images/*.{webp,jpg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const fileName = (path: string) => path.replace(/^.*\//, '').replace(/\.\w+$/, '');

/** Foto que veio junto com o app neste computador (pasta private/images), pelo nome sem extensão. */
export function bundledImageUrl(name?: string): string | undefined {
  if (!name) return undefined;
  const key = Object.keys(images).find((k) => fileName(k) === name);
  return key ? images[key] : undefined;
}

/** Todas as fotos .webp que vieram junto com o app (para enviar à conta). */
export const bundledImages = (): { name: string; url: string }[] =>
  Object.entries(images)
    .filter(([k]) => k.endsWith('.webp'))
    .map(([k, url]) => ({ name: fileName(k), url }));
