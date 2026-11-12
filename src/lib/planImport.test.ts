import { describe, expect, it } from 'vitest';
import { applyPlan, mergeWorkouts, parsePlanFile, summarize, PLAN_FORMAT, type CurrentPlan, type PlanFile } from './planImport';
import { samplePlan } from '../data/samplePlan';
import { sampleWorkouts } from '../data/sampleWorkouts';
import { sampleStretches } from '../data/stretchRoutines';
import type { Workout } from '../types/workout';

const current: CurrentPlan = { diet: samplePlan, workouts: sampleWorkouts, schedule: { '2026-11-01': ['treino-a'] }, stretches: sampleStretches };
const file = (p: Partial<PlanFile>) => JSON.stringify({ format: PLAN_FORMAT, version: 1, ...p });
const clone = <T,>(x: T): T => structuredClone(x);

describe('parsePlanFile', () => {
  it('aceita um plano completo e válido', () => {
    const r = parsePlanFile(file({ diet: samplePlan, workouts: sampleWorkouts, schedule: { '2026-12-01': ['treino-b'] }, stretches: sampleStretches }), current);
    expect(r.ok).toBe(true);
  });

  it('recusa arquivo que não é JSON ou não é um plano', () => {
    expect(parsePlanFile('oi', current)).toMatchObject({ ok: false });
    expect(parsePlanFile('{"a":1}', current)).toMatchObject({ ok: false, error: expect.stringContaining('não é um plano') });
  });

  it('recusa plano de versão mais nova e arquivo vazio', () => {
    expect(parsePlanFile(file({ version: 99, diet: samplePlan }), current)).toMatchObject({ ok: false });
    expect(parsePlanFile(file({}), current)).toMatchObject({ ok: false, error: expect.stringContaining('nada para importar') });
  });

  it('a agenda só pode usar fichas que existem', () => {
    const r = parsePlanFile(file({ schedule: { '2026-12-01': ['treino-z'] } }), current);
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('treino-z') });
  });

  it('a agenda pode usar fichas novas do mesmo arquivo', () => {
    const novo: Workout = { ...clone(sampleWorkouts[0]), id: 'treino-z', name: 'Treino Z' };
    expect(parsePlanFile(file({ workouts: [novo], schedule: { '2026-12-01': ['treino-z'] } }), current).ok).toBe(true);
  });

  it('confere grupos de substituição, exercícios e fotos', () => {
    const diet = clone(samplePlan);
    diet.meals[0].items[1].group = { id: 'nao-existe', portions: 1 };
    expect(parsePlanFile(file({ diet }), current)).toMatchObject({ ok: false, error: expect.stringContaining('nao-existe') });

    const ws = clone(sampleWorkouts);
    ws[0].exercises[0].repMin = 20;
    expect(parsePlanFile(file({ workouts: ws }), current)).toMatchObject({ ok: false, error: expect.stringContaining('invertida') });

    expect(parsePlanFile(file({ images: [{ name: '../x', data: 'AAAA' }] }), current)).toMatchObject({ ok: false });
    expect(parsePlanFile(file({ images: [{ name: 'A1', data: 'AAAA' }] }), current).ok).toBe(true);
  });
});

describe('mergeWorkouts', () => {
  it('exercício que continua mantém id (histórico) e carga atual, mesmo com acento ou maiúscula diferente', () => {
    const incoming = clone(sampleWorkouts);
    incoming[0].exercises = [
      { ...incoming[0].exercises[0], id: 'novo-1', name: 'SUPINO RETO com barra', currentLoad: 0 },
      { id: 'novo-2', name: 'Flexão de braço', sets: 3, repMin: 10, repMax: 15, restSeconds: 60, increment: 0, currentLoad: 0 },
    ];
    const { workouts, kept } = mergeWorkouts(sampleWorkouts, incoming);
    expect(workouts[0].exercises[0]).toMatchObject({ id: 'a1', currentLoad: 30 });
    expect(workouts[0].exercises[1].id).toBe('novo-2');
    expect(kept).toBeGreaterThanOrEqual(1);
  });

  it('acha o exercício mesmo se ele mudou de ficha', () => {
    const incoming: Workout[] = [{ id: 'treino-novo', name: 'Novo', weekDays: [], exercises: [{ ...clone(sampleWorkouts[1].exercises[1]), id: 'x' }] }];
    expect(mergeWorkouts(sampleWorkouts, incoming).workouts[0].exercises[0].id).toBe('b2');
  });

  it('nunca repete id dentro da mesma ficha', () => {
    const ex = clone(sampleWorkouts[0].exercises[0]);
    const incoming: Workout[] = [{ id: 'treino-a', name: 'A', weekDays: [], exercises: [{ ...ex, id: 'p1' }, { ...ex, id: 'p2' }] }];
    const ids = mergeWorkouts(sampleWorkouts, incoming).workouts[0].exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('summarize e applyPlan', () => {
  it('resume o que muda', () => {
    const ws = clone(sampleWorkouts).slice(0, 2);
    ws[1].exercises.pop();
    const diet = clone(samplePlan);
    diet.meals = diet.meals.slice(1);
    const s = summarize({ format: PLAN_FORMAT, version: 1, workouts: ws, diet, schedule: { '2026-12-01': [], '2026-12-31': [] } }, current);
    expect(s.workouts).toContain('Treino A · Peito e tríceps: mesmos exercícios');
    expect(s.workouts).toContain('Treino B · Pernas: –1');
    expect(s.workouts?.some((l) => l.includes('sai da lista'))).toBe(true);
    expect(s.diet).toContain('Café da manhã: sai do plano');
    expect(s.schedule).toBe('2 dias, de 01/12 a 31/12');
  });

  it('agenda nova junta com a antiga; o que não veio no arquivo fica igual', () => {
    const next = applyPlan({ format: PLAN_FORMAT, version: 1, schedule: { '2026-12-01': ['treino-b'] } }, current);
    expect(next.schedule).toEqual({ '2026-11-01': ['treino-a'], '2026-12-01': ['treino-b'] });
    expect(next.diet).toBe(current.diet);
    expect(next.workouts).toBe(current.workouts);
  });
});
