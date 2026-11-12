import { useState } from 'react';
import { deleteAccount, signOut, useAuth } from '../../services/auth';
import { cloudEnabled } from '../../services/supabase';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { NumberStepper } from '../../components/ui/NumberStepper';

const liters = (ml: number) => `${(ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`;

function DangerZone() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" className="link-btn link-btn--danger" onClick={() => setOpen(true)}>
        Apagar minha conta
      </button>
    );
  }

  return (
    <section className="card danger" aria-labelledby="danger-title">
      <h2 id="danger-title" className="card__title">
        Apagar a conta
      </h2>
      <p className="muted">
        Isso apaga sua conta e todos os dados guardados no servidor: plano, treinos, peso e medidas. Não dá para desfazer.
      </p>
      <label className="field">
        <span className="field__label">Para confirmar, digite APAGAR</span>
        <input className="input" autoCapitalize="characters" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="workout__actions">
        <button type="button" className="btn-sm btn-sm--outline" onClick={() => setOpen(false)}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-sm btn-sm--danger"
          disabled={typed.trim().toUpperCase() !== 'APAGAR' || busy}
          onClick={async () => {
            setBusy(true);
            const r = await deleteAccount();
            setBusy(false);
            if (!r.ok) setError(r.error);
          }}
        >
          {busy ? 'Apagando…' : 'Apagar para sempre'}
        </button>
      </div>
    </section>
  );
}

export function SettingsPage() {
  const user = useAuth((s) => s.user);
  const goal = useSettingsStore((s) => s.waterGoalMl);
  const setGoal = useSettingsStore((s) => s.setWaterGoal);
  const [error, setError] = useState('');

  return (
    <main className="page">
      <h1 className="page__title">Ajustes</h1>

      <section className="card stack-sm" aria-labelledby="account-title">
        <h2 id="account-title" className="card__title">
          Conta
        </h2>
        {cloudEnabled && user ? (
          <>
            <div>
              {user.displayName && <p className="account__name">{user.displayName}</p>}
              <p className="muted">{user.email}</p>
            </div>
            <button
              type="button"
              className="btn-sm btn-sm--outline account__signout"
              onClick={async () => {
                const r = await signOut();
                if (!r.ok) setError(r.error);
              }}
            >
              Sair da conta
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <p className="muted">Modo só neste aparelho: os dados ficam salvos apenas neste navegador.</p>
        )}
      </section>

      <section className="card stack-sm" aria-labelledby="water-goal-title">
        <h2 id="water-goal-title" className="card__title">
          Meta de água
        </h2>
        <div className="light-stepper">
          <NumberStepper label="Por dia" value={goal} step={250} min={500} format={liters} onChange={setGoal} />
        </div>
      </section>

      {cloudEnabled && user && <DangerZone />}
    </main>
  );
}
