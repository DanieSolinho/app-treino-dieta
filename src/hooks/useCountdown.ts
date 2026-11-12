import { useEffect, useState } from 'react';

/** Contagem regressiva baseada em horário de fim — não "atrasa" se a aba ficar em segundo plano. */
export function useCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  const running = endsAt !== null && remaining > 0;

  useEffect(() => {
    if (endsAt !== null && remaining === 0) {
      navigator.vibrate?.([200, 100, 200]);
      setEndsAt(null);
    }
  }, [endsAt, remaining]);

  return {
    remaining,
    running,
    start: (seconds: number) => {
      setNow(Date.now());
      setEndsAt(Date.now() + seconds * 1000);
    },
    add: (seconds: number) => setEndsAt((e) => (e === null ? null : e + seconds * 1000)),
    stop: () => setEndsAt(null),
  };
}

export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
