/**
 * Decide QUAIS lembretes mandar agora. Puro (sem banco, sem rede), para ser testado no Vitest.
 * Motivação pelos números da pessoa: quanto falta de água, qual é o treino do dia.
 */

export interface ReminderSettings {
  water_enabled: boolean;
  water_every_min: number;
  workout_enabled: boolean;
  workout_time: string; // "18:00:00"
  window_start: string; // "08:00:00"
  window_end: string; // "22:00:00"
  timezone: string;
  last_water_push_at: string | null;
  last_workout_push_on: string | null; // "2026-11-12"
}

export interface UserDay {
  waterMl: number; // total de hoje
  waterGoalMl: number;
  lastLogAt: string | null; // última vez que mexeu no dia (água/refeições)
  plannedWorkouts: string[]; // nomes das fichas de hoje ([] = descanso)
  trainedToday: boolean;
}

export interface LocalNow {
  date: string; // "2026-11-12" no fuso da pessoa
  minutes: number; // minutos desde a meia-noite local
  weekday: number; // 0 = domingo
}

export interface Notice {
  kind: 'agua' | 'treino';
  title: string;
  body: string;
}

/** Data, hora e dia da semana no fuso da pessoa. */
export function localNow(now: Date, timeZone: string): LocalNow {
  let tz = timeZone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    tz = 'Europe/Lisbon';
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: weekdays.indexOf(parts.weekday),
  };
}

export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const formatMl = (ml: number) => (ml >= 1000 ? `${(ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L` : `${ml} ml`);

const pick = <T,>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

export function decide(s: ReminderSettings, day: UserDay, now: Date, local: LocalNow): Notice[] {
  const out: Notice[] = [];
  const start = toMinutes(s.window_start);
  const end = toMinutes(s.window_end);
  const inWindow = local.minutes >= start && local.minutes < end;
  if (!inWindow) return out;

  // água: abaixo da meta e sem registrar nada há `water_every_min` (contando desde o início do horário)
  if (s.water_enabled && day.waterMl < day.waterGoalMl) {
    const sinceStart = local.minutes - start;
    const lastTouch = Math.max(
      day.lastLogAt ? Date.parse(day.lastLogAt) : 0,
      s.last_water_push_at ? Date.parse(s.last_water_push_at) : 0,
    );
    const sinceTouch = (now.getTime() - lastTouch) / 60000;
    if (sinceStart >= s.water_every_min && sinceTouch >= s.water_every_min) {
      const missing = day.waterGoalMl - day.waterMl;
      const pct = Math.round((day.waterMl / day.waterGoalMl) * 100);
      out.push({
        kind: 'agua',
        title: 'Hora da água',
        body: pick(
          [
            `Faltam ${formatMl(missing)} para a sua meta de hoje. Um copo agora?`,
            `Você já está em ${pct}% da meta. Bora pegar mais um copo?`,
            `${formatMl(missing)} para fechar o dia na meta. Um gole de cada vez.`,
          ],
          Math.floor(now.getTime() / 3600000),
        ),
      });
    }
  }

  // treino: a partir do horário escolhido, uma vez por dia, se há ficha e ainda não treinou
  if (
    s.workout_enabled &&
    local.minutes >= toMinutes(s.workout_time) &&
    s.last_workout_push_on !== local.date &&
    day.plannedWorkouts.length > 0 &&
    !day.trainedToday
  ) {
    const names = day.plannedWorkouts;
    out.push({
      kind: 'treino',
      title: names.length > 1 ? `Hoje: ${names.map((n) => n.split(' ·')[0]).join(' ou ')}` : `Hoje é dia de ${names[0]}`,
      body: pick(
        ['Seu treino está te esperando. Bora?', 'Cada treino conta para a próxima medalha.', 'Feito é melhor que perfeito: vai lá!'],
        Number(local.date.replace(/-/g, '')),
      ),
    });
  }
  return out;
}

/** Fichas do dia: a agenda por data manda; sem agenda, os dias da semana de cada ficha. */
export function plannedNames(
  workouts: { id: string; name: string; weekDays?: number[] }[],
  schedule: Record<string, string[]> | null,
  local: LocalNow,
): string[] {
  const ids = schedule?.[local.date];
  if (ids) return ids.map((id) => workouts.find((w) => w.id === id)?.name).filter((n): n is string => !!n);
  return workouts.filter((w) => w.weekDays?.includes(local.weekday)).map((w) => w.name);
}
