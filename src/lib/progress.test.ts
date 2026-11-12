import { describe, expect, it } from 'vitest';
import { change, exerciseHistory, formatShortDate, personalRecords, weightSeries } from './progress';
import type { WorkoutSession } from '../types/workout';

const session = (date: string, logs: WorkoutSession['logs'], finished = true): WorkoutSession => ({
  id: date,
  workoutId: 'a',
  startedAt: `${date}T18:00:00.000Z`,
  finishedAt: finished ? `${date}T19:00:00.000Z` : undefined,
  logs,
});

// sessions ficam salvas da mais recente para a mais antiga
const sessions = [
  session('2026-11-10', { supino: [{ load: 25, reps: 8 }, { load: 22.5, reps: 10 }] }),
  session('2026-11-06', { supino: [{ load: 22.5, reps: 12 }], leg: [{ load: 100, reps: 12 }] }),
  session('2026-11-03', { supino: [{ load: 20, reps: 12 }], leg: [{ load: 100, reps: 10 }] }),
  session('2026-11-11', { supino: [{ load: 90, reps: 1 }] }, false), // não finalizada
];

describe('progresso', () => {
  it('histórico usa a maior carga de cada sessão, em ordem de data', () => {
    expect(exerciseHistory(sessions, 'supino')).toEqual([
      { date: '2026-11-03', value: 20 },
      { date: '2026-11-06', value: 22.5 },
      { date: '2026-11-10', value: 25 },
    ]);
  });

  it('recordes só aparecem quando a carga evoluiu', () => {
    const prs = personalRecords(sessions, ['supino', 'leg', 'inexistente']);
    expect(prs).toEqual([{ exerciseId: 'supino', best: 25, first: 20, date: '2026-11-10' }]);
  });

  it('variação de peso entre o primeiro e o último registro', () => {
    const series = weightSeries([
      { id: '1', date: '2026-10-01', weightKg: 70 },
      { id: '2', date: '2026-10-15' }, // só medidas
      { id: '3', date: '2026-11-01', weightKg: 68.4 },
    ]);
    expect(series).toHaveLength(2);
    expect(change(series)).toBe(-1.6);
    expect(change(series.slice(0, 1))).toBeNull();
  });

  it('formata datas curtas', () => {
    expect(formatShortDate('2026-11-03')).toBe('3 nov');
  });
});
