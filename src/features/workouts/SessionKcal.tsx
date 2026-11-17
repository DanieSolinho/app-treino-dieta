import { useState, type FormEvent } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { formatKcal } from '../../lib/calories';

/** Calorias gastas no treino, digitadas do relógio. Mostra o valor salvo ou o campo para preencher. */
export function SessionKcal({ sessionId }: { sessionId: string }) {
  const kcal = useWorkoutStore((s) => s.sessions.find((x) => x.id === sessionId)?.kcal);
  const setKcal = useWorkoutStore((s) => s.setSessionKcal);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const n = Number(text.replace(',', '.'));
  const valid = text.trim() !== '' && Number.isFinite(n) && n >= 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setKcal(sessionId, n);
    setEditing(false);
  }

  if (kcal !== undefined && !editing) {
    return (
      <p className="session-kcal">
        <span>
          Calorias gastas: <strong>{formatKcal(kcal)}</strong>
        </span>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setText(String(kcal));
            setEditing(true);
          }}
        >
          editar
        </button>
      </p>
    );
  }

  return (
    <form className="session-kcal" onSubmit={submit}>
      <label className="session-kcal__field">
        <span className="session-kcal__label">Calorias gastas (do relógio)</span>
        <span className="amount">
          <input
            className="amount__input session-kcal__input"
            type="text"
            inputMode="numeric"
            placeholder="Ex.: 320"
            aria-label="Calorias gastas (do relógio)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="amount__unit">kcal</span>
        </span>
      </label>
      <button type="submit" className="btn-sm btn-sm--dark" disabled={!valid}>
        Salvar
      </button>
    </form>
  );
}
