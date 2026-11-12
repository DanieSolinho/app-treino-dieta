-- Aparelho usado em cada bloco de cardio (esteira, bike, transport, escada).
-- Chave = afterExercise do bloco; 0 = cardio avulso (sessão só de cardio).
alter table public.workout_sessions add column if not exists cardio_machines jsonb;
comment on column public.workout_sessions.cardio_machines is 'Aparelho de cardio por bloco: {"1": "esteira", "0": "bike"} (0 = cardio avulso)';
