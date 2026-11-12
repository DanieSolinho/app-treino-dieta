/**
 * send-reminders — chamada pelo pg_cron a cada 15 minutos (cabeçalho x-cron-secret).
 * Para cada pessoa com lembretes ligados, decide (logic.ts) e envia as notificações push.
 * As chaves VAPID são criadas aqui na primeira execução e guardadas em app_secrets.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import * as webpush from 'jsr:@negrel/webpush@0.5.0';
import { decide, localNow, plannedNames, type ReminderSettings } from './logic.ts';

const APP_URL = 'https://app-treino-dieta-omega.vercel.app';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function secret(name: string): Promise<string | null> {
  const { data } = await db.from('app_secrets').select('value').eq('name', name).maybeSingle();
  return data?.value ?? null;
}

/** Comparação em tempo constante (não vaza a senha pelo tempo de resposta). */
function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function vapidKeys(): Promise<CryptoKeyPair> {
  let stored = await secret('vapid_keys');
  if (!stored) {
    const keys = await webpush.generateVapidKeys({ extractable: true });
    const exported = JSON.stringify(await webpush.exportVapidKeys(keys));
    const appKey = await webpush.exportApplicationServerKey(keys);
    // se outra execução criou ao mesmo tempo, fica a primeira
    await db.from('app_secrets').upsert({ name: 'vapid_keys', value: exported }, { onConflict: 'name', ignoreDuplicates: true });
    await db
      .from('app_secrets')
      .upsert({ name: 'vapid_application_server_key', value: appKey }, { onConflict: 'name', ignoreDuplicates: true });
    stored = await secret('vapid_keys');
  }
  return webpush.importVapidKeys(JSON.parse(stored!), { extractable: true });
}

Deno.serve(async (req) => {
  const expected = await secret('cron_secret');
  const given = req.headers.get('x-cron-secret') ?? '';
  if (!expected || !sameText(given, expected)) return json(401, { error: 'unauthorized' });

  const keys = await vapidKeys();
  const appServer = await webpush.ApplicationServer.new({ contactInformation: APP_URL, vapidKeys: keys });
  const now = new Date();

  const { data: settings, error } = await db
    .from('reminder_settings')
    .select('*')
    .or('water_enabled.eq.true,workout_enabled.eq.true');
  if (error) return json(500, { error: error.message });

  const report = { users: 0, sent: 0, removed: 0, failed: 0 };
  for (const s of (settings ?? []) as (ReminderSettings & { user_id: string })[]) {
    const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', s.user_id);
    if (!subs?.length) continue;
    report.users++;

    const local = localNow(now, s.timezone);
    const [profile, day, plan, sessions] = await Promise.all([
      db.from('profiles').select('water_goal_ml').eq('id', s.user_id).maybeSingle(),
      db.from('day_logs').select('water_log, updated_at').eq('user_id', s.user_id).eq('date', local.date).maybeSingle(),
      db.from('workout_plans').select('workouts, schedule').eq('user_id', s.user_id).maybeSingle(),
      db
        .from('workout_sessions')
        .select('started_at')
        .eq('user_id', s.user_id)
        .gte('started_at', new Date(now.getTime() - 36 * 3600000).toISOString()),
    ]);

    const water = ((day.data?.water_log as number[] | null) ?? []).reduce((a, b) => a + b, 0);
    const notices = decide(
      s,
      {
        waterMl: water,
        waterGoalMl: profile.data?.water_goal_ml ?? 2500,
        lastLogAt: day.data?.updated_at ?? null,
        plannedWorkouts: plannedNames((plan.data?.workouts as never[]) ?? [], (plan.data?.schedule as never) ?? null, local),
        trainedToday: (sessions.data ?? []).some((x) => localNow(new Date(x.started_at), s.timezone).date === local.date),
      },
      now,
      local,
    );
    if (!notices.length) continue;

    for (const n of notices) {
      const payload = JSON.stringify({ title: n.title, body: n.body, tag: n.kind, url: APP_URL });
      for (const sub of subs) {
        try {
          await appServer
            .subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } })
            .pushTextMessage(payload, { ttl: 3600, topic: n.kind });
          report.sent++;
        } catch (e) {
          if (e instanceof webpush.PushMessageError && e.isGone()) {
            await db.from('push_subscriptions').delete().eq('id', sub.id); // aparelho desinstalou ou bloqueou
            report.removed++;
          } else {
            report.failed++;
            console.error('push falhou', e instanceof Error ? e.message : e);
          }
        }
      }
    }

    const update: Record<string, string> = {};
    if (notices.some((n) => n.kind === 'agua')) update.last_water_push_at = now.toISOString();
    if (notices.some((n) => n.kind === 'treino')) update.last_workout_push_on = local.date;
    await db.from('reminder_settings').update(update).eq('user_id', s.user_id);
  }

  return json(200, report);
});
