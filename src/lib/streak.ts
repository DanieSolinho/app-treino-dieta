import { toDateKey } from './date';

/**
 * Conta quantos dias seguidos foram cumpridos, de hoje para trás.
 * Se hoje ainda não foi cumprido, a contagem começa ontem — assim o streak
 * não "zera" logo de manhã, só se o dia anterior falhou.
 */
export function countStreak(isDone: (dateKey: string) => boolean, today: Date = new Date()): number {
  const day = new Date(today);
  if (!isDone(toDateKey(day))) day.setDate(day.getDate() - 1);

  let streak = 0;
  while (isDone(toDateKey(day)) && streak < 3650) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}
