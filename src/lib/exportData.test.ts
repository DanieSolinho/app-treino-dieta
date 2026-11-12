import { describe, expect, it } from 'vitest';
import { backupFileName, collectMyData } from './exportData';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useDayStore } from '../stores/useDayStore';

describe('Baixar meus dados', () => {
  it('junta tudo e deixa de fora o treino em andamento', () => {
    useWorkoutStore.setState({
      sessions: [{ id: 's1', workoutId: 'treino-a', startedAt: '2026-11-10T18:00:00Z', finishedAt: '2026-11-10T19:00:00Z', logs: {} }],
      active: { id: 'x', workoutId: 'treino-a', startedAt: '2026-11-12T18:00:00Z', logs: {} },
    });
    useDayStore.getState().addWater('2026-11-10', 500);
    const data = collectMyData({ email: 'a@b.com' });
    expect(data.format).toBe('treino-dieta-backup');
    expect(data.sessions.map((s) => s.id)).toEqual(['s1']);
    expect(data.days.waterLog['2026-11-10']).toEqual([500]);
    expect(data.account).toEqual({ email: 'a@b.com' });
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  it('nome do arquivo com a data', () => {
    expect(backupFileName(new Date(2026, 10, 12))).toBe('treino-dieta-meus-dados-2026-11-12.json');
  });
});
