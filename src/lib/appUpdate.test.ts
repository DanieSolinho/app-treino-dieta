import { describe, expect, it } from 'vitest';
import { shouldReload } from './appUpdate';

const base = { currentVersion: 'a1', remoteVersion: 'a1', loadedDay: '2026-11-15', today: '2026-11-15', typing: false };

describe('atualização do app', () => {
  it('recarrega quando há versão nova publicada', () => {
    expect(shouldReload({ ...base, remoteVersion: 'b2' })).toBe(true);
    expect(shouldReload(base)).toBe(false);
  });
  it('recarrega quando o dia virou com o app aberto', () => {
    expect(shouldReload({ ...base, today: '2026-11-16' })).toBe(true);
  });
  it('sem internet não recarrega; digitando nunca recarrega', () => {
    expect(shouldReload({ ...base, remoteVersion: undefined })).toBe(false);
    expect(shouldReload({ ...base, remoteVersion: 'b2', typing: true })).toBe(false);
  });
});
