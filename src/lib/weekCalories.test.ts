import { describe, expect, it } from 'vitest';
import { lastDays, weekStats } from './weekCalories';

describe('semana de calorias', () => {
  it('lista os últimos 7 dias terminando hoje', () => {
    expect(lastDays(3, new Date(2026, 10, 1))).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });

  it('médias ignoram dias sem registro', () => {
    const s = weekStats(
      [
        { date: 'a', eaten: 1200, protein: 80, burned: 300 },
        { date: 'b', eaten: 0, protein: 0, burned: 0 },
        { date: 'c', eaten: 1500, protein: 60, burned: 0 },
      ],
      1300,
    );
    expect(s).toEqual({ logged: 2, avgEaten: 1350, avgProtein: 70, withinGoal: 1, burned: 300 });
  });
});
