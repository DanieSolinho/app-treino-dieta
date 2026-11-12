/**
 * Lembretes de água e de treino (notificações push).
 * O aparelho se inscreve aqui; quem decide e envia é a função send-reminders no Supabase.
 */
import { supabase } from './supabase';
import type { Database } from './database.types';

export type ReminderPrefs = Pick<
  Database['public']['Tables']['reminder_settings']['Row'],
  'water_enabled' | 'water_every_min' | 'workout_enabled' | 'workout_time' | 'window_start' | 'window_end'
>;

export const defaultPrefs: ReminderPrefs = {
  water_enabled: false,
  water_every_min: 120,
  workout_enabled: false,
  workout_time: '18:00',
  window_start: '08:00',
  window_end: '22:00',
};

export type PushSupport = 'ok' | 'sem-suporte' | 'instalar-no-iphone' | 'bloqueado';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Este aparelho consegue receber notificações? */
export function pushSupport(): PushSupport {
  if (isIos() && !isStandalone()) return 'instalar-no-iphone'; // no iPhone, só com o app na tela de início
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'sem-suporte';
  if (Notification.permission === 'denied') return 'bloqueado';
  return 'ok';
}

const hhmm = (t: string) => t.slice(0, 5);

export async function loadPrefs(userId: string): Promise<ReminderPrefs> {
  if (!supabase) return defaultPrefs;
  const { data } = await supabase.from('reminder_settings').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return defaultPrefs;
  return {
    water_enabled: data.water_enabled,
    water_every_min: data.water_every_min,
    workout_enabled: data.workout_enabled,
    workout_time: hhmm(data.workout_time),
    window_start: hhmm(data.window_start),
    window_end: hhmm(data.window_end),
  };
}

export async function savePrefs(userId: string, prefs: ReminderPrefs): Promise<boolean> {
  if (!supabase) return false;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Lisbon';
  const { error } = await supabase.from('reminder_settings').upsert({ user_id: userId, ...prefs, timezone }, { onConflict: 'user_id' });
  return !error;
}

const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

/** Este aparelho já está inscrito? */
export async function isSubscribed(): Promise<boolean> {
  if (pushSupport() !== 'ok') return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return Boolean(await reg?.pushManager.getSubscription());
}

/** Pede permissão, inscreve o aparelho e guarda na conta. */
export async function enablePush(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Lembretes precisam da conta conectada.' };
  const support = pushSupport();
  if (support === 'instalar-no-iphone')
    return { ok: false, error: 'No iPhone, instale o app na tela de início (Compartilhar › Adicionar à Tela de Início) e ative por lá.' };
  if (support === 'sem-suporte') return { ok: false, error: 'Este navegador não recebe notificações.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    return { ok: false, error: 'As notificações foram bloqueadas. Libere nas configurações do navegador para este site.' };

  const reg = await navigator.serviceWorker.ready;
  const { data: key, error: keyError } = await supabase.rpc('vapid_public_key');
  if (keyError || !key) return { ok: false, error: 'O servidor de lembretes ainda não está pronto. Tente de novo em alguns minutos.' };

  try {
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromBase64Url(key) }));
    const json = sub.toJSON();
    const { error } = await supabase.rpc('save_push_subscription', {
      p_endpoint: json.endpoint!,
      p_p256dh: json.keys!.p256dh,
      p_auth: json.keys!.auth,
      p_user_agent: navigator.userAgent,
    });
    if (error) return { ok: false, error: 'Não consegui salvar este aparelho. Verifique a internet e tente de novo.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Não consegui ativar as notificações neste aparelho.' };
  }
}

/** Para de receber neste aparelho (os outros continuam). */
export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  if (supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
