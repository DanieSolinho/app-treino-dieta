import { describe, expect, it } from 'vitest';
import { badges, bestDayStreak, bestWeekStreak, lastWeekRange, sessionMilestone, sessionRecords, weekSummary } from './achievements';
import { toDateKey } from './date';
import type { WorkoutSession } from '../types/workout';

const s = (id: string, date: string, logs: Record<string, number[]>): WorkoutSession => ({
  id,
  workoutId: 'treino-a',
  startedAt: `${date}T18:00:00`,
  finishedAt: `${date}T19:00:00`,
  logs: Object.fromEntries(Object.entries(logs).map(([k, loads]) => [k, loads.map((load) => ({ load, reps: 10 }))])),
});

describe('ao finalizar', () => {
  const history = [s('1', '2026-11-02', { agach: [40, 40] }), s('2', '2026-11-05', { agach: [42.5], leg: [100] })];

  it('recorde só quando supera todas as sessões anteriores', () => {
    const now = s('3', '2026-11-09', { agach: [45, 42.5], leg: [100], novo: [10] });
    expect(sessionRecords(now, [...history, now])).toEqual([{ exerciseId: 'agach', load: 45, previous: 42.5 }]);
  });

  it('marcos: 1º e 10º treino', () => {
    expect(sessionMilestone(history[0], history)).toBe(1);
    expect(sessionMilestone(history[1], history)).toBeNull();
    const ten = Array.from({ length: 10 }, (_, i) => s(`x${i}`, `2026-10-${String(i + 1).padStart(2, '0')}`, {}));
    expect(sessionMilestone(ten[9], ten)).toBe(10);
  });
});

describe('semana passada', () => {
  it('vai de segunda a domingo da semana anterior', () => {
    const { from, to } = lastWeekRange(new Date(2026, 10, 12)); // quinta, 12/11
    expect(toDateKey(from)).toBe('2026-11-02');
    expect(toDateKey(to)).toBe('2026-11-08');
    expect(toDateKey(lastWeekRange(new Date(2026, 10, 9)).from)).toBe('2026-11-02'); // segunda
  });

  it('conta treinos, dias de água e cargas que subiram', () => {
    const sessions = [s('0', '2026-10-28', { agach: [40] }), s('1', '2026-11-03', { agach: [45] }), s('2', '2026-11-06', { leg: [100] })];
    const water: Record<string, number> = { '2026-11-02': 2500, '2026-11-03': 3000, '2026-11-04': 1000 };
    const r = weekSummary(sessions, (d) => water[d] ?? 0, 2500, new Date(2026, 10, 12));
    expect(r).toEqual({ from: '2026-11-02', to: '2026-11-08', workouts: 2, waterDays: 2, loadUps: 1 });
  });
});

describe('medalhas', () => {
  it('sequência de dias e de semanas', () => {
    expect(bestDayStreak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05'], () => true)).toBe(3);
    expect(bestDayStreak(['2026-11-30', '2026-12-01'], () => true)).toBe(2); // vira o mês
    const week = (mon: string) => [0, 2, 4].map((d, i) => s(`${mon}${i}`, toDateKey(new Date(new Date(`${mon}T12:00:00`).getTime() + d * 864e5)), {}));
    expect(bestWeekStreak([...week('2026-10-19'), ...week('2026-10-26'), ...week('2026-11-09')])).toBe(2);
  });

  it('mostra as conquistadas e a próxima de cada trilha', () => {
    const sessions = Array.from({ length: 12 }, (_, i) => s(`t${i}`, `2026-10-${String(i + 1).padStart(2, '0')}`, {}));
    const list = badges({ sessions, waterDates: [], waterByDate: () => 0, waterGoal: 2500, exerciseIds: [] });
    expect(list.find((b) => b.id === 'treinos-10')?.unlocked).toBe(true);
    expect(list.find((b) => b.id === 'treinos-25')).toMatchObject({ unlocked: false, progress: '12 de 25' });
    expect(list.find((b) => b.id === 'agua-3')).toMatchObject({ unlocked: false, progress: '0 de 3' });
  });
});
