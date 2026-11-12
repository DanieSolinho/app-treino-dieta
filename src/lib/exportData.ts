/** "Baixar meus dados": tudo o que o app guarda sobre você, num arquivo legível (backup e RGPD). */
import { useDietStore } from '../stores/useDietStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useDayStore } from '../stores/useDayStore';
import { useBodyStore } from '../stores/useBodyStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { toDateKey } from './date';

export function collectMyData(account?: { email?: string; displayName?: string }) {
  const w = useWorkoutStore.getState();
  const d = useDayStore.getState();
  return {
    format: 'treino-dieta-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    account: account ?? null,
    settings: { waterGoalMl: useSettingsStore.getState().waterGoalMl },
    diet: useDietStore.getState().plan,
    workouts: w.workouts,
    schedule: w.schedule,
    stretches: w.stretches,
    sessions: w.sessions.filter((s) => s.finishedAt),
    days: { mealsDone: d.mealsDone, waterLog: d.waterLog, swaps: d.swaps, variants: d.variants },
    body: useBodyStore.getState().entries,
  };
}

export const backupFileName = (today = new Date()) => `treino-dieta-meus-dados-${toDateKey(today)}.json`;

/** Gera o download no navegador (no iPhone abre a folha de compartilhar/salvar). */
export function downloadMyData(account?: { email?: string; displayName?: string }) {
  const blob = new Blob([JSON.stringify(collectMyData(account), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
