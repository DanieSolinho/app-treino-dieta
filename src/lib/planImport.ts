/**
 * "Importar plano": um arquivo .json com a dieta, as fichas, a agenda, os alongamentos
 * e (opcional) fotos novas. Tudo aqui é puro (sem stores), para ser testado.
 */
import type { DietPlan, Food, Meal, MealItem } from '../types/diet';
import type { Exercise, Schedule, Workout } from '../types/workout';
import type { StretchRoutine } from '../data/stretchRoutines';

export const PLAN_FORMAT = 'treino-dieta-plano';
export const PLAN_VERSION = 1;

export interface PlanImage {
  name: string; // sem extensão: "A1", "inf-03"
  data: string; // base64 de um .webp
}

export interface PlanFile {
  format: typeof PLAN_FORMAT;
  version: number;
  label?: string; // "Plano de dezembro"
  diet?: DietPlan;
  workouts?: Workout[];
  schedule?: Schedule;
  stretches?: StretchRoutine[];
  images?: PlanImage[];
}

export interface CurrentPlan {
  diet: DietPlan;
  workouts: Workout[];
  schedule: Schedule;
  stretches: StretchRoutine[];
}

export type ParseResult = { ok: true; plan: PlanFile } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Validação: o arquivo vem de fora, então nada é confiado sem checar
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_NAME = /^[A-Za-z0-9_-]{1,60}$/;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

class Invalid extends Error {}
function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Invalid(msg);
}

function checkFood(f: unknown, where: string) {
  need(isObj(f) && isStr(f.name), `${where}: alimento sem nome.`);
  const food = f as unknown as Food;
  need(food.qty === null || isNum(food.qty), `${where}: quantidade inválida em "${food.name}".`);
  need(typeof food.measure === 'string', `${where}: medida inválida em "${food.name}".`);
}

function checkItems(items: unknown, where: string, groupIds: Set<string>) {
  need(Array.isArray(items), `${where}: lista de alimentos ausente.`);
  for (const it of items as unknown[]) {
    need(isObj(it) && isStr(it.id), `${where}: item sem id.`);
    const item = it as unknown as MealItem;
    checkFood(item.food, where);
    item.options?.forEach((o) => checkFood(o, where));
    if (item.group) need(groupIds.has(item.group.id), `${where}: grupo de substituição "${item.group.id}" não existe na lista.`);
  }
}

function checkDiet(d: unknown) {
  need(isObj(d) && Array.isArray(d.meals) && Array.isArray(d.groups), 'Dieta: faltam as refeições ou a lista de substituição.');
  const diet = d as unknown as DietPlan;
  need(diet.meals.length > 0, 'Dieta: nenhuma refeição.');
  const groupIds = new Set<string>();
  for (const g of diet.groups) {
    need(isObj(g) && isStr(g.id) && isStr(g.name) && Array.isArray(g.options), 'Lista de substituição: grupo inválido.');
    g.options.forEach((o) => checkFood(o, `Grupo ${g.name}`));
    groupIds.add(g.id);
  }
  const mealIds = new Set<string>();
  for (const m of diet.meals as unknown[]) {
    need(isObj(m) && isStr(m.id) && isStr(m.name), 'Dieta: refeição sem nome.');
    const meal = m as unknown as Meal;
    need(!mealIds.has(meal.id), `Dieta: refeição repetida (${meal.name}).`);
    mealIds.add(meal.id);
    checkItems(meal.items, meal.name, groupIds);
    meal.variants?.forEach((v) => checkItems(v.items, `${meal.name} (${v.label})`, groupIds));
  }
}

function checkExercise(e: unknown, where: string) {
  need(isObj(e) && isStr(e.id) && isStr(e.name), `${where}: exercício sem nome.`);
  const ex = e as unknown as Exercise;
  for (const k of ['sets', 'repMin', 'repMax', 'restSeconds', 'increment', 'currentLoad'] as const)
    need(isNum(ex[k]) && ex[k] >= 0, `${where}: "${ex.name}" com ${k} inválido.`);
  need(ex.repMin <= ex.repMax, `${where}: "${ex.name}" com faixa de repetições invertida.`);
}

