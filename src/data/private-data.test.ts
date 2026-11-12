import { describe, expect, it } from 'vitest';
import { defaultPlan, defaultSchedule, defaultWorkouts, imageUrl, stretchRoutines, usingPrivateData } from '.';
import { plannedFor } from '../lib/schedule';

// Só roda quando src/data/private/ existe (no seu computador). No GitHub é pulado.
describe.skipIf(!usingPrivateData)('dados pessoais', () => {
  const ids = (y: number, m: number, d: number) => plannedFor(new Date(y, m - 1, d), defaultWorkouts, defaultSchedule).workouts.map((w) => w.id);

  it('agenda segue o padrão de semanas alternadas', () => {
    expect(ids(2026, 10, 26)).toEqual(['D']); // seg, 1ª semana
    expect(ids(2026, 11, 2)).toEqual(['A']); // seg, 2ª semana
    expect(ids(2026, 11, 10)).toEqual(['B']); // ter
    expect(ids(2026, 11, 11)).toEqual(['C']); // qua
    expect(ids(2026, 11, 13)).toEqual(['A']); // sex, 3ª semana
    expect(ids(2026, 11, 20)).toEqual(['D', 'E']); // sex, 4ª semana
    expect(ids(2026, 11, 14)).toEqual([]); // sábado: off
    expect(ids(2026, 12, 4)).toEqual(['D', 'E']); // sex, 6ª semana
  });

  it('toda ficha aponta para um alongamento que existe', () => {
    for (const w of defaultWorkouts) {
      expect(stretchRoutines.some((r) => r.id === w.stretchRoutineId)).toBe(true);
      for (const ex of w.exercises) expect(ex.setTargets?.length).toBe(ex.sets);
    }
  });

  it('todo exercício, ativação e alongamento tem foto', () => {
    for (const w of defaultWorkouts) {
      expect(imageUrl(w.warmupImage), w.warmupImage).toBeTruthy();
      for (const ex of w.exercises) expect(imageUrl(ex.image), ex.image).toBeTruthy();
      for (const c of w.cardio ?? []) expect(c.afterExercise).toBeLessThanOrEqual(w.exercises.length);
    }
    for (const r of stretchRoutines) for (const s of r.steps) expect(imageUrl(s.image), s.image).toBeTruthy();
  });

  it('todo grupo citado na dieta existe na lista de substituição', () => {
    const groupIds = new Set(defaultPlan.groups.map((g) => g.id));
    const items = defaultPlan.meals.flatMap((m) => [...m.items, ...(m.variants ?? []).flatMap((v) => v.items)]);
    for (const item of items) if (item.group) expect(groupIds.has(item.group.id)).toBe(true);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length); // ids únicos
  });
});
