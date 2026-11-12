import { machineLabel, type CardioMachine, type WorkoutSession } from '../types/workout';

/** Minutos de cardio por aparelho numa sessão (blocos sem aparelho registrado = "Cardio"). */
export function cardioByMachine(s: WorkoutSession): { machine?: CardioMachine; minutes: number }[] {
  const totals = new Map<CardioMachine | undefined, number>();
  for (const [key, minutes] of Object.entries(s.cardio ?? {})) {
    if (!minutes) continue;
    const m = s.cardioMachines?.[Number(key)];
    totals.set(m, (totals.get(m) ?? 0) + minutes);
  }
  return [...totals.entries()].map(([machine, minutes]) => ({ machine, minutes }));
}

/** "12 min na esteira + 5 min na bike". */
export function cardioText(s: WorkoutSession): string {
  const parts = cardioByMachine(s).map(({ machine, minutes }) =>
    machine ? `${minutes} min ${machine === 'bike' || machine === 'esteira' ? 'na' : 'no'} ${machineLabel(machine).toLowerCase()}` : `${minutes} min`,
  );
  return parts.join(' + ');
}

/** Total de minutos de cardio entre duas datas (inclusive), de todas as sessões. */
export function cardioMinutesBetween(sessions: WorkoutSession[], from: string, to: string): number {
  return sessions
    .filter((s) => s.finishedAt && s.startedAt.slice(0, 10) >= from && s.startedAt.slice(0, 10) <= to)
    .reduce((sum, s) => sum + Object.values(s.cardio ?? {}).reduce((a, b) => a + b, 0), 0);
}
