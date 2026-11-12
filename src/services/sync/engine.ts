/**
 * Motor de sincronização ("offline primeiro").
 *
 * - O app continua lendo e gravando nas stores locais (rápido, funciona sem internet).
 * - O motor observa as stores e anota o que mudou (dirty), guardado no aparelho.
 * - Pouco depois de cada mudança, envia SÓ o que mudou. Sem internet, guarda e tenta depois.
 * - Ao entrar, ao voltar para o app e quando a internet volta, busca o que mudou em outros aparelhos.
 * - Conflito: vale a última versão enviada; o que ainda está pendente no aparelho nunca é sobrescrito.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDietStore } from '../../stores/useDietStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useDayStore } from '../../stores/useDayStore';
import { useBodyStore } from '../../stores/useBodyStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { WorkoutSession } from '../../types/workout';
import type { BodyEntry } from '../../types/body';
import { emptyDirty, isDirty, type DayRecord, type Dirty, type PushBatch, type RemoteSnapshot, type SyncApi } from './types';

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

interface SyncMeta {
  owner?: string; // id da conta dona dos dados deste aparelho
  dirty: Dirty;
  lastSyncedAt?: string;
}

/** Guardado no aparelho: de quem são os dados e o que falta enviar. */
export const useSyncMeta = create<SyncMeta>()(persist(() => ({ dirty: emptyDirty() }), { name: 'sync-meta' }));

export type SyncState = 'parado' | 'sincronizando' | 'ok' | 'offline';

/** Só na memória: o que a tela mostra agora. */
export const useSyncStatus = create<{ state: SyncState; firstLoad: boolean }>(() => ({ state: 'parado', firstLoad: false }));

const addTo = (list: string[], ...items: string[]) => [...new Set([...list, ...items])];
const without = (list: string[], ...items: string[]) => list.filter((x) => !items.includes(x));

function markDirty(change: (d: Dirty) => Dirty) {
  useSyncMeta.setState((m) => ({ dirty: change(m.dirty) }));
}

// ---------------------------------------------------------------------------
// Dias: as 4 coleções por data viram uma linha por data
// ---------------------------------------------------------------------------

type DayMaps = Pick<ReturnType<typeof useDayStore.getState>, 'mealsDone' | 'waterLog' | 'swaps' | 'variants'>;

export function dayRecord(s: DayMaps, date: string): DayRecord {
  return {
    date,
    mealsDone: s.mealsDone[date] ?? [],
    waterLog: s.waterLog[date] ?? [],
    swaps: s.swaps[date] ?? {},
    variants: s.variants[date] ?? {},
  };
}

const allDates = (s: DayMaps) => [
  ...new Set([...Object.keys(s.mealsDone), ...Object.keys(s.waterLog), ...Object.keys(s.swaps), ...Object.keys(s.variants)]),
];

/** Datas em que alguma das 4 coleções mudou (as stores são imutáveis: basta comparar referências). */
export function changedDates(next: DayMaps, prev: DayMaps): string[] {
  return [...new Set([...allDates(next), ...allDates(prev)])].filter(
    (d) =>
      next.mealsDone[d] !== prev.mealsDone[d] ||
      next.waterLog[d] !== prev.waterLog[d] ||
      next.swaps[d] !== prev.swaps[d] ||
      next.variants[d] !== prev.variants[d],
  );
}

const finished = (s: WorkoutSession) => Boolean(s.finishedAt);

// ---------------------------------------------------------------------------
// Observar as stores
// ---------------------------------------------------------------------------

let applyingRemote = false; // mudanças vindas do servidor não viram "pendentes"
let onLocalChange: () => void = () => {};

function watchStores(): () => void {
  const subs = [
    useDietStore.subscribe((s, p) => {
      if (applyingRemote || s.plan === p.plan) return;
      markDirty((d) => ({ ...d, diet: true }));
      onLocalChange();
    }),
    useWorkoutStore.subscribe((s, p) => {
      if (applyingRemote) return;
      let changed = false;
      if (s.workouts !== p.workouts) {
        markDirty((d) => ({ ...d, workouts: true }));
        changed = true;
      }
      if (s.sessions !== p.sessions) {
        const before = new Map(p.sessions.map((x) => [x.id, x]));
        const ids = s.sessions.filter((x) => finished(x) && before.get(x.id) !== x).map((x) => x.id);
        if (ids.length) {
          markDirty((d) => ({ ...d, sessions: addTo(d.sessions, ...ids) }));
          changed = true;
        }
      }
      if (changed) onLocalChange();
    }),
    useDayStore.subscribe((s, p) => {
      if (applyingRemote) return;
      const dates = changedDates(s, p);
      if (!dates.length) return;
      markDirty((d) => ({ ...d, days: addTo(d.days, ...dates) }));
      onLocalChange();
    }),
    useBodyStore.subscribe((s, p) => {
      if (applyingRemote || s.entries === p.entries) return;
      const before = new Map(p.entries.map((e) => [e.date, e]));
      const after = new Map(s.entries.map((e) => [e.date, e]));
      const saved = s.entries.filter((e) => before.get(e.date) !== e).map((e) => e.date);
      const deleted = p.entries.filter((e) => !after.has(e.date)).map((e) => e.date);
      markDirty((d) => ({
        ...d,
        body: addTo(without(d.body, ...deleted), ...saved),
        bodyDeleted: addTo(without(d.bodyDeleted, ...saved), ...deleted),
      }));
      onLocalChange();
    }),
    useSettingsStore.subscribe((s, p) => {
      if (applyingRemote || s.waterGoalMl === p.waterGoalMl) return;
      markDirty((d) => ({ ...d, settings: true }));
      onLocalChange();
    }),
  ];
  return () => subs.forEach((unsub) => unsub());
}

