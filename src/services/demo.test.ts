// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { enterDemo, exitDemo } from './demo';
import { useAuth } from './auth';
import { useSyncMeta } from './sync/engine';
import { emptyDirty } from './sync/types';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { buildDemoData } from '../data/demo';
import { badges, weekSummary } from '../lib/achievements';

beforeEach(() => {
  exitDemo();
  useSyncMeta.setState({ owner: undefined, dirty: emptyDirty() });
});

describe('modo demonstração', () => {
  it('gera 6 semanas de histórico com carga subindo, sempre igual para a mesma data', () => {
    const today = new Date(2026, 10, 12);
    const d = buildDemoData(today);
    expect(d.sessions.length).toBeGreaterThan(20);
    expect(buildDemoData(today)).toEqual(d);
    const supino = d.sessions.filter((s) => s.logs.a1).map((s) => s.logs.a1[0].load);
    expect(supino[0]).toBeGreaterThan(supino.at(-1)!); // mais recente primeiro
    const w = weekSummary(d.sessions, (k) => (d.waterLog[k] ?? []).reduce((a, b) => a + b, 0), 2500, today);
    expect(w.workouts).toBeGreaterThan(0);
    expect(
      badges({ sessions: d.sessions, waterDates: Object.keys(d.waterLog), waterByDate: () => 0, waterGoal: 2500, exerciseIds: ['a1'] }).some((b) => b.unlocked),
    ).toBe(true);
  });

  it('entra e sai sem deixar dados de exemplo para trás', () => {
    expect(enterDemo().ok).toBe(true);
    expect(useAuth.getState().status).toBe('demo');
    expect(useWorkoutStore.getState().sessions.length).toBeGreaterThan(0);
    expect(localStorage.getItem('demo-mode')).toBe('1');
    exitDemo();
    expect(useAuth.getState().status).toBe('deslogada');
    expect(useWorkoutStore.getState().sessions).toEqual([]);
    expect(localStorage.getItem('demo-mode')).toBeNull();
  });

  it('não entra se a conta tem alterações ainda não enviadas', () => {
    useSyncMeta.setState({ owner: 'dani', dirty: { ...emptyDirty(), days: ['2026-11-12'] } });
    expect(enterDemo()).toMatchObject({ ok: false });
    expect(useAuth.getState().status).not.toBe('demo');
  });
});
