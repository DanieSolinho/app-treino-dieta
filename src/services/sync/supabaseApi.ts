/** Implementação real do SyncApi, usando o Supabase (Postgres + RLS). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import type { DietPlan } from '../../types/diet';
import type { Workout } from '../../types/workout';
import type { SyncApi } from './types';
import { bodyToRow, dayToRow, rowToBody, rowToDay, rowToSession, sessionToRow } from './rows';

type Client = SupabaseClient<Database>;
type TableName = keyof Database['public']['Tables'];

const PAGE = 1000; // limite padrão de linhas por pedido

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Busca todas as linhas de uma tabela da usuária, de 1000 em 1000. */
async function selectAll<T extends TableName>(db: Client, table: T, userId: string, orderBy: string) {
  const rows: Database['public']['Tables'][T]['Row'][] = [];
  for (let from = 0; ; from += PAGE) {
    const page = check(
      await db
        .from(table)
        .select('*')
        .eq('user_id' as never, userId as never)
        .order(orderBy as never)
        .range(from, from + PAGE - 1),
    ) as unknown as Database['public']['Tables'][T]['Row'][];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export function supabaseSyncApi(db: Client): SyncApi {
  return {
    async hasData(userId) {
      const tables = ['diet_plans', 'workout_plans', 'workout_sessions', 'day_logs', 'body_entries'] as const;
      const counts = await Promise.all(
        tables.map(async (t) => {
          const res = await db.from(t).select('user_id', { count: 'exact', head: true }).eq('user_id', userId);
          if (res.error) throw new Error(res.error.message);
          return res.count ?? 0;
        }),
      );
      return counts.some((c) => c > 0);
    },

    async pull(userId) {
      const [diet, plans, profile, sessions, days, body] = await Promise.all([
        db.from('diet_plans').select('plan').eq('user_id', userId).maybeSingle(),
        db.from('workout_plans').select('workouts').eq('user_id', userId).maybeSingle(),
        db.from('profiles').select('water_goal_ml').eq('id', userId).maybeSingle(),
        selectAll(db, 'workout_sessions', userId, 'started_at'),
        selectAll(db, 'day_logs', userId, 'date'),
        selectAll(db, 'body_entries', userId, 'date'),
      ]);
      const dietRow = check(diet);
      const planRow = check(plans);
      const profileRow = check(profile);
      return {
        diet: dietRow ? (dietRow.plan as unknown as DietPlan) : undefined,
        workouts: planRow ? (planRow.workouts as unknown as Workout[]) : undefined,
        waterGoalMl: profileRow?.water_goal_ml,
        sessions: sessions.map(rowToSession),
        days: days.map(rowToDay),
        body: body.filter((r) => !r.deleted_at).map(rowToBody),
      };
    },

    async push(userId, b) {
      const jobs: PromiseLike<unknown>[] = [];
      const run = (q: PromiseLike<{ error: { message: string } | null }>) =>
        jobs.push(Promise.resolve(q).then((r) => check({ data: null, error: r.error })));

      if (b.diet) run(db.from('diet_plans').upsert({ user_id: userId, plan: b.diet as never }, { onConflict: 'user_id' }));
      if (b.workouts) run(db.from('workout_plans').upsert({ user_id: userId, workouts: b.workouts as never }, { onConflict: 'user_id' }));
      if (b.waterGoalMl !== undefined) run(db.from('profiles').update({ water_goal_ml: b.waterGoalMl }).eq('id', userId));
      if (b.sessions.length) run(db.from('workout_sessions').upsert(b.sessions.map((s) => sessionToRow(userId, s)), { onConflict: 'id' }));
      if (b.days.length) run(db.from('day_logs').upsert(b.days.map((d) => dayToRow(userId, d)), { onConflict: 'user_id,date' }));
      if (b.body.length) run(db.from('body_entries').upsert(b.body.map((e) => bodyToRow(userId, e)), { onConflict: 'user_id,date' }));
      if (b.bodyDeletedDates.length) run(db.from('body_entries').delete().eq('user_id', userId).in('date', b.bodyDeletedDates));

      await Promise.all(jobs);
    },
  };
}