// ---------------------------------------------------------------------------
// Enviar e receber
// ---------------------------------------------------------------------------

/** Marca TUDO o que há no aparelho como pendente (primeira subida para uma conta vazia). */
export function markEverythingDirty() {
  const day = useDayStore.getState();
  useSyncMeta.setState({
    dirty: {
      diet: true,
      workouts: true,
      settings: true,
      sessions: useWorkoutStore.getState().sessions.filter(finished).map((s) => s.id),
      days: allDates(day),
      body: useBodyStore.getState().entries.map((e) => e.date),
      bodyDeleted: [],
    },
  });
}

function buildBatch(d: Dirty): PushBatch {
  const workout = useWorkoutStore.getState();
  const day = useDayStore.getState();
  return {
    diet: d.diet ? useDietStore.getState().plan : undefined,
    workouts: d.workouts ? workout.workouts : undefined,
    waterGoalMl: d.settings ? useSettingsStore.getState().waterGoalMl : undefined,
    sessions: workout.sessions.filter((s) => d.sessions.includes(s.id)),
    days: d.days.map((date) => dayRecord(day, date)),
    body: useBodyStore.getState().entries.filter((e) => d.body.includes(e.date)),
    bodyDeletedDates: d.bodyDeleted,
  };
}

function mergeDirty(a: Dirty, b: Dirty): Dirty {
  return {
    diet: a.diet || b.diet,
    workouts: a.workouts || b.workouts,
    settings: a.settings || b.settings,
    sessions: addTo(a.sessions, ...b.sessions),
    days: addTo(a.days, ...b.days),
    body: addTo(a.body, ...b.body),
    bodyDeleted: addTo(a.bodyDeleted, ...b.bodyDeleted),
  };
}

/** Aplica o que veio do servidor sem tocar no que ainda está pendente no aparelho. */
export function applyRemote(remote: RemoteSnapshot) {
  const d = useSyncMeta.getState().dirty;
  applyingRemote = true;
  try {
    if (remote.diet && !d.diet) useDietStore.setState({ plan: remote.diet });
    if (remote.workouts && !d.workouts) useWorkoutStore.setState({ workouts: remote.workouts });
    if (remote.waterGoalMl !== undefined && !d.settings) useSettingsStore.setState({ waterGoalMl: remote.waterGoalMl });

    // treinos feitos: os do servidor + os locais ainda não enviados
    const local = useWorkoutStore.getState().sessions;
    const pending = local.filter((s) => d.sessions.includes(s.id));
    const byId = new Map<string, WorkoutSession>(remote.sessions.map((s) => [s.id, s]));
    pending.forEach((s) => byId.set(s.id, s));
    const sessions = [...byId.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    useWorkoutStore.setState({ sessions });

    // dias
    const day = useDayStore.getState();
    const maps: DayMaps = { mealsDone: {}, waterLog: {}, swaps: {}, variants: {} };
    const put = (r: DayRecord) => {
      if (r.mealsDone.length) maps.mealsDone[r.date] = r.mealsDone;
      if (r.waterLog.length) maps.waterLog[r.date] = r.waterLog;
      if (Object.keys(r.swaps).length) maps.swaps[r.date] = r.swaps;
      if (Object.keys(r.variants).length) maps.variants[r.date] = r.variants;
    };
    remote.days.filter((r) => !d.days.includes(r.date)).forEach(put);
    d.days.forEach((date) => put(dayRecord(day, date)));
    useDayStore.setState(maps);

    // peso e medidas
    const localBody = useBodyStore.getState().entries;
    const byDate = new Map<string, BodyEntry>(
      remote.body.filter((e) => !d.bodyDeleted.includes(e.date)).map((e) => [e.date, e]),
    );
    localBody.filter((e) => d.body.includes(e.date)).forEach((e) => byDate.set(e.date, e));
    useBodyStore.setState({ entries: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)) });
  } finally {
    applyingRemote = false;
  }
}

