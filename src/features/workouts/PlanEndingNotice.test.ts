import { describe, expect, it } from 'vitest';
import { daysUntilEnd } from './PlanEndingNotice';

describe('aviso de plano acabando', () => {
  const today = new Date(2026, 10, 25);
  it('avisa nos últimos 10 dias', () => {
    expect(daysUntilEnd('2026-12-05', today)).toBe(10);
    expect(daysUntilEnd('2026-11-25', today)).toBe(0);
  });
  it('não avisa longe do fim, depois do fim ou sem agenda', () => {
    expect(daysUntilEnd('2026-12-06', today)).toBeUndefined();
    expect(daysUntilEnd('2026-11-24', today)).toBeUndefined();
    expect(daysUntilEnd(undefined, today)).toBeUndefined();
  });
});
