import { describe, expect, it } from 'vitest';
import { lastDays, weekStats, weightPace } from './weekCalories';

describe('semana de calorias', () => {
  it('lista os últimos 7 dias terminando hoje', () => {
    expect(lastDays(3, new Date(2026, 10, 1))).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });

  it('médias ignoram dias sem registro e somam o fora da dieta', () => {
    const s = weekStats(
      [
        { date: 'a', eaten: 1200, protein: 80, burned: 300, offPlan: 190 },
        { date: 'b', eaten: 0, protein: 0, burned: 0, offPlan: 0 },
        { date: 'c', eaten: 1500, protein: 60, burned: 0, offPlan: 430 },
      ],
      1300,
    );
    expect(s).toEqual({ logged: 2, avgEaten: 1350, avgProtein: 70, withinGoal: 1, burned: 300, offPlanDays: 2, offPlanKcal: 620 });
  });
});

describe('ritmo do peso', () => {
  const today = new Date(2026, 10, 20);
  it('kg por semana pela reta dos pesos', () => {
    const p = weightPace(
      [
        { date: '2026-11-06', weightKg: 70 },
        { date: '2026-11-13', weightKg: 69.6 },
        { date: '2026-11-20', weightKg: 69.2 },
      ],
      today,
    );
    expect(p).toEqual({ kgPerWeek: -0.4, from: '2026-11-06', to: '2026-11-20', points: 3 });
  });
  it('poucos pesos ou pouco tempo: sem ritmo (é só oscilação)', () => {
    expect(weightPace([{ date: '2026-11-19', weightKg: 70 }, { date: '2026-11-20', weightKg: 69 }], today)).toBeUndefined();
    expect(
      weightPace([{ date: '2026-11-17', weightKg: 70 }, { date: '2026-11-18', weightKg: 69.5 }, { date: '2026-11-20', weightKg: 69 }], today),
    ).toBeUndefined();
    expect(weightPace([{ date: '2026-11-06' }, { date: '2026-11-13', weightKg: 69.6 }, { date: '2026-11-20', weightKg: 69.2 }], today)).toBeUndefined();
  });
});
