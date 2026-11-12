import { useEffect, useState } from 'react';
import { defaultPrefs, disablePush, enablePush, isSubscribed, loadPrefs, pushSupport, savePrefs, type ReminderPrefs } from '../../services/reminders';

const intervals = [
  { min: 60, label: '1 h' },
  { min: 90, label: '1h30' },
  { min: 120, label: '2 h' },
  { min: 180, label: '3 h' },
];

/**
 * Ajustes › Lembretes. Água: avisa se ficou sem registrar por um tempo e ainda falta para a meta.
 * Treino: um aviso no horário escolhido, só em dia de treino e se ainda não treinou.
 */
export function RemindersCard({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<ReminderPrefs>(defaultPrefs);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const support = pushSupport();

  useEffect(() => {
    let alive = true;
    void Promise.all([loadPrefs(userId), isSubscribed()]).then(([p, d]) => {
      if (!alive) return;
      setPrefs(p);
      setDevice(d);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const set = (patch: Partial<ReminderPrefs>) => {
    setMsg(null);
    setPrefs((p) => ({ ...p, ...patch }));
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    const wantsAny = prefs.water_enabled || prefs.workout_enabled;
    if (wantsAny && !device) {
      const r = await enablePush();
      if (!r.ok) {
        setBusy(false);
        return setMsg({ text: r.error, error: true });
      }
      setDevice(true);
    }
    if (prefs.window_start >= prefs.window_end) {
      setBusy(false);
      return setMsg({ text: 'O horário de início precisa ser antes do fim.', error: true });
    }
    const ok = await savePrefs(userId, prefs);
    setBusy(false);
    setMsg(ok ? { text: wantsAny ? 'Lembretes salvos.' : 'Lembretes desligados.' } : { text: 'Não consegui salvar. Verifique a internet.', error: true });
  }

  return (
    <section className="card stack-sm" aria-labelledby="reminders-title">
      <h2 id="reminders-title" className="card__title">
        Lembretes
      </h2>

      {support === 'instalar-no-iphone' ? (
        <p className="muted">
          No iPhone, os lembretes funcionam com o app instalado: no Safari, toque em Compartilhar › <strong>Adicionar à Tela de Início</strong> e abra
          por lá.
        </p>
      ) : support === 'sem-suporte' ? (
        <p className="muted">Este navegador não recebe notificações. No celular, use o app instalado na tela de início.</p>
      ) : !loaded ? (
        <p className="muted">Carregando…</p>
      ) : (
        <>
          {support === 'bloqueado' && (
            <p className="error">As notificações estão bloqueadas para este site. Libere nas configurações do navegador.</p>
          )}

          <label className="toggle">
            <input type="checkbox" checked={prefs.water_enabled} onChange={(e) => set({ water_enabled: e.target.checked })} />
            <span>
              <strong>Água</strong>
              <small>Avisa se você ficar sem registrar água e ainda faltar para a meta.</small>
            </span>
          </label>
          {prefs.water_enabled && (
            <div className="chips chips--light" role="radiogroup" aria-label="Avisar depois de">
              {intervals.map((i) => (
                <button
                  key={i.min}
                  type="button"
                  role="radio"
                  aria-checked={prefs.water_every_min === i.min}
                  className={`chip ${prefs.water_every_min === i.min ? 'chip--on' : ''}`}
                  onClick={() => set({ water_every_min: i.min })}
                >
                  {i.label}
                </button>
              ))}
            </div>
          )}

          <label className="toggle">
            <input type="checkbox" checked={prefs.workout_enabled} onChange={(e) => set({ workout_enabled: e.target.checked })} />
            <span>
              <strong>Treino</strong>
              <small>Um aviso por dia, só em dia de treino e se você ainda não treinou.</small>
            </span>
          </label>
          {prefs.workout_enabled && (
            <label className="field field--inline">
              <span className="field__label">Avisar a partir das</span>
              <input className="input input--time" type="time" value={prefs.workout_time} onChange={(e) => set({ workout_time: e.target.value })} />
            </label>
          )}

          {(prefs.water_enabled || prefs.workout_enabled) && (
            <div className="reminders__window">
              <span className="field__label">Só entre</span>
              <input className="input input--time" type="time" aria-label="Início" value={prefs.window_start} onChange={(e) => set({ window_start: e.target.value })} />
              <span className="field__label">e</span>
              <input className="input input--time" type="time" aria-label="Fim" value={prefs.window_end} onChange={(e) => set({ window_end: e.target.value })} />
            </div>
          )}

          {msg && (
            <p className={msg.error ? 'error' : 'muted'} role={msg.error ? 'alert' : 'status'}>
              {msg.text}
            </p>
          )}

          <div className="workout__actions">
            {device && (
              <button
                type="button"
                className="btn-sm btn-sm--outline"
                disabled={busy}
                onClick={async () => {
                  await disablePush();
                  setDevice(false);
                  setMsg({ text: 'Este aparelho não recebe mais lembretes.' });
                }}
              >
                Parar neste aparelho
              </button>
            )}
            <button type="button" className="btn-sm btn-sm--dark" disabled={busy} onClick={() => void save()}>
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
