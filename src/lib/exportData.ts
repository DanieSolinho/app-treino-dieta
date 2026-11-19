/** "Baixar meus dados": tudo o que o app guarda sobre você, num arquivo legível (backup e RGPD). */
import { useDietStore } from '../stores/useDietStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useDayStore } from '../stores/useDayStore';
import { useBodyStore } from '../stores/useBodyStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { toDateKey } from './date';
import { PLAN_FORMAT, PLAN_VERSION, type PlanFile } from './planImport';

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
    days: { mealsDone: d.mealsDone, waterLog: d.waterLog, swaps: d.swaps, variants: d.variants, amounts: d.amounts, offPlan: d.offPlan },
    body: useBodyStore.getState().entries,
  };
}

export const backupFileName = (today = new Date()) => `treino-dieta-meus-dados-${toDateKey(today)}.json`;

/**
 * O plano atual (dieta, fichas, agenda e alongamentos) no formato do "Importar plano".
 * É a cópia de segurança que dá para reimportar neste ou em outro aparelho.
 */
export function collectPlanFile(today = new Date()): PlanFile {
  const w = useWorkoutStore.getState();
  return {
    format: PLAN_FORMAT,
    version: PLAN_VERSION,
    label: `Backup de ${today.toLocaleDateString('pt-BR')}`,
    diet: useDietStore.getState().plan,
    workouts: w.workouts,
    schedule: w.schedule,
    stretches: w.stretches,
  };
}

export const planFileName = (today = new Date()) => `treino-dieta-plano-${toDateKey(today)}.json`;

export function downloadPlanFile() {
  downloadJson(collectPlanFile(), planFileName());
}

/** Gera o download no navegador (no iPhone abre a folha de compartilhar/salvar). */
export function downloadMyData(account?: { email?: string; displayName?: string }) {
  downloadJson(collectMyData(account), backupFileName());
}

function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
