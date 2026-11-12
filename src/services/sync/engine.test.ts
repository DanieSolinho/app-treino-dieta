import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEngine, resetLocalData, useSyncMeta, useSyncStatus, type Engine } from './engine';
import type { PushBatch, RemoteSnapshot, SyncApi } from './types';
import { useDietStore } from '../../stores/useDietStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDayStore } from '../../stores/useDayStore';
import { useBodyStore } from '../../stores/useBodyStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { samplePlan } from '../../data/samplePlan';
import { sampleWorkouts } from '../../data/sampleWorkouts';
import type { WorkoutSession } from '../../types/workout';

/** Servidor falso em memória, com interruptor de internet. */
function fakeServer() {
  const db = new Map<string, RemoteSnapshot>();
  const pushes: PushBatch[] = [];
  let online = true;
  const user = (id: string) => {
    if (!db.has(id)) db.set(id, { sessions: [], days: [], body: [] });
    return db.get(id)!;
  };
  const net = () => {
    if (!online) throw new Error('offline');
  };
  const api: SyncApi = {
    async hasData(id) {
      net();
      const u = user(id);
      return Boolean(u.diet || u.workouts || u.sessions.length || u.days.length || u.body.length);
    },
    async pull(id) {
      net();
      return structuredClone(user(id));
    },
    async push(id, b) {
      net();
      pushes.push(structuredClone(b));
      const u = user(id);
      if (b.diet) u.diet = structuredClone(b.diet);
      if (b.workouts) u.workouts = structuredClone(b.workouts);
      if (b.waterGoalMl !== undefined) u.waterGoalMl = b.waterGoalMl;
      for (const s of b.sessions) u.sessions = [...u.sessions.filter((x) => x.id !== s.id), structuredClone(s)];
      for (const d of b.days) u.days = [...u.days.filter((x) => x.date !== d.date), structuredClone(d)];
      for (const e of b.body) u.body = [...u.body.filter((x) => x.date !== e.date), structuredClone(e)];
      u.body = u.body.filter((e) => !b.bodyDeletedDates.includes(e.date));
    },
  };
  return { api, db, user, pushes, setOnline: (v: boolean) => (online = v) };
}

const session = (id: string, date: string): WorkoutSession => ({
  id,
  workoutId: 'treino-a',
  startedAt: `${date}T18:00:00.000Z`,
  finishedAt: `${date}T19:00:00.000Z`,
  logs: { a1: [{ load: 30, reps: 12 }] },
});

let server: ReturnType<typeof fakeServer>;
let engine: Engine;

