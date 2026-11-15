-- Quantidade comida de cada item e refeições fora da dieta, por dia.
alter table public.day_logs add column if not exists amounts jsonb not null default '{}'::jsonb;
alter table public.day_logs add column if not exists off_plan jsonb not null default '[]'::jsonb;
comment on column public.day_logs.amounts is 'itemId -> gramas (ou ml) comidas; ausente = quantidade do plano';
comment on column public.day_logs.off_plan is 'Refeições fora da dieta: [{"id", "text", "kcal"}]';
