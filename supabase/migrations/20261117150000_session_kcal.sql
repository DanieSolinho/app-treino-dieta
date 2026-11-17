-- Calorias gastas no treino, digitadas do relógio.
alter table public.workout_sessions add column if not exists kcal integer check (kcal is null or kcal >= 0);
comment on column public.workout_sessions.kcal is 'Calorias gastas no treino (do relógio)';
