/**
 * Mantém o app em dia mesmo quando ele fica aberto em segundo plano (comum no celular):
 * ao voltar para o app, recarrega se houver uma versão nova publicada ou se o dia virou.
 * Recarregar é seguro: tudo fica guardado no aparelho e no servidor.
 */
import { toDateKey } from './date';

declare const __APP_VERSION__: string;

export interface UpdateCheck {
  currentVersion: string;
  remoteVersion?: string; // undefined = não deu para consultar (sem internet)
  loadedDay: string;
  today: string;
  typing: boolean; // não recarrega no meio de uma digitação
}

export function shouldReload(c: UpdateCheck): boolean {
  if (c.typing) return false;
  if (c.today !== c.loadedDay) return true;
  return c.remoteVersion !== undefined && c.remoteVersion !== c.currentVersion;
}

async function remoteVersion(): Promise<string | undefined> {
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    return ((await res.json()) as { version?: string }).version;
  } catch {
    return undefined;
  }
}

const isTyping = () => {
  const el = document.activeElement;
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el !== document.body);
};

export function watchForUpdates(minIntervalMs = 60_000) {
  const loadedDay = toDateKey();
  let last = 0;

  async function check() {
    if (document.visibilityState !== 'visible' || Date.now() - last < minIntervalMs) return;
    last = Date.now();
    const reload = shouldReload({
      currentVersion: __APP_VERSION__,
      remoteVersion: await remoteVersion(),
      loadedDay,
      today: toDateKey(),
      typing: isTyping(),
    });
    if (reload) window.location.reload();
  }

  document.addEventListener('visibilitychange', () => void check());
  window.addEventListener('focus', () => void check());
  window.addEventListener('pageshow', () => void check());
  setTimeout(() => void check(), 3000);
}
