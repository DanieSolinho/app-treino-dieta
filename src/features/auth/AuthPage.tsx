import { useState, type FormEvent } from 'react';
import { passwordProblem, sendPasswordReset, signIn, signUp, updatePassword } from '../../services/auth';

type Mode = 'entrar' | 'criar' | 'esqueci' | 'nova-senha';

interface Props {
  initialMode?: Mode;
}

const titles: Record<Mode, string> = {
  entrar: 'Entrar',
  criar: 'Criar conta',
  esqueci: 'Recuperar senha',
  'nova-senha': 'Nova senha',
};

function PasswordField({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="password">
        <input
          id={id}
          className="input"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          required
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="password__toggle" aria-label={visible ? 'Esconder senha' : 'Mostrar senha'} onClick={() => setVisible((v) => !v)}>
          {visible ? 'Esconder' : 'Mostrar'}
        </button>
      </div>
    </div>
  );
}

export function AuthPage({ initialMode = 'entrar' }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  function go(next: Mode) {
    setMode(next);
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'criar' || mode === 'nova-senha') {
      const problem = passwordProblem(password);
      if (problem) return setError(problem);
      if (password !== confirm) return setError('As senhas não são iguais.');
    }

    setBusy(true);
    try {
      if (mode === 'entrar') {
        const r = await signIn(email, password);
        if (!r.ok) setError(r.error);
      } else if (mode === 'criar') {
        const r = await signUp(email, password, name);
        if (!r.ok) setError(r.error);
        else if (r.needsConfirmation) {
          go('entrar');
          setInfo(`Enviamos um link de confirmação para ${email.trim()}. Abra o e-mail, confirme e depois entre aqui.`);
        }
      } else if (mode === 'esqueci') {
        const r = await sendPasswordReset(email);
        if (!r.ok) setError(r.error);
        else setInfo(`Se existir uma conta com ${email.trim()}, você vai receber um link para criar uma nova senha.`);
      } else {
        const r = await updatePassword(password);
        if (!r.ok) setError(r.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth__brand">
        <span className="auth__logo" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12" />
          </svg>
        </span>
        <p className="auth__app">Treino & Dieta</p>
      </div>

      <h1 className="page__title">{titles[mode]}</h1>
      {mode === 'esqueci' && <p className="muted">Digite seu e-mail e enviamos um link para criar uma nova senha.</p>}
      {mode === 'nova-senha' && <p className="muted">Escolha uma senha nova para a sua conta.</p>}

      {info && (
        <p className="note" role="status">
          {info}
        </p>
      )}

      <form className="auth__form" onSubmit={submit} noValidate>
        {mode === 'criar' && (
          <div className="field">
            <label className="field__label" htmlFor="auth-name">
              Como quer ser chamada?
            </label>
            <input id="auth-name" className="input" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        {mode !== 'nova-senha' && (
          <div className="field">
            <label className="field__label" htmlFor="auth-email">
              E-mail
            </label>
            <input
              id="auth-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        {mode !== 'esqueci' && (
          <PasswordField
            id="auth-password"
            label={mode === 'nova-senha' ? 'Nova senha' : 'Senha'}
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
          />
        )}

        {(mode === 'criar' || mode === 'nova-senha') && (
          <>
            <PasswordField id="auth-confirm" label="Repita a senha" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            <p className="muted auth__hint">Mínimo de 8 caracteres, com letras e números.</p>
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--dark" disabled={busy}>
          {busy
            ? 'Aguarde…'
            : mode === 'entrar'
              ? 'Entrar'
              : mode === 'criar'
                ? 'Criar conta'
                : mode === 'esqueci'
                  ? 'Enviar link'
                  : 'Salvar nova senha'}
        </button>
      </form>

      <nav className="auth__links" aria-label="Outras opções">
        {mode === 'entrar' && (
          <>
            <button type="button" className="link-btn link-btn--lg" onClick={() => go('esqueci')}>
              Esqueci minha senha
            </button>
            <p className="muted">
              Ainda não tem conta?{' '}
              <button type="button" className="link-btn link-btn--lg link-btn--strong" onClick={() => go('criar')}>
                Criar conta
              </button>
            </p>
          </>
        )}
        {(mode === 'criar' || mode === 'esqueci') && (
          <p className="muted">
            Já tem conta?{' '}
            <button type="button" className="link-btn link-btn--lg link-btn--strong" onClick={() => go('entrar')}>
              Entrar
            </button>
          </p>
        )}
      </nav>
    </main>
  );
}
