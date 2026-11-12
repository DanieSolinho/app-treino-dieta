-- =============================================================================
-- Lembretes (notificações push) de água e de treino.
-- - push_subscriptions: os aparelhos de cada pessoa que aceitaram notificações
-- - reminder_settings: o que lembrar, de quanto em quanto tempo e em que horário
-- - app_secrets: chaves do servidor (VAPID e senha do agendador); ninguém do app lê
-- - a cada 15 min, o pg_cron chama a função send-reminders, que decide e envia
-- =============================================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- aparelhos -------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

create policy "push: ver os próprios" on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "push: apagar os próprios" on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.push_subscriptions from anon;

/** Guarda o aparelho para a pessoa logada. Se o mesmo navegador era de outra conta, passa a ser desta. */
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(p_p256dh) > 200 or length(p_auth) > 100 then
    raise exception 'invalid subscription';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300));
end;
$$;
revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- preferências ---------------------------------------------------------------
create table public.reminder_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  water_enabled boolean not null default false,
  water_every_min integer not null default 120 check (water_every_min between 30 and 480),
  workout_enabled boolean not null default false,
  workout_time time not null default '18:00',
  window_start time not null default '08:00',
  window_end time not null default '22:00',
  timezone text not null default 'Europe/Lisbon' check (length(timezone) <= 64),
  last_water_push_at timestamptz,
  last_workout_push_on date,
  updated_at timestamptz not null default now()
);
alter table public.reminder_settings enable row level security;

create policy "lembretes: ver os próprios" on public.reminder_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lembretes: criar os próprios" on public.reminder_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lembretes: alterar os próprios" on public.reminder_settings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.reminder_settings from anon;

create trigger reminder_settings_updated_at before update on public.reminder_settings
  for each row execute function public.set_updated_at();

-- segredos do servidor ---------------------------------------------------------
create table public.app_secrets (
  name text primary key,
  value text not null
);
alter table public.app_secrets enable row level security; -- sem políticas: só o servidor (service_role) lê
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (name, value)
values ('cron_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

/** A chave pública VAPID (o navegador precisa dela para aceitar notificações deste app). */
create or replace function public.vapid_public_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select value from public.app_secrets where name = 'vapid_application_server_key';
$$;
revoke all on function public.vapid_public_key() from public, anon;
grant execute on function public.vapid_public_key() to authenticated;

-- agendador: a cada 15 minutos ---------------------------------------------------
select cron.schedule(
  'lembretes',
  '*/15 * * * *',
  $cron$
  select net.http_post(
    url := 'https://dijjdeqgutztgdkykpbe.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $cron$
);
