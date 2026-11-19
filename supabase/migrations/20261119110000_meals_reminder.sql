-- Lembrete à noite: avisa quais refeições ainda não foram marcadas no dia.
alter table public.reminder_settings add column if not exists meals_enabled boolean not null default false;
alter table public.reminder_settings add column if not exists meals_time time not null default '21:30';
alter table public.reminder_settings add column if not exists last_meals_push_on date;
