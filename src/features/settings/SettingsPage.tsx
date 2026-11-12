import { useState } from 'react';
import { useAuth } from '../../services/auth';
import { deleteAccountAndClear, pendingCount, signOutAndClear, syncNow, useSyncMeta, useSyncStatus } from '../../services/sync';
import { cloudEnabled } from '../../services/supabase';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { NumberStepper } from '../../components/ui/NumberStepper';
import { ImportPlan } from './ImportPlan';
import { downloadMyData } from '../../lib/exportData';

function SyncCard() {
  const state = useSyncStatus((s) => s.state);
  const pending = useSyncMeta((s) => pendingCount(s.dirty));
  const last = useSyncMeta((s) => s.lastSyncedAt);
  const [busy, setBusy] = useState(false);

  const when = last
    ? new Date(last).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;
  const text =
    state === 'sincronizando' || busy
      ? 'Sincronizando…'
      : state === 'offline'
        ? `Sem conexão. ${pending ? `${pending} ${pending === 1 ? 'alteração guardada' : 'alterações guardadas'} neste aparelho` : 'Tudo guardado neste aparelho'} — vai quando a internet voltar.`
        : pending
          ? `${pending} ${pending === 1 ? 'alteração' : 'alterações'} aguardando envio.`
          : when
            ? `Tudo sincronizado · ${when}`
            : 'Ainda não sincronizado.';

  return (
    <div className="sync">
      <span className={`sync__dot sync__dot--${state === 'offline' ? 'off' : pending || state === 'sincronizando' ? 'busy' : 'ok'}`} aria-hidden="true" />
      <p className="sync__text" role="status">
        {text}
      </p>
      <button
        type="button"
        className="link-btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await syncNow();
          setBusy(false);
        }}
      >
        Sincronizar agora
      </button>
    </div>
  );
}

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
        Isso apaga sua conta e todos os dados guardados no servidor e neste aparelho: plano, treinos, peso e medidas. Não dá
        para desfazer.
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
            const r = await deleteAccountAndClear();
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
            <SyncCard />
            <button
              type="button"
              className="btn-sm btn-sm--outline account__signout"
              onClick={async () => {
                const r = await signOutAndClear();
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

      <ImportPlan />

      <section className="card stack-sm" aria-labelledby="water-goal-title">
        <h2 id="water-goal-title" className="card__title">
          Meta de água
        </h2>
        <div className="light-stepper">
          <NumberStepper label="Por dia" value={goal} step={250} min={500} format={liters} onChange={setGoal} />
        </div>
      </section>

      <section className="card stack-sm" aria-labelledby="data-title">
        <h2 id="data-title" className="card__title">
          Meus dados
        </h2>
        <p className="muted">Baixe tudo o que o app guarda sobre você (plano, treinos feitos, água, peso e medidas) num arquivo. Serve de backup.</p>
        <button
          type="button"
          className="btn-sm btn-sm--outline"
          onClick={() => downloadMyData(user ? { email: user.email, displayName: user.displayName } : undefined)}
        >
          Baixar meus dados
        </button>
      </section>

      {cloudEnabled && user && <DangerZone />}
    </main>
  );
}
