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
export const stretchRoutines: StretchRoutine[] = training?.privateStretches ?? sampleStretches;
export const usingPrivateData = Boolean(diet || training);

// Fotos de exercícios e alongamentos (também privadas): ./private/images/<nome>.webp
const images = import.meta.glob<string>('./private/images/*.{webp,jpg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** URL da foto pelo nome sem extensão ("A1", "inf-03"), ou undefined se não existir. */
export function imageUrl(name?: string): string | undefined {
  if (!name) return undefined;
  const key = Object.keys(images).find((k) => k.replace(/^.*\//, '').replace(/\.\w+$/, '') === name);
  return key ? images[key] : undefined;
}
