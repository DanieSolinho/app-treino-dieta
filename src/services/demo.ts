/**
 * Modo demonstração: abre o app com dados de exemplo, sem conta e sem servidor.
 * Para quem quer conhecer o app (portfólio). Nada daqui sobe para o Supabase.
 */
import { useDietStore } from '../stores/useDietStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useDayStore } from '../stores/useDayStore';
import { useBodyStore } from '../stores/useBodyStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { buildDemoData } from '../data/demo';
import { DEMO_KEY, useAuth, type Result } from './auth';
import { resetLocalData, useSyncMeta } from './sync/engine';
import { isDirty } from './sync/types';
import { clearImageLinks } from './images';

export function enterDemo(): Result {
  const meta = useSyncMeta.getState();
  // segurança: nunca apagar alterações de uma conta que ainda não foram enviadas
  if (meta.owner && isDirty(meta.dirty))
    return { ok: false, error: 'Este aparelho tem alterações da sua conta que ainda não foram enviadas. Entre na conta para enviá-las antes.' };

  resetLocalData();
  clearImageLinks();
  const d = buildDemoData();
  useDietStore.setState({ plan: d.diet });
  useWorkoutStore.setState({ workouts: d.workouts, schedule: d.schedule, stretches: d.stretches, sessions: d.sessions, active: null });
  useDayStore.setState({ waterLog: d.waterLog, mealsDone: d.mealsDone, swaps: {}, variants: {} });
  useBodyStore.setState({ entries: d.body });
  useSettingsStore.setState({ waterGoalMl: d.waterGoalMl });
  try {
    localStorage.setItem(DEMO_KEY, '1');
  } catch {
    /* navegador sem armazenamento: a demonstração dura até fechar a aba */
  }
  useAuth.setState({ status: 'demo', user: null });
  return { ok: true };
}

export function exitDemo() {
  resetLocalData();
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignora */
  }
  useAuth.setState({ status: 'deslogada', user: null });
}
