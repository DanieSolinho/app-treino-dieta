import { describe, expect, it } from 'vitest';
import { countStreak } from './streak';

const today = new Date(2026, 10, 10); // 10/11/2026
const doneDays = (...keys: string[]) => (key: string) => keys.includes(key);

describe('countStreak', () => {
  it('conta dias seguidos incluindo hoje', () => {
    expect(countStreak(doneDays('2026-11-10', '2026-11-09', '2026-11-08'), today)).toBe(3);
  });

  it('não zera se hoje ainda não foi cumprido', () => {
    expect(countStreak(doneDays('2026-11-09', '2026-11-08'), today)).toBe(2);
  });

  it('para no primeiro dia que falhou', () => {
    expect(countStreak(doneDays('2026-11-10', '2026-11-08'), today)).toBe(1);
  });

  it('atravessa a virada do mês', () => {
    const dec2 = new Date(2026, 11, 2);
    expect(countStreak(doneDays('2026-12-02', '2026-12-01', '2026-11-30'), dec2)).toBe(3);
  });

  it('zero quando nada foi cumprido', () => {
    expect(countStreak(() => false, today)).toBe(0);
  });
});