beforeEach(() => {
  resetLocalData();
  useDietStore.setState({ plan: samplePlan });
  useWorkoutStore.setState({ workouts: sampleWorkouts, sessions: [], active: null });
  server = fakeServer();
  engine = createEngine(server.api, { debounceMs: 0 });
});
afterEach(() => engine.stop());

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('sincronização', () => {
  it('primeira vez numa conta vazia: sobe tudo o que já existe no aparelho', async () => {
    useDayStore.getState().addWater('2026-11-12', 500);
    useBodyStore.getState().saveEntry({ date: '2026-11-10', weightKg: 68.4 });
    useWorkoutStore.setState({ sessions: [session('s1', '2026-11-11')] });
    useSettingsStore.getState().setWaterGoal(3000);

    await engine.start('dani');

    const u = server.user('dani');
    expect(u.diet?.title).toBe(samplePlan.title);
    expect(u.workouts).toHaveLength(sampleWorkouts.length);
    expect(u.sessions.map((s) => s.id)).toEqual(['s1']);
    expect(u.days).toEqual([{ date: '2026-11-12', mealsDone: [], waterLog: [500], swaps: {}, variants: {} }]);
    expect(u.body[0]).toMatchObject({ date: '2026-11-10', weightKg: 68.4 });
    expect(u.waterGoalMl).toBe(3000);
    expect(useSyncMeta.getState().owner).toBe('dani');
    expect(useSyncStatus.getState().state).toBe('ok');
  });

  it('aparelho novo: os dados da conta substituem os de exemplo, sem reenviar nada', async () => {
    const u = server.user('dani');
    u.diet = { ...samplePlan, title: 'Plano da nutricionista' };
    u.days = [{ date: '2026-11-12', mealsDone: ['cafe'], waterLog: [250, 250], swaps: {}, variants: {} }];
    u.sessions = [session('s9', '2026-11-11')];
    u.waterGoalMl = 2000;

    await engine.start('dani');

    expect(useDietStore.getState().plan.title).toBe('Plano da nutricionista');
    expect(useDayStore.getState().waterLog['2026-11-12']).toEqual([250, 250]);
    expect(useDayStore.getState().mealsDone['2026-11-12']).toEqual(['cafe']);
    expect(useWorkoutStore.getState().sessions.map((s) => s.id)).toEqual(['s9']);
    expect(useSettingsStore.getState().waterGoalMl).toBe(2000);
    expect(server.pushes).toHaveLength(0);
  });

  it('depois de cada mudança envia só o que mudou', async () => {
    await engine.start('dani');
    server.pushes.length = 0;

    useDayStore.getState().addWater('2026-11-12', 250);
    await tick();

    expect(server.pushes).toHaveLength(1);
    expect(server.pushes[0].days.map((d) => d.date)).toEqual(['2026-11-12']);
    expect(server.pushes[0].diet).toBeUndefined();
    expect(server.pushes[0].workouts).toBeUndefined();
  });

  it('treino em andamento não sobe; o finalizado sobe', async () => {
    await engine.start('dani');
    server.pushes.length = 0;
    const w = useWorkoutStore.getState();
    w.startSession('treino-a');
    w.logSet('a1', { load: 30, reps: 12 });
    await tick();
    expect(server.pushes.flatMap((p) => p.sessions)).toHaveLength(0);

    useWorkoutStore.getState().finishSession();
    await tick();
    expect(server.user('dani').sessions).toHaveLength(1);
    expect(server.user('dani').workouts).toBeTruthy(); // a carga sugerida também sobe
  });

  it('sem internet guarda as mudanças e envia quando volta', async () => {
    await engine.start('dani');
    server.setOnline(false);

    useDayStore.getState().addWater('2026-11-12', 500);
    useBodyStore.getState().saveEntry({ date: '2026-11-12', weightKg: 68 });
    await tick();

    expect(useSyncStatus.getState().state).toBe('offline');
    expect(useSyncMeta.getState().dirty.days).toEqual(['2026-11-12']);
    expect(useSyncMeta.getState().dirty.body).toEqual(['2026-11-12']);

    server.setOnline(true);
    expect(await engine.syncNow({ pull: true })).toBe(true);
    expect(server.user('dani').days[0].waterLog).toEqual([500]);
    expect(server.user('dani').body[0].weightKg).toBe(68);
    expect(useSyncMeta.getState().dirty.days).toEqual([]);
    expect(useSyncStatus.getState().state).toBe('ok');
  });

  it('apagar um registro de peso apaga no servidor', async () => {
    useBodyStore.getState().saveEntry({ date: '2026-11-10', weightKg: 68.4 });
    await engine.start('dani');
    expect(server.user('dani').body).toHaveLength(1);

    const id = useBodyStore.getState().entries[0].id;
    useBodyStore.getState().deleteEntry(id);
    await tick();
    expect(server.user('dani').body).toHaveLength(0);
  });

  it('o que chega do servidor não sobrescreve o que ainda está pendente', async () => {
    await engine.start('dani');
    server.setOnline(false);
    useDayStore.getState().addWater('2026-11-12', 500); // pendente no celular
    await tick();

    // enquanto isso, outro aparelho mexeu no mesmo dia e em outro dia
    server.user('dani').days = [
      { date: '2026-11-12', mealsDone: [], waterLog: [999], swaps: {}, variants: {} },
      { date: '2026-11-11', mealsDone: ['cafe'], waterLog: [], swaps: {}, variants: {} },
    ];
    server.setOnline(true);
    await engine.syncNow({ pull: true });

    expect(useDayStore.getState().waterLog['2026-11-12']).toEqual([500]); // o local pendente venceu e subiu
    expect(useDayStore.getState().mealsDone['2026-11-11']).toEqual(['cafe']); // o resto chegou
    expect(server.user('dani').days.find((d) => d.date === '2026-11-12')?.waterLog).toEqual([500]);
  });

  it('conta nova e vazia não herda os dados da conta anterior do navegador', async () => {
    useDayStore.getState().addWater('2026-11-12', 500);
    await engine.start('dani');
    engine.stop();

    const bia = createEngine(server.api, { debounceMs: 0 });
    await bia.start('bia');
    bia.stop();

    expect(useDayStore.getState().waterLog['2026-11-12']).toBeUndefined();
    expect(server.user('bia').days).toHaveLength(0);
    expect(server.user('dani').days[0].waterLog).toEqual([500]); // os da Dani continuam na conta dela
  });
});

describe('troca de conta', () => {
  it('limpa os dados locais quando entra uma conta diferente da dona do aparelho', async () => {
    useDayStore.getState().addWater('2026-11-12', 500);
    await engine.start('dani');
    engine.stop();

    server.user('bia').diet = { ...samplePlan, title: 'Plano da Bia' };
    const bia = createEngine(server.api, { debounceMs: 0 });
    await bia.start('bia');
    bia.stop();

    expect(useDayStore.getState().waterLog['2026-11-12']).toBeUndefined();
    expect(useDietStore.getState().plan.title).toBe('Plano da Bia');
    expect(server.user('bia').days).toHaveLength(0); // nada da Dani subiu para a Bia
    expect(useSyncMeta.getState().owner).toBe('bia');
  });
});