function checkWorkouts(ws: unknown, stretchIds: Set<string>) {
  need(Array.isArray(ws) && ws.length > 0, 'Treinos: nenhuma ficha.');
  const ids = new Set<string>();
  for (const w of ws as unknown[]) {
    need(isObj(w) && isStr(w.id) && isStr(w.name) && Array.isArray(w.exercises), 'Treinos: ficha inválida.');
    const workout = w as unknown as Workout;
    need(!ids.has(workout.id), `Treinos: ficha repetida (${workout.name}).`);
    ids.add(workout.id);
    need(Array.isArray(workout.weekDays), `${workout.name}: dias da semana ausentes.`);
    workout.exercises.forEach((e) => checkExercise(e, workout.name));
    const exIds = workout.exercises.map((e) => e.id);
    need(new Set(exIds).size === exIds.length, `${workout.name}: exercício repetido.`);
    if (workout.stretchRoutineId)
      need(stretchIds.has(workout.stretchRoutineId), `${workout.name}: alongamento "${workout.stretchRoutineId}" não existe.`);
  }
}

function checkStretches(ss: unknown) {
  need(Array.isArray(ss), 'Alongamentos inválidos.');
  for (const s of ss as unknown[]) {
    need(isObj(s) && isStr(s.id) && isStr(s.name) && Array.isArray(s.steps) && s.steps.length > 0, 'Alongamento inválido.');
    for (const st of s.steps as unknown[])
      need(isObj(st) && isStr(st.name) && (isNum(st.seconds) || isStr(st.reps)), `${s.name}: movimento sem tempo nem repetições.`);
  }
}

function checkSchedule(s: unknown, workoutIds: Set<string>) {
  need(isObj(s), 'Agenda inválida.');
  for (const [date, ids] of Object.entries(s)) {
    need(DATE.test(date), `Agenda: data inválida (${date}).`);
    need(Array.isArray(ids) && ids.every(isStr), `Agenda: dia ${date} inválido.`);
    for (const id of ids as string[]) need(workoutIds.has(id), `Agenda: o dia ${date} usa a ficha "${id}", que não existe.`);
  }
}

const base64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4);

function checkImages(imgs: unknown) {
  need(Array.isArray(imgs), 'Fotos inválidas.');
  for (const i of imgs as unknown[]) {
    need(isObj(i) && typeof i.name === 'string' && IMAGE_NAME.test(i.name), 'Foto com nome inválido.');
    need(typeof i.data === 'string' && /^[A-Za-z0-9+/=]+$/.test(i.data), `Foto ${i.name}: conteúdo inválido.`);
    need(base64Bytes(i.data as string) <= MAX_IMAGE_BYTES, `Foto ${i.name}: maior que 2 MB.`);
  }
}

