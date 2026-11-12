-- =============================================================================
-- App Treino & Dieta — esquema inicial
--
-- Regra de ouro: cada linha pertence a um usuário (user_id) e o RLS garante que
-- cada pessoa só lê e escreve os próprios dados.
--
-- Planos (dieta, fichas) são documentos JSON: mudam pouco e têm formato aninhado.
-- Histórico (dias, treinos feitos, peso) fica em linhas próprias: cresce todo dia
-- e cada linha sincroniza sozinha, sem conflito entre celular e computador.
--
-- Postgres puro: roda em qualquer servidor Postgres. Só auth.uid() e auth.users
-- são do Supabase (trocar por outra autenticação se um dia migrar).
-- =============================================================================

-- updated_at automático ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Perfil (1 por usuário) ---------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text check (char_length(display_name) <= 80),
  water_goal_ml integer not null default 2500 check (water_goal_ml between 500 and 10000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.profiles is 'Configurações do usuário. Criado automaticamente no cadastro.';

-- Plano alimentar (documento: refeições, versões e lista de substituição) --------
create table public.diet_plans (
  user_id    uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  plan       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Fichas de treino, agenda e alongamentos (documento) ---------------------------
create table public.workout_plans (
  user_id    uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  workouts   jsonb not null default '[]'::jsonb,
  schedule   jsonb not null default '{}'::jsonb, -- "2026-11-12" -> ["B"]
  stretches  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Treinos feitos ----------------------------------------------------------------
create table public.workout_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  workout_id  text not null,
  started_at  timestamptz not null,
  finished_at timestamptz,
  logs        jsonb not null default '{}'::jsonb, -- exerciseId -> séries
  suggestions jsonb,
  cardio      jsonb,
  updated_at  timestamptz not null default now()
);
create index workout_sessions_user_started_idx on public.workout_sessions (user_id, started_at desc);

-- Registro do dia (refeições, água, trocas) ------------------------------------
create table public.day_logs (
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date       date not null,
  meals_done text[] not null default '{}',
  water_log  integer[] not null default '{}', -- cada registro em ml (permite desfazer)
  swaps      jsonb not null default '{}'::jsonb, -- itemId -> alimento escolhido
  variants   jsonb not null default '{}'::jsonb, -- mealId -> versão ("sem-feijao")
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Peso e medidas (1 por dia) -----------------------------------------------------
create table public.body_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date       date not null,
  weight_kg  numeric(5, 2) check (weight_kg > 0 and weight_kg < 500),
  measures   jsonb not null default '{}'::jsonb, -- cintura, quadril, braco, coxa (cm)
  deleted_at timestamptz, -- apagado em um aparelho some nos outros
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Triggers de updated_at ---------------------------------------------------------
create trigger set_updated_at before update on public.profiles         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.diet_plans       for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workout_plans    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workout_sessions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.day_logs         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.body_entries     for each row execute function public.set_updated_at();

-- RLS: cada usuário só acessa as próprias linhas ----------------------------------
alter table public.profiles         enable row level security;
alter table public.diet_plans       enable row level security;
alter table public.workout_plans    enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.day_logs         enable row level security;
alter table public.body_entries     enable row level security;

-- profiles usa "id" como dono; é criado pelo trigger, então não há policy de insert/delete
create policy "perfil: ler o próprio"      on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: editar o próprio"   on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- As demais tabelas têm user_id: mesmas 4 regras para cada uma
do $$
declare
  t text;
begin
  foreach t in array array['diet_plans', 'workout_plans', 'workout_sessions', 'day_logs', 'body_entries'] loop
    execute format('create policy "dono: ler" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono: criar" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono: editar" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono: apagar" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Visitantes sem login não acessam nada
revoke all on public.profiles, public.diet_plans, public.workout_plans,
              public.workout_sessions, public.day_logs, public.body_entries from anon;

-- Cria o perfil no cadastro -----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Apagar a própria conta (RGPD: direito ao apagamento) ----------------------------
-- O "on delete cascade" leva junto todos os dados do usuário.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