/** Volta todas as stores ao estado inicial (ao sair ou ao trocar de conta). */
export function resetLocalData() {
  applyingRemote = true;
  try {
    for (const store of [useDietStore, useWorkoutStore, useDayStore, useBodyStore, useSettingsStore]) {
      (store as { setState: (s: unknown, replace: true) => void; getInitialState: () => unknown }).setState(store.getInitialState(), true);
    }
  } finally {
    applyingRemote = false;
  }
  useSyncMeta.setState({ owner: undefined, dirty: emptyDirty(), lastSyncedAt: undefined });
}

// ---------------------------------------------------------------------------
// O motor
// ---------------------------------------------------------------------------

export interface Engine {
  start(userId: string): Promise<void>;
  stop(): void;
  /** Envia o que está pendente e, se pedido, busca o que mudou. Devolve false se não conseguiu (offline). */
  syncNow(options?: { pull?: boolean }): Promise<boolean>;
}

export function createEngine(api: SyncApi, { debounceMs = 1500 } = {}): Engine {
  let userId: string | null = null;
  let unwatch: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<boolean> | null = null;
  let again: { pull: boolean } | null = null;

  async function cycle(pull: boolean): Promise<boolean> {
    if (!userId) return false;
    const uid = userId;
    useSyncStatus.setState({ state: 'sincronizando' });

    // tira os pendentes da fila; se der erro, devolve
    const inflight = useSyncMeta.getState().dirty;
    useSyncMeta.setState({ dirty: emptyDirty() });
    try {
      if (isDirty(inflight)) await api.push(uid, buildBatch(inflight));
    } catch {
      useSyncMeta.setState((m) => ({ dirty: mergeDirty(inflight, m.dirty) }));
      useSyncStatus.setState({ state: 'offline' });
      return false;
    }

    try {
      if (pull) {
        const remote = await api.pull(uid);
        if (userId !== uid) return false; // saiu da conta no meio
        applyRemote(remote);
      }
    } catch {
      useSyncStatus.setState({ state: 'offline' });
      return false;
    }

    useSyncMeta.setState({ lastSyncedAt: new Date().toISOString() });
    useSyncStatus.setState({ state: isDirty(useSyncMeta.getState().dirty) ? 'sincronizando' : 'ok' });
    return true;
  }

  function syncNow({ pull = false } = {}): Promise<boolean> {
    if (running) {
      again = { pull: pull || Boolean(again?.pull) };
      return running;
    }
    running = cycle(pull).finally(() => {
      running = null;
      if (again && userId) {
        const next = again;
        again = null;
        void syncNow(next);
      } else if (userId && isDirty(useSyncMeta.getState().dirty) && useSyncStatus.getState().state !== 'offline') {
        void syncNow(); // algo mudou enquanto enviava
      }
    });
    return running;
  }

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), debounceMs);
  };

  let lastPull = 0;
  const pullIfStale = () => {
    if (Date.now() - lastPull < 30_000) return;
    lastPull = Date.now();
    void syncNow({ pull: true });
  };
  const onVisible = () => document.visibilityState === 'visible' && pullIfStale();
  const onOnline = () => void syncNow({ pull: true });

  return {
    async start(id) {
      if (userId === id) return;
      userId = id;
      onLocalChange = schedule;
      unwatch?.();
      unwatch = watchStores();

      const meta = useSyncMeta.getState();
      const known = meta.owner === id;
      if (!known) useSyncStatus.setState({ firstLoad: true });
      try {
        if (meta.owner && meta.owner !== id) resetLocalData(); // aparelho tinha dados de outra conta
        if (!known) {
          // primeira vez desta conta neste aparelho
          const remoteHasData = await api.hasData(id);
          if (remoteHasData) useSyncMeta.setState({ dirty: emptyDirty() }); // o servidor manda
          else markEverythingDirty(); // conta vazia: sobe o que já existe aqui
        }
        lastPull = Date.now();
        const ok = await syncNow({ pull: true });
        if (ok && userId === id) useSyncMeta.setState({ owner: id });
      } catch {
        useSyncStatus.setState({ state: 'offline' });
      } finally {
        useSyncStatus.setState({ firstLoad: false });
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('online', onOnline);
        document.addEventListener('visibilitychange', onVisible);
      }
    },

    stop() {
      clearTimeout(timer);
      unwatch?.();
      unwatch = null;
      userId = null;
      onLocalChange = () => {};
      useSyncStatus.setState({ state: 'parado', firstLoad: false });
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        document.removeEventListener('visibilitychange', onVisible);
      }
    },

    syncNow,
  };
}