/** Lê e confere o arquivo. As referências (agenda → fichas, ficha → alongamento) valem contra o arquivo + o plano atual. */
export function parsePlanFile(text: string, current: CurrentPlan): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Este arquivo não é um plano válido (não é JSON).' };
  }
  try {
    need(isObj(raw) && raw.format === PLAN_FORMAT, 'Este arquivo não é um plano do Treino & Dieta.');
    const p = raw as unknown as PlanFile;
    need(isNum(p.version) && p.version <= PLAN_VERSION, 'Este plano foi feito para uma versão mais nova do app. Atualize a página e tente de novo.');
    need(p.diet || p.workouts || p.schedule || p.stretches || p.images?.length, 'O arquivo não tem nada para importar.');

    if (p.stretches) checkStretches(p.stretches);
    const stretches = p.stretches ?? current.stretches;
    if (p.diet) checkDiet(p.diet);
    if (p.workouts) checkWorkouts(p.workouts, new Set(stretches.map((s) => s.id)));
    const workouts = p.workouts ?? current.workouts;
    if (p.schedule) checkSchedule(p.schedule, new Set(workouts.map((w) => w.id)));
    if (p.images) checkImages(p.images);
    return { ok: true, plan: p };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Juntar com o que existe: o histórico e as cargas continuam
// ---------------------------------------------------------------------------

export const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Exercício que já existia (mesmo nome, ignorando acentos e maiúsculas) mantém o id —
 * assim o histórico e a sugestão de carga continuam — e a carga atual, se você já tinha uma.
 * Procura primeiro na mesma ficha, depois em qualquer ficha.
 */
export function mergeWorkouts(current: Workout[], incoming: Workout[]): { workouts: Workout[]; kept: number } {
  const anywhere = new Map<string, Exercise>();
  for (const w of current) for (const e of w.exercises) if (!anywhere.has(normalizeName(e.name))) anywhere.set(normalizeName(e.name), e);
  let kept = 0;

  const workouts = incoming.map((w) => {
    const sameWorkout = new Map(
      (current.find((c) => c.id === w.id)?.exercises ?? []).map((e) => [normalizeName(e.name), e] as const),
    );
    const used = new Set<string>();
    const exercises = w.exercises.map((e) => {
      const old = sameWorkout.get(normalizeName(e.name)) ?? anywhere.get(normalizeName(e.name));
      if (!old || used.has(old.id) || w.exercises.some((o) => o !== e && o.id === old.id)) {
        used.add(e.id);
        return e;
      }
      used.add(old.id);
      kept++;
      return { ...e, id: old.id, currentLoad: old.currentLoad > 0 ? old.currentLoad : e.currentLoad };
    });
    return { ...w, exercises };
  });
  return { workouts, kept };
}

/** Datas novas substituem as mesmas datas; as outras ficam como estavam. */
export const mergeSchedule = (current: Schedule, incoming: Schedule): Schedule => ({ ...current, ...incoming });

// ---------------------------------------------------------------------------
// Resumo do que muda (mostrado antes de aplicar)
// ---------------------------------------------------------------------------

export interface PlanSummary {
  diet?: string[];
  workouts?: string[];
  schedule?: string;
  stretches?: string;
  images?: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const foodsOf = (m: Meal) =>
  new Set([...m.items, ...(m.variants ?? []).flatMap((v) => v.items)].map((i) => normalizeName(i.food.name)));
const shortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export function summarize(plan: PlanFile, current: CurrentPlan): PlanSummary {
  const out: PlanSummary = {};

  if (plan.diet) {
    const lines: string[] = [];
    const before = new Map(current.diet.meals.map((m) => [normalizeName(m.name), m]));
    for (const m of plan.diet.meals) {
      const old = before.get(normalizeName(m.name));
      if (!old) {
        lines.push(`${m.name}: nova refeição`);
        continue;
      }
      before.delete(normalizeName(m.name));
      const a = foodsOf(old);
      const b = foodsOf(m);
      const added = [...b].filter((x) => !a.has(x)).length;
      const removed = [...a].filter((x) => !b.has(x)).length;
      if (added || removed)
        lines.push(`${m.name}: ${[added && `+${plural(added, 'alimento', 'alimentos')}`, removed && `–${removed}`].filter(Boolean).join(', ')}`);
      else if (JSON.stringify(old.items) !== JSON.stringify(m.items)) lines.push(`${m.name}: quantidades ajustadas`);
    }
    before.forEach((m) => lines.push(`${m.name}: sai do plano`));
    const groups = plan.diet.groups.reduce((n, g) => n + g.options.length, 0);
    lines.push(`Lista de substituição: ${plural(plan.diet.groups.length, 'grupo', 'grupos')}, ${plural(groups, 'opção', 'opções')}`);
    out.diet = lines.length > 1 ? lines : ['Sem mudanças nas refeições', ...lines];
  }

  if (plan.workouts) {
    const lines: string[] = [];
    const before = new Map(current.workouts.map((w) => [w.id, w]));
    for (const w of plan.workouts) {
      const old = before.get(w.id);
      if (!old) {
        lines.push(`${w.name}: nova ficha (${plural(w.exercises.length, 'exercício', 'exercícios')})`);
        continue;
      }
      before.delete(w.id);
      const a = new Set(old.exercises.map((e) => normalizeName(e.name)));
      const b = new Set(w.exercises.map((e) => normalizeName(e.name)));
      const added = [...b].filter((x) => !a.has(x)).length;
      const removed = [...a].filter((x) => !b.has(x)).length;
      lines.push(
        added || removed
          ? `${w.name}: ${[added && `+${plural(added, 'exercício', 'exercícios')}`, removed && `–${removed}`].filter(Boolean).join(', ')}`
          : `${w.name}: mesmos exercícios`,
      );
    }
    before.forEach((w) => lines.push(`${w.name}: sai da lista (o histórico continua)`));
    out.workouts = lines;
  }

  if (plan.schedule) {
    const dates = Object.keys(plan.schedule).sort();
    out.schedule = dates.length
      ? `${plural(dates.length, 'dia', 'dias')}, de ${shortDate(dates[0])} a ${shortDate(dates[dates.length - 1])}`
      : 'Nenhum dia';
  }
  if (plan.stretches) out.stretches = plural(plan.stretches.length, 'rotina', 'rotinas');
  if (plan.images?.length) out.images = plural(plan.images.length, 'foto', 'fotos');
  return out;
}

/** O plano que fica valendo depois de importar. */
export function applyPlan(plan: PlanFile, current: CurrentPlan): CurrentPlan & { keptExercises: number } {
  const merged = plan.workouts ? mergeWorkouts(current.workouts, plan.workouts) : { workouts: current.workouts, kept: 0 };
  return {
    diet: plan.diet ?? current.diet,
    workouts: merged.workouts,
    schedule: plan.schedule ? mergeSchedule(current.schedule, plan.schedule) : current.schedule,
    stretches: plan.stretches ?? current.stretches,
    keptExercises: merged.kept,
  };
}
