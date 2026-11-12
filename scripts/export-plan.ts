/**
 * Gera o arquivo do plano (.json) para o botão "Importar plano" do app,
 * a partir dos dados em src/data/private/ (dieta.ts, treinos.ts e images/).
 *
 *   npx vite-node scripts/export-plan.ts -- --label "Plano de dezembro" --out plano-dez.json
 *   opções: --only diet,workouts,schedule,stretches   (padrão: tudo)
 *           --images A1,inf-03 | all | none            (padrão: none)
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultPlan, defaultSchedule, defaultStretches, defaultWorkouts, usingPrivateData } from '../src/data';
import { PLAN_FORMAT, PLAN_VERSION, parsePlanFile, type PlanFile } from '../src/lib/planImport';
import { samplePlan } from '../src/data/samplePlan';
import { sampleWorkouts } from '../src/data/sampleWorkouts';
import { sampleStretches } from '../src/data/stretchRoutines';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (!usingPrivateData) throw new Error('src/data/private não encontrado: nada para exportar.');

const only = new Set((opt('only') ?? 'diet,workouts,schedule,stretches').split(','));
const imagesDir = join(process.cwd(), 'src/data/private/images');
const imageOpt = opt('images') ?? 'none';
const allImages = readdirSync(imagesDir).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, ''));
const imageNames = imageOpt === 'all' ? allImages : imageOpt === 'none' ? [] : imageOpt.split(',');

const plan: PlanFile = {
  format: PLAN_FORMAT,
  version: PLAN_VERSION,
  label: opt('label'),
  diet: only.has('diet') ? defaultPlan : undefined,
  workouts: only.has('workouts') ? defaultWorkouts : undefined,
  schedule: only.has('schedule') ? defaultSchedule : undefined,
  stretches: only.has('stretches') ? defaultStretches : undefined,
  images: imageNames.length
    ? imageNames.map((name) => ({ name, data: readFileSync(join(imagesDir, `${name}.webp`)).toString('base64') }))
    : undefined,
};

// confere com as mesmas regras do app. Exportando tudo, confere contra os exemplos (o arquivo precisa
// se bastar); exportando só uma parte, contra o plano atual (é o que estará no app ao importar).
const full = ['diet', 'workouts', 'schedule', 'stretches'].every((k) => only.has(k));
const base = full
  ? { diet: samplePlan, workouts: sampleWorkouts, schedule: {}, stretches: sampleStretches }
  : { diet: defaultPlan, workouts: defaultWorkouts, schedule: defaultSchedule, stretches: defaultStretches };
const check = parsePlanFile(JSON.stringify(plan), base);
if (!check.ok) throw new Error(`Plano inválido: ${check.error}`);

const out = opt('out') ?? 'plano.json';
writeFileSync(out, JSON.stringify(plan));
console.log(`${out} gerado (${(JSON.stringify(plan).length / 1024).toFixed(0)} KB)`);
