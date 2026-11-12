/**
 * Dados do modo demonstração: o plano de exemplo + 6 semanas de histórico inventado
 * (treinos com carga subindo, água, refeições, medidas), sempre relativos a hoje.
 * Determinístico: a mesma data gera os mesmos números.
 */
import type { Schedule, SetLog, Workout, WorkoutSession } from '../types/workout';
import type { BodyEntry } from '../types/body';
import { samplePlan } from './samplePlan';
import { sampleWorkouts } from './sampleWorkouts';
import { sampleStretches } from './stretchRoutines';
import { toDateKey } from '../lib/date';

/** Gerador pseudoaleatório simples com semente (mesmos números a cada abertura). */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  x.setDate(x.getDate() + n);
  return x;
};

const WEEKS = 6;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function buildDemoData(today = new Date()) {
  const rand = seeded(42);
  const start = addDays(today, -WEEKS * 7);
  const workouts: Workout[] = structuredClone(sampleWorkouts);

  // treinos: seguem os dias da semana das fichas, com algumas faltas; a carga sobe aos poucos
  const sessions: WorkoutSession[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const day = addDays(start, i);
    for (const w of workouts.filter((x) => x.weekDays.includes(day.getDay()))) {
      if (rand() < 0.12) continue; // faltou
      const progress = i / (WEEKS * 7);
      const logs: Record<string, SetLog[]> = {};
      for (const ex of w.exercises) {
        const startLoad = Math.max(ex.increment, ex.currentLoad - ex.increment * 3);
        const load = roundTo(startLoad + ex.increment * 3 * progress, ex.increment);
        logs[ex.id] = Array.from({ length: ex.sets }, () => ({
          load,
          reps: ex.repMin + Math.floor(rand() * (ex.repMax - ex.repMin + 1)),
          effort: rand() < 0.7 ? 'ok' : 'dificil',
        }));
      }
      const startedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 18, 30).toISOString();
      const finishedAt = new Date(Date.parse(startedAt) + (55 + Math.floor(rand() * 20)) * 60000).toISOString();
      sessions.push({ id: `demo-${toDateKey(day)}-${w.id}`, workoutId: w.id, startedAt, finishedAt, logs });
    }
  }
  sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  // carga atual de cada ficha = a última usada
  for (const w of workouts)
    for (const ex of w.exercises) {
      const last = sessions.find((s) => s.logs[ex.id]?.length);
      if (last) ex.currentLoad = last.logs[ex.id][0].load;
    }

  // água e refeições: a maioria dos dias na meta, alguns abaixo
  const waterLog: Record<string, number[]> = {};
  const mealsDone: Record<string, string[]> = {};
  for (let i = 0; i <= WEEKS * 7; i++) {
    const key = toDateKey(addDays(start, i));
    const isToday = key === toDateKey(today);
    const cups = isToday ? 3 : rand() < 0.8 ? 10 + Math.floor(rand() * 3) : 6 + Math.floor(rand() * 3);
    waterLog[key] = Array.from({ length: cups }, () => 250);
    const meals = samplePlan.meals.map((m) => m.id);
    mealsDone[key] = isToday ? meals.slice(0, 2) : rand() < 0.85 ? meals : meals.slice(0, meals.length - 1);
  }

  // medidas a cada 2 semanas
  const body: BodyEntry[] = Array.from({ length: WEEKS / 2 + 1 }, (_, i) => {
    const date = toDateKey(addDays(start, i * 14));
    return {
      id: `demo-body-${date}`,
      date,
      weightKg: Math.round((64.8 - i * 0.3) * 10) / 10,
      measures: { cintura: 76 - i * 0.8, quadril: 98 - i * 0.4, braco: 28 + i * 0.2, coxa: 56 + i * 0.3 },
    };
  });

  // agenda: próximos 21 dias pelos dias da semana das fichas
  const schedule: Schedule = {};
  for (let i = 0; i < 21; i++) {
    const d = addDays(today, i);
    schedule[toDateKey(d)] = workouts.filter((w) => w.weekDays.includes(d.getDay())).map((w) => w.id);
  }

  return {
    diet: structuredClone(samplePlan),
    workouts,
    schedule,
    stretches: structuredClone(sampleStretches),
    sessions,
    waterLog,
    mealsDone,
    body,
    waterGoalMl: 2500,
  };
}
