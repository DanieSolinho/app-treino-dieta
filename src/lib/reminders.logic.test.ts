import { describe, expect, it } from 'vitest';
import { decide, localNow, plannedNames, type ReminderSettings, type UserDay } from '../../supabase/functions/send-reminders/logic';

const settings: ReminderSettings = {
  water_enabled: true,
  water_every_min: 120,
  workout_enabled: true,
  workout_time: '18:00:00',
  window_start: '08:00:00',
  window_end: '22:00:00',
  timezone: 'Europe/Lisbon',
  last_water_push_at: null,
  last_workout_push_on: null,
};
const day: UserDay = { waterMl: 1000, waterGoalMl: 2500, lastLogAt: null, plannedWorkouts: ['Treino B · Superior'], trainedToday: false };
// 12/11/2026 em Lisboa = UTC+0
const at = (hhmm: string) => new Date(`2026-11-12T${hhmm}:00Z`);
const run = (s: Partial<ReminderSettings>, d: Partial<UserDay>, hhmm: string) =>
  decide({ ...settings, ...s }, { ...day, ...d }, at(hhmm), localNow(at(hhmm), settings.timezone));

describe('lembretes: decisão', () => {
  it('hora e data no fuso da pessoa', () => {
    expect(localNow(new Date('2026-11-12T23:30:00Z'), 'America/Sao_Paulo')).toMatchObject({ date: '2026-11-12', minutes: 20 * 60 + 30, weekday: 4 });
    expect(localNow(new Date('2026-11-12T23:30:00Z'), 'Asia/Tokyo').date).toBe('2026-11-13');
    expect(localNow(new Date('2026-11-12T10:00:00Z'), 'Fuso/Invalido').minutes).toBe(600); // cai para Lisboa
  });

  it('fora do horário escolhido, nada', () => {
    expect(run({}, {}, '07:30')).toEqual([]);
    expect(run({}, {}, '22:15')).toEqual([]);
  });

  it('água: só depois do intervalo, contando do início do horário, do último registro e do último aviso', () => {
    expect(run({}, {}, '09:00').map((n) => n.kind)).toEqual([]); // 1h desde as 8h
    expect(run({}, {}, '10:00').map((n) => n.kind)).toEqual(['agua']);
    expect(run({}, { lastLogAt: '2026-11-12T09:00:00Z' }, '10:00')).toEqual([]);
    expect(run({ last_water_push_at: '2026-11-12T09:30:00Z' }, {}, '10:30')).toEqual([]);
    expect(run({}, { waterMl: 2500 }, '15:00')).toEqual([]); // meta batida
  });

  it('a mensagem de água diz quanto falta ou a porcentagem', () => {
    const [n] = run({}, {}, '10:00');
    expect(n.body).toMatch(/1,5 L|40%/);
  });

  it('treino: a partir do horário, uma vez por dia, se há ficha e ainda não treinou', () => {
    expect(run({ water_enabled: false }, {}, '17:45')).toEqual([]);
    expect(run({ water_enabled: false }, {}, '18:00')[0]).toMatchObject({ kind: 'treino', title: 'Hoje é dia de Treino B · Superior' });
    expect(run({ water_enabled: false, last_workout_push_on: '2026-11-12' }, {}, '19:00')).toEqual([]);
    expect(run({ water_enabled: false }, { trainedToday: true }, '19:00')).toEqual([]);
    expect(run({ water_enabled: false }, { plannedWorkouts: [] }, '19:00')).toEqual([]);
    expect(run({ water_enabled: false }, { plannedWorkouts: ['Treino D · Inferior', 'Treino E · Fullbody'] }, '18:00')[0].title).toBe('Hoje: Treino D ou Treino E');
  });

  it('fichas do dia: agenda por data primeiro, depois dia da semana', () => {
    const local = localNow(at('10:00'), 'Europe/Lisbon'); // quinta
    const ws = [
      { id: 'a', name: 'Treino A', weekDays: [4] },
      { id: 'b', name: 'Treino B', weekDays: [] },
    ];
    expect(plannedNames(ws, { '2026-11-12': ['b'] }, local)).toEqual(['Treino B']);
    expect(plannedNames(ws, { '2026-11-12': [] }, local)).toEqual([]);
    expect(plannedNames(ws, {}, local)).toEqual(['Treino A']);
  });
});
